import { PoolClient } from 'pg';
import { ProfileAwareRepository } from './BaseRepository';
import {
  TrainingDay,
  TrainingDayWithCount,
  TrainingDayWithExercises,
  TrainingDayExerciseDetail,
  CreateTrainingDayDto,
  UpdateTrainingDayDto
} from '@/types/training-day';
import { logger } from '@/utils/logger';

/**
 * Training Day Repository
 * SQL queries copied exactly from exercises-simple.js lines 222-636
 */
export class TrainingDayRepository extends ProfileAwareRepository<TrainingDay> {
  protected tableName = 'training_days';
  protected primaryKey = 'id';

  /**
   * Get all training days for a profile with exercise count
   * Original: lines 233-247
   */
  async findAllWithCount(profileId: number): Promise<TrainingDayWithCount[]> {
    const query = `
      SELECT
        td.id,
        td.name,
        td.description,
        td.is_active,
        td.created_at,
        td.updated_at,
        COUNT(tde.id) as exercise_count
      FROM training_days td
      LEFT JOIN training_day_exercises tde ON td.id = tde.training_day_id
      WHERE td.profile_id = $1 AND td.is_active = true
      GROUP BY td.id, td.name, td.description, td.is_active, td.created_at, td.updated_at
      ORDER BY td.created_at DESC
    `;

    const result = await this.executeQuery<TrainingDayWithCount>(query, [profileId]);
    return result.rows;
  }

  /**
   * Get training day by ID with exercises
   * Original: lines 276-308
   */
  async findByIdWithExercises(
    id: number,
    profileId: number
  ): Promise<TrainingDayWithExercises | null> {
    // Get training day info
    const dayQuery = `
      SELECT id, profile_id, name, description, is_active, created_at, updated_at
      FROM training_days
      WHERE id = $1 AND profile_id = $2
    `;

    const dayResult = await this.executeQuery<TrainingDay>(dayQuery, [id, profileId]);

    if (dayResult.rows.length === 0) {
      return null;
    }

    // Get exercises for this training day
    const exercisesQuery = `
      SELECT
        tde.id,
        tde.training_day_id,
        tde.exercise_id,
        tde.order_index,
        tde.sets,
        tde.reps,
        tde.weight,
        tde.rest_seconds,
        tde.notes,
        tde.created_at,
        e.name as exercise_name,
        e.image as exercise_image
      FROM training_day_exercises tde
      JOIN exercises e ON tde.exercise_id = e.id
      WHERE tde.training_day_id = $1
      ORDER BY tde.order_index ASC
    `;

    const exercisesResult = await this.executeQuery(exercisesQuery, [id]);

    const exercises: TrainingDayExerciseDetail[] = exercisesResult.rows.map((row: any) => ({
      id: row.id,
      training_day_id: row.training_day_id,
      exercise_id: row.exercise_id,
      order_index: row.order_index,
      sets: row.sets,
      reps: row.reps,
      weight: row.weight,
      rest_seconds: row.rest_seconds,
      notes: row.notes,
      created_at: row.created_at,
      exercise: {
        id: row.exercise_id,
        name: row.exercise_name,
        image: row.exercise_image
      }
    }));

    return {
      ...dayResult.rows[0],
      exercises
    } as TrainingDayWithExercises;
  }

  /**
   * Create training day with exercises in transaction
   * Original: lines 345-464
   */
  async createWithExercises(data: CreateTrainingDayDto): Promise<TrainingDay> {
    return this.executeTransaction(async (client: PoolClient) => {
      const { profile_id, name, description, exercises } = data;

      logger.info('Creating training day', {
        profile_id,
        name,
        description,
        exerciseCount: exercises.length
      });

      // Check for duplicate name
      const duplicateCheck = await client.query(
        `SELECT id FROM training_days
         WHERE profile_id = $1 AND name = $2 AND is_active = true`,
        [profile_id, name]
      );

      if (duplicateCheck.rows.length > 0) {
        logger.error('Duplicate training day name found', { profile_id, name });
        throw new Error('A training day with this name already exists');
      }

      // Create training day
      const dayResult = await client.query<TrainingDay>(
        `INSERT INTO training_days (profile_id, name, description, is_active)
         VALUES ($1, $2, $3, $4)
         RETURNING id, profile_id, name, description, is_active, created_at, updated_at`,
        [profile_id, name, description || null, true]
      );

      if (!dayResult.rows[0]) {
        throw new Error('Failed to create training day');
      }

      const trainingDayId = dayResult.rows[0].id;

      // Validate all exercise IDs exist
      const exerciseIds = exercises.map(ex => ex.exercise_id);
      if (exerciseIds.length > 0) {
        const existingExercises = await client.query(
          `SELECT id FROM exercises WHERE id = ANY($1)`,
          [exerciseIds]
        );

        const existingIds = existingExercises.rows.map(row => row.id);
        const missingIds = exerciseIds.filter(id => !existingIds.includes(id));

        if (missingIds.length > 0) {
          throw new Error(`Invalid exercise IDs: ${missingIds.join(', ')}. Please select valid exercises.`);
        }
      }

      // Create training day exercises
      const exercisePromises = exercises.map((exercise, index) => {
        return client.query(
          `INSERT INTO training_day_exercises
           (training_day_id, exercise_id, order_index, sets, reps, weight, rest_seconds, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            trainingDayId,
            exercise.exercise_id,
            exercise.order_index || index,
            exercise.sets || 3,
            exercise.reps || 12,
            exercise.weight || null,
            exercise.rest_seconds || 60,
            exercise.notes || null
          ]
        );
      });

      await Promise.all(exercisePromises);

      logger.info('Training day created successfully', { id: trainingDayId });
      return dayResult.rows[0];
    });
  }

  /**
   * Update training day with exercises in transaction
   * Original: lines 467-596
   */
  async updateWithExercises(
    id: number,
    data: UpdateTrainingDayDto
  ): Promise<TrainingDay> {
    return this.executeTransaction(async (client: PoolClient) => {
      const { profile_id, name, description, exercises } = data;

      // Check if training day exists and belongs to profile
      const existingDay = await client.query(
        `SELECT id FROM training_days
         WHERE id = $1 AND profile_id = $2`,
        [id, profile_id]
      );

      if (existingDay.rows.length === 0) {
        throw new Error('Training day not found');
      }

      // Check for duplicate name (excluding current training day)
      if (name) {
        const duplicateCheck = await client.query(
          `SELECT id FROM training_days
           WHERE profile_id = $1 AND name = $2 AND id != $3 AND is_active = true`,
          [profile_id, name, id]
        );

        if (duplicateCheck.rows.length > 0) {
          throw new Error('A training day with this name already exists');
        }
      }

      // Update training day
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

      let dayResult;
      if (updateFields.length > 0) {
        updateValues.push(id);
        const updateQuery = `
          UPDATE training_days
          SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramCounter}
          RETURNING id, profile_id, name, description, is_active, created_at, updated_at
        `;

        dayResult = await client.query<TrainingDay>(updateQuery, updateValues);
      } else {
        dayResult = await client.query<TrainingDay>(
          `SELECT id, profile_id, name, description, is_active, created_at, updated_at
           FROM training_days WHERE id = $1`,
          [id]
        );
      }

      if (!dayResult.rows[0]) {
        throw new Error('Training day not found');
      }

      // Update exercises if provided
      if (exercises && Array.isArray(exercises)) {
        if (exercises.length === 0) {
          throw new Error('At least one exercise is required');
        }

        // Delete existing exercises
        await client.query('DELETE FROM training_day_exercises WHERE training_day_id = $1', [id]);

        // Insert new exercises
        const exercisePromises = exercises.map((exercise, index) => {
          return client.query(
            `INSERT INTO training_day_exercises
             (training_day_id, exercise_id, order_index, sets, reps, weight, rest_seconds, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              id,
              exercise.exercise_id,
              exercise.order_index || index,
              exercise.sets || 3,
              exercise.reps || 12,
              exercise.weight || null,
              exercise.rest_seconds || 60,
              exercise.notes || null
            ]
          );
        });

        await Promise.all(exercisePromises);
      }

      logger.info('Training day updated successfully', { id });
      return dayResult.rows[0];
    });
  }

  /**
   * Soft delete training day
   * Original: lines 611-616
   */
  async softDelete(id: number, profileId: number): Promise<boolean> {
    const query = `
      UPDATE training_days
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND profile_id = $2 AND is_active = true
      RETURNING id
    `;

    const result = await this.executeQuery(query, [id, profileId]);
    return result.rows.length > 0;
  }
}
