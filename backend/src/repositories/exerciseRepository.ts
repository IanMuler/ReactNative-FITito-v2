import { query } from '../config/database';
import { Exercise, CreateExerciseDto, UpdateExerciseDto } from '../types/exercise';

/**
 * Exercise Repository
 * Data access layer for exercises with simple schema (id, name, image, created_at)
 */
export class ExerciseRepository {
  /**
   * Find all exercises
   */
  async findAll(): Promise<Exercise[]> {
    const sql = 'SELECT id, name, image, created_at FROM exercises ORDER BY created_at DESC';
    const result = await query(sql);
    return result.rows;
  }

  /**
   * Find exercise by ID
   */
  async findById(id: number): Promise<Exercise | null> {
    const sql = 'SELECT id, name, image, created_at FROM exercises WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create new exercise
   */
  async create(exerciseData: CreateExerciseDto): Promise<Exercise> {
    const sql = `
      INSERT INTO exercises (name, image)
      VALUES ($1, $2)
      RETURNING id, name, image, created_at
    `;
    const params = [exerciseData.name, exerciseData.image];
    const result = await query(sql, params);
    return result.rows[0];
  }

  /**
   * Update exercise
   */
  async update(id: number, exerciseData: UpdateExerciseDto): Promise<Exercise | null> {
    const sql = `
      UPDATE exercises
      SET name = $1, image = $2
      WHERE id = $3
      RETURNING id, name, image, created_at
    `;
    const params = [exerciseData.name, exerciseData.image, id];
    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Delete exercise (hard delete)
   */
  async delete(id: number): Promise<boolean> {
    const sql = 'DELETE FROM exercises WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);
    return result.rowCount! > 0;
  }
}