
import { ProfileAwareRepository } from './BaseRepository';
import {
  Routine,
  RoutineWithCount,
  RoutineWithExercises,
  RoutineExerciseDetail,
  CreateRoutineDto,
  UpdateRoutineDto
} from '@/types/routine';
import { logger } from '@/utils/logger';

/**
 * Routine Repository
 * SQL queries copied exactly from exercises-simple.js lines 638-1100
 */
export class RoutineRepository extends ProfileAwareRepository<Routine> {
  protected tableName = 'routines';
  protected primaryKey = 'id';

  /**
   * Get all routines for a profile with exercise count
   * Original: lines 652-672
   */
  async findAllWithCount(profileId: number): Promise<RoutineWithCount[]> {
    const query = `
      SELECT
        r.id,
        r.name,
        r.description,
        r.color,
        r.duration_minutes,
        r.difficulty_level,
        r.is_active,
        r.is_favorite,
        r.tags,
        r.notes,
        r.created_at,
        r.updated_at,
        COUNT(re.id) as exercise_count
      FROM routines r
      LEFT JOIN routine_exercises re ON r.id = re.routine_id
      WHERE r.profile_id = $1 AND r.is_active = true
      GROUP BY r.id, r.name, r.description, r.color, r.duration_minutes, r.difficulty_level, r.is_active, r.is_favorite, r.tags, r.notes, r.created_at, r.updated_at
      ORDER BY r.is_favorite DESC, r.created_at DESC
    `;

    const result = await this.executeQuery<RoutineWithCount>(query, [profileId]);
    return result.rows;
  }

  /**
   * Get routine by ID with exercises
   * Original: lines 700-739
   */
  async findByIdWithExercises(
    id: number,
    profileId: number
  ): Promise<RoutineWithExercises | null> {
    // Get routine info
    const routineQuery = `
      SELECT id, name, description, color, duration_minutes, difficulty_level,
             is_active, is_favorite, tags, notes, created_at, updated_at
      FROM routines
      WHERE id = $1 AND profile_id = $2
    `;

    const routineResult = await this.executeQuery(routineQuery, [id, profileId]);

    if (routineResult.rows.length === 0) {
      return null;
    }

    // Get exercises for this routine
    const exercisesQuery = `
      SELECT
        re.id,
        re.routine_id,
        re.exercise_id,
        re.order_in_routine,
        re.sets,
        re.reps,
        re.weight,
        re.duration_seconds,
        re.rest_time_seconds,
        re.rpe,
        re.notes,
        re.is_superset,
        re.superset_group,
        re.created_at,
        re.updated_at,
        e.name as exercise_name,
        e.image as exercise_image
      FROM routine_exercises re
      JOIN exercises e ON re.exercise_id = e.id
      WHERE re.routine_id = $1
      ORDER BY re.order_in_routine ASC
    `;

    const exercisesResult = await this.executeQuery(exercisesQuery, [id]);

    const exercises: RoutineExerciseDetail[] = exercisesResult.rows.map((row: any) => ({
      id: row.id,
      routine_id: row.routine_id,
      exercise_id: row.exercise_id,
      order_in_routine: row.order_in_routine,
      sets: row.sets,
      reps: row.reps,
      weight: row.weight,
      duration_seconds: row.duration_seconds,
      rest_time_seconds: row.rest_time_seconds,
      rpe: row.rpe,
      notes: row.notes,
      is_superset: row.is_superset,
      superset_group: row.superset_group,
      created_at: row.created_at,
      updated_at: row.updated_at,
      exercise: {
        id: row.exercise_id,
        name: row.exercise_name,
        image: row.exercise_image
      }
    }));

    return {
      ...routineResult.rows[0],
      exercises
    } as RoutineWithExercises;
  }

  /**
   * Create routine with exercises in transaction
   * Original: lines 781-883
   */
  async createWithExercises(data: CreateRoutineDto): Promise<Routine> {
    return this.executeTransaction(async (client) => {
      const {
        profile_id,
        name,
        description,
        color = '#4A90E2',
        duration_minutes,
        difficulty_level = 1,
        is_favorite = false,
        tags = [],
        notes,
        exercises
      } = data;

      // Validate all exercise IDs exist
      const exerciseIds = exercises.map(ex => ex.exercise_id);
      const existingExercises = await client.query(
        `SELECT id FROM exercises WHERE id = ANY($1)`,
        [exerciseIds]
      );

      const existingIds = existingExercises.rows.map((row: any) => row.id);
      const missingIds = exerciseIds.filter(id => !existingIds.includes(id));

      if (missingIds.length > 0) {
        throw new Error(`Invalid exercise IDs: ${missingIds.join(', ')}. Please select valid exercises.`);
      }

      // Create routine
      const routineResult = await client.query(
        `INSERT INTO routines (profile_id, name, description, color, duration_minutes, difficulty_level, is_favorite, tags, notes, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, profile_id, name, description, color, duration_minutes, difficulty_level, is_favorite, tags, notes, is_active, created_at, updated_at`,
        [profile_id, name, description, color, duration_minutes, difficulty_level, is_favorite, tags, notes, true]
      );

      if (!routineResult.rows[0]) {
        throw new Error('Failed to create routine');
      }

      const routineId = routineResult.rows[0].id;

      // Create routine exercises
      const exercisePromises = exercises.map((exercise, index) => {
        return client.query(
          `INSERT INTO routine_exercises
           (routine_id, exercise_id, order_in_routine, sets, reps, weight, duration_seconds, rest_time_seconds, rpe, notes, is_superset, superset_group)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id`,
          [
            routineId,
            exercise.exercise_id,
            exercise.order_in_routine || (index + 1),
            exercise.sets || 3,
            exercise.reps || 12,
            exercise.weight || null,
            exercise.duration_seconds || null,
            exercise.rest_time_seconds || 60,
            exercise.rpe || null,
            exercise.notes || null,
            exercise.is_superset || false,
            exercise.superset_group || null
          ]
        );
      });

      await Promise.all(exercisePromises);

      logger.info('Routine created successfully', { id: routineId });
      return routineResult.rows[0] as Routine;
    });
  }

  /**
   * Update routine with exercises in transaction
   * Original: lines 887-1059
   */
  async updateWithExercises(
    id: number,
    data: UpdateRoutineDto
  ): Promise<Routine> {
    return this.executeTransaction(async (client) => {
      const {
        profile_id,
        name,
        description,
        color,
        duration_minutes,
        difficulty_level,
        is_favorite,
        tags,
        notes,
        exercises
      } = data;

      // Check if routine exists and belongs to profile
      const existingRoutine = await client.query(
        `SELECT id FROM routines
         WHERE id = $1 AND profile_id = $2`,
        [id, profile_id]
      );

      if (existingRoutine.rows.length === 0) {
        throw new Error('Routine not found');
      }

      // Update routine
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCounter = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramCounter++}`);
        updateValues.push(name);
      }
      if (description !== undefined) {
        updateFields.push(`description = $${paramCounter++}`);
        updateValues.push(description);
      }
      if (color !== undefined) {
        updateFields.push(`color = $${paramCounter++}`);
        updateValues.push(color);
      }
      if (duration_minutes !== undefined) {
        updateFields.push(`duration_minutes = $${paramCounter++}`);
        updateValues.push(duration_minutes);
      }
      if (difficulty_level !== undefined) {
        updateFields.push(`difficulty_level = $${paramCounter++}`);
        updateValues.push(difficulty_level);
      }
      if (is_favorite !== undefined) {
        updateFields.push(`is_favorite = $${paramCounter++}`);
        updateValues.push(is_favorite);
      }
      if (tags !== undefined) {
        updateFields.push(`tags = $${paramCounter++}`);
        updateValues.push(tags);
      }
      if (notes !== undefined) {
        updateFields.push(`notes = $${paramCounter++}`);
        updateValues.push(notes);
      }

      let routineResult;
      if (updateFields.length > 0) {
        updateValues.push(id);
        const updateQuery = `
          UPDATE routines
          SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramCounter}
          RETURNING id, profile_id, name, description, color, duration_minutes, difficulty_level, is_favorite, tags, notes, is_active, created_at, updated_at
        `;

        routineResult = await client.query(updateQuery, updateValues);
      } else {
        routineResult = await client.query(
          `SELECT id, profile_id, name, description, color, duration_minutes, difficulty_level, is_favorite, tags, notes, is_active, created_at, updated_at
           FROM routines WHERE id = $1`,
          [id]
        );
      }

      if (!routineResult.rows[0]) {
        throw new Error('Routine not found');
      }

      // Update exercises if provided
      if (exercises && Array.isArray(exercises)) {
        if (exercises.length === 0) {
          throw new Error('At least one exercise is required');
        }

        // Validate exercise IDs
        const exerciseIds = exercises.map(ex => ex.exercise_id);
        const existingExercises = await client.query(
          `SELECT id FROM exercises WHERE id = ANY($1)`,
          [exerciseIds]
        );

        const existingIds = existingExercises.rows.map((row: any) => row.id);
        const missingIds = exerciseIds.filter(id => !existingIds.includes(id));

        if (missingIds.length > 0) {
          throw new Error(`Invalid exercise IDs: ${missingIds.join(', ')}. Please select valid exercises.`);
        }

        // Delete existing exercises
        await client.query('DELETE FROM routine_exercises WHERE routine_id = $1', [id]);

        // Insert new exercises
        const exercisePromises = exercises.map((exercise, index) => {
          return client.query(
            `INSERT INTO routine_exercises
             (routine_id, exercise_id, order_in_routine, sets, reps, weight, duration_seconds, rest_time_seconds, rpe, notes, is_superset, superset_group)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              id,
              exercise.exercise_id,
              exercise.order_in_routine || (index + 1),
              exercise.sets || 3,
              exercise.reps || 12,
              exercise.weight || null,
              exercise.duration_seconds || null,
              exercise.rest_time_seconds || 60,
              exercise.rpe || null,
              exercise.notes || null,
              exercise.is_superset || false,
              exercise.superset_group || null
            ]
          );
        });

        await Promise.all(exercisePromises);
      }

      logger.info('Routine updated successfully', { id });
      return routineResult.rows[0] as Routine;
    });
  }

  /**
   * Soft delete routine
   * Original: lines 1074-1079
   */
  async softDelete(id: number, profileId: number): Promise<boolean> {
    const query = `
      UPDATE routines
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND profile_id = $2 AND is_active = true
      RETURNING id
    `;

    const result = await this.executeQuery(query, [id, profileId]);
    return result.rows.length > 0;
  }
}
