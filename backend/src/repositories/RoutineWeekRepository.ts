
import { ProfileAwareRepository } from './BaseRepository';
import {
  RoutineWeek,
  RoutineWeekWithDetails,
  UpdateRoutineWeekDto,
  ConfigurationResponse,
  ExerciseConfigItem,
} from '@/types/routine-week';
import { logger } from '@/utils/logger';

/**
 * Routine Week Repository
 * SQL queries from exercises-simple.js lines 1107-1767
 */
export class RoutineWeekRepository extends ProfileAwareRepository<RoutineWeek> {
  protected tableName = 'routine_weeks';
  protected primaryKey = 'id';

  /**
   * Get all routine weeks for a profile
   * Original: lines 1183-1204
   */
  async findAllForProfile(profileId: number): Promise<RoutineWeekWithDetails[]> {
    const query = `
      SELECT
        rw.id,
        rw.profile_id,
        rw.day_of_week,
        rw.day_name,
        rw.is_rest_day,
        rw.routine_id,
        rw.routine_name,
        rw.training_day_id,
        rw.exercises_config,
        rw.created_at,
        rw.updated_at,
        CASE
          WHEN jsonb_array_length(rw.exercises_config) > 0 THEN true
          ELSE false
        END as has_configuration
      FROM routine_weeks rw
      WHERE rw.profile_id = $1
      ORDER BY rw.day_of_week
    `;

    const result = await this.executeQuery<RoutineWeekWithDetails>(query, [profileId]);
    return result.rows;
  }

  /**
   * Update routine week
   * Original: lines 1310-1360
   */
  async updateWeek(id: number, data: UpdateRoutineWeekDto): Promise<RoutineWeek> {
    return this.executeTransaction(async (client) => {
      const { profile_id, routine_id, training_day_id, is_rest_day } = data;

      let finalRoutineId = routine_id;

      // Validate routine if provided
      if (routine_id) {
        const routineCheck = await client.query(
          `SELECT id FROM routines WHERE id = $1 AND profile_id = $2 AND is_active = true`,
          [routine_id, profile_id]
        );

        if (routineCheck.rows.length === 0) {
          throw new Error('Routine not found or does not belong to this profile');
        }
      } else if (training_day_id) {
        // Create routine from training day
        const trainingDayCheck = await client.query(
          `SELECT id, name FROM training_days WHERE id = $1 AND profile_id = $2`,
          [training_day_id, profile_id]
        );

        if (trainingDayCheck.rows.length === 0) {
          throw new Error('Training day not found or does not belong to this profile');
        }

        const trainingDay = trainingDayCheck.rows[0];
        const createRoutineResult = await client.query(
          `INSERT INTO routines (name, description, profile_id, is_active, created_at)
           VALUES ($1, $2, $3, true, NOW())
           RETURNING id`,
          [`Rutina - ${trainingDay.name}`, `Rutina creada automáticamente desde ${trainingDay.name}`, profile_id]
        );

        finalRoutineId = createRoutineResult.rows[0].id;
      }

      // Build update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;

      if (finalRoutineId !== undefined) {
        updateFields.push(`routine_id = $${paramCount}`);
        updateValues.push(finalRoutineId);
        paramCount++;
      }

      if (is_rest_day !== undefined) {
        updateFields.push(`is_rest_day = $${paramCount}`);
        updateValues.push(is_rest_day);
        paramCount++;
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(id, profile_id);

      const result = await client.query(
        `UPDATE routine_weeks
         SET ${updateFields.join(', ')}
         WHERE id = $${paramCount} AND profile_id = $${paramCount + 1}
         RETURNING id, profile_id, day_of_week, day_name, is_rest_day, routine_id, routine_name, training_day_id, exercises_config, updated_at`,
        updateValues
      );

      if (result.rows.length === 0) {
        throw new Error('Routine week not found or does not belong to this profile');
      }

      const routineWeek = result.rows[0]!;
      return routineWeek;
    });
  }

  /**
   * Get routine week configuration
   * Original: lines 1504-1562
   */
  async getConfiguration(id: number, profileId: number): Promise<ConfigurationResponse | null> {
    const query = `
      SELECT
        rw.id,
        rw.day_name,
        rw.routine_id,
        rw.routine_name,
        rw.exercises_config
      FROM routine_weeks rw
      WHERE rw.id = $1 AND rw.profile_id = $2
    `;

    const result = await this.executeQuery(query, [id, profileId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0]!;
    const exercises = (row['exercises_config'] || []) as ExerciseConfigItem[];

    return {
      routine_week: {
        id: row['id'] as number,
        day_name: row['day_name'] as string,
        routine_id: row['routine_id'] as number | null,
        routine_name: row['routine_name'] as string | null,
      },
      exercises,
    };
  }

  /**
   * Update routine week configuration
   * Original: lines 1642-1764
   */
  async updateConfiguration(
    id: number,
    profileId: number,
    exercises: Array<{
      exercise_id: number;
      sets_config: any[];
      notes?: string;
      training_day_id?: number;
    }>,
    routineName: string | null
  ): Promise<ExerciseConfigItem[]> {
    return this.executeTransaction(async (client) => {
      // Verify routine week belongs to profile
      const routineWeekCheck = await client.query(
        `SELECT id FROM routine_weeks WHERE id = $1 AND profile_id = $2`,
        [id, profileId]
      );

      if (routineWeekCheck.rows.length === 0) {
        throw new Error('Routine week not found or does not belong to this profile');
      }

      // Build exercises config array with validation
      const exercisesConfig: ExerciseConfigItem[] = [];

      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i]!;

        // Validate exercise exists
        const exerciseCheck = await client.query(
          `SELECT id, name, image FROM exercises WHERE id = $1`,
          [exercise.exercise_id]
        );

        if (exerciseCheck.rows.length === 0) {
          throw new Error(`Exercise with ID ${exercise.exercise_id} not found`);
        }

        const exerciseData = exerciseCheck.rows[0]!;

        exercisesConfig.push({
          exercise_id: exercise.exercise_id,
          exercise_name: exerciseData['name'] as string,
          exercise_image: exerciseData['image'] as string,
          order_index: i,
          sets_config: exercise.sets_config || [],
          notes: exercise.notes || '',
        });
      }

      // Determine routine name
      let finalRoutineName: string | null = null;
      const trainingDayId =
        exercises.length > 0 && exercises[0]!['training_day_id']
          ? (exercises[0]!['training_day_id'] as number)
          : null;

      if (exercises.length > 0) {
        if (routineName) {
          finalRoutineName = routineName;
        } else if (trainingDayId) {
          const trainingDayResult = await client.query(
            `SELECT name FROM training_days WHERE id = $1`,
            [trainingDayId]
          );
          finalRoutineName =
            trainingDayResult.rows.length > 0
              ? (trainingDayResult.rows[0]!['name'] as string)
              : 'Entreno configurado';
        } else {
          finalRoutineName = 'Entreno configurado';
        }
      }

      // Update routine week with configuration
      await client.query(
        `UPDATE routine_weeks
         SET
           routine_name = $1,
           training_day_id = $2,
           exercises_config = $3,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND profile_id = $5`,
        [finalRoutineName, trainingDayId, JSON.stringify(exercisesConfig), id, profileId]
      );

      logger.info('Updated routine week configuration', {
        routineWeekId: id,
        exerciseCount: exercisesConfig.length,
      });

      return exercisesConfig;
    });
  }

  /**
   * Delete routine week configuration
   * Original: lines 1767-1818
   */
  async deleteConfiguration(id: number, profileId: number): Promise<number> {
    const query = `
      UPDATE routine_weeks
      SET
        routine_id = NULL,
        routine_name = NULL,
        training_day_id = NULL,
        exercises_config = '[]',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND profile_id = $2
      RETURNING id
    `;

    const result = await this.executeQuery(query, [id, profileId]);

    if (result.rows.length === 0) {
      throw new Error('Routine week not found or does not belong to this profile');
    }

    logger.info('Deleted routine week configuration', { routineWeekId: id });
    return result.rowCount;
  }
}
