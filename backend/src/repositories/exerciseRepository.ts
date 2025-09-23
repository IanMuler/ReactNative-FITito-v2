import { query } from '../config/database';
import { Exercise, CreateExerciseDto, UpdateExerciseDto, ExerciseFilters, ExerciseCategory } from '../types/exercise';

export class ExerciseRepository {
  /**
   * Find all exercises with optional filters
   */
  async findAll(filters: ExerciseFilters = {}): Promise<Exercise[]> {
    let sql = 'SELECT * FROM exercises WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters.category) {
      sql += ` AND category = $${paramIndex++}`;
      params.push(filters.category);
    }

    if (filters.muscle_groups && filters.muscle_groups.length > 0) {
      sql += ` AND muscle_groups && $${paramIndex++}`;
      params.push(filters.muscle_groups);
    }

    if (filters.equipment && filters.equipment.length > 0) {
      sql += ` AND equipment && $${paramIndex++}`;
      params.push(filters.equipment);
    }

    if (filters.difficulty_level) {
      sql += ` AND difficulty_level = $${paramIndex++}`;
      params.push(filters.difficulty_level);
    }

    if (filters.is_compound !== undefined) {
      sql += ` AND is_compound = $${paramIndex++}`;
      params.push(filters.is_compound);
    }

    if (filters.is_bodyweight !== undefined) {
      sql += ` AND is_bodyweight = $${paramIndex++}`;
      params.push(filters.is_bodyweight);
    }

    if (filters.is_active !== undefined) {
      sql += ` AND is_active = $${paramIndex++}`;
      params.push(filters.is_active);
    }

    // Full text search
    if (filters.search) {
      sql += ` AND to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(array_to_string(muscle_groups, ' '), '') || ' ' || coalesce(array_to_string(equipment, ' '), '')) @@ plainto_tsquery('english', $${paramIndex++})`;
      params.push(filters.search);
    }

    // Order by name
    sql += ' ORDER BY name ASC';

    // Pagination
    if (filters.limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Find exercise by ID
   */
  async findById(id: number): Promise<Exercise | null> {
    const sql = 'SELECT * FROM exercises WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find exercises by category
   */
  async findByCategory(category: ExerciseCategory): Promise<Exercise[]> {
    const sql = 'SELECT * FROM exercises WHERE category = $1 AND is_active = true ORDER BY name ASC';
    const result = await query(sql, [category]);
    return result.rows;
  }

  /**
   * Search exercises by name
   */
  async searchByName(searchTerm: string): Promise<Exercise[]> {
    const sql = `
      SELECT * FROM exercises 
      WHERE to_tsvector('english', name) @@ plainto_tsquery('english', $1) 
      AND is_active = true 
      ORDER BY name ASC
    `;
    const result = await query(sql, [searchTerm]);
    return result.rows;
  }

  /**
   * Create new exercise
   */
  async create(exerciseData: CreateExerciseDto): Promise<Exercise> {
    const sql = `
      INSERT INTO exercises (
        name, category, muscle_groups, equipment, instructions, description,
        difficulty_level, is_compound, is_bodyweight, video_url, image_url,
        tips, common_mistakes, variations, is_active, created_by_admin
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *
    `;

    const params = [
      exerciseData.name,
      exerciseData.category,
      exerciseData.muscle_groups || [],
      exerciseData.equipment || [],
      exerciseData.instructions || [],
      exerciseData.description,
      exerciseData.difficulty_level || 1,
      exerciseData.is_compound || false,
      exerciseData.is_bodyweight || false,
      exerciseData.video_url,
      exerciseData.image_url,
      exerciseData.tips || [],
      exerciseData.common_mistakes || [],
      exerciseData.variations || [],
      exerciseData.is_active !== undefined ? exerciseData.is_active : true,
      exerciseData.created_by_admin !== undefined ? exerciseData.created_by_admin : false
    ];

    const result = await query(sql, params);
    return result.rows[0];
  }

  /**
   * Update exercise
   */
  async update(id: number, exerciseData: UpdateExerciseDto): Promise<Exercise | null> {
    const setClause: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Build dynamic SET clause
    Object.entries(exerciseData).forEach(([key, value]) => {
      if (value !== undefined) {
        setClause.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    });

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    // Add updated_at
    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add ID parameter
    params.push(id);

    const sql = `
      UPDATE exercises 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Delete exercise (soft delete by setting is_active = false)
   */
  async delete(id: number): Promise<boolean> {
    const sql = 'UPDATE exercises SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rowCount! > 0;
  }

  /**
   * Hard delete exercise (permanently remove from database)
   */
  async hardDelete(id: number): Promise<boolean> {
    const sql = 'DELETE FROM exercises WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rowCount! > 0;
  }

  /**
   * Get exercises count with filters
   */
  async count(filters: ExerciseFilters = {}): Promise<number> {
    let sql = 'SELECT COUNT(*) FROM exercises WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    // Apply same filters as findAll (without pagination)
    if (filters.category) {
      sql += ` AND category = $${paramIndex++}`;
      params.push(filters.category);
    }

    if (filters.muscle_groups && filters.muscle_groups.length > 0) {
      sql += ` AND muscle_groups && $${paramIndex++}`;
      params.push(filters.muscle_groups);
    }

    if (filters.equipment && filters.equipment.length > 0) {
      sql += ` AND equipment && $${paramIndex++}`;
      params.push(filters.equipment);
    }

    if (filters.difficulty_level) {
      sql += ` AND difficulty_level = $${paramIndex++}`;
      params.push(filters.difficulty_level);
    }

    if (filters.is_compound !== undefined) {
      sql += ` AND is_compound = $${paramIndex++}`;
      params.push(filters.is_compound);
    }

    if (filters.is_bodyweight !== undefined) {
      sql += ` AND is_bodyweight = $${paramIndex++}`;
      params.push(filters.is_bodyweight);
    }

    if (filters.is_active !== undefined) {
      sql += ` AND is_active = $${paramIndex++}`;
      params.push(filters.is_active);
    }

    if (filters.search) {
      sql += ` AND to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(array_to_string(muscle_groups, ' '), '') || ' ' || coalesce(array_to_string(equipment, ' '), '')) @@ plainto_tsquery('english', $${paramIndex++})`;
      params.push(filters.search);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get unique muscle groups from all exercises
   */
  async getUniqueMuscleGroups(): Promise<string[]> {
    const sql = `
      SELECT DISTINCT unnest(muscle_groups) as muscle_group 
      FROM exercises 
      WHERE is_active = true 
      ORDER BY muscle_group ASC
    `;
    const result = await query(sql);
    return result.rows.map(row => row.muscle_group);
  }

  /**
   * Get unique equipment from all exercises
   */
  async getUniqueEquipment(): Promise<string[]> {
    const sql = `
      SELECT DISTINCT unnest(equipment) as equipment_item 
      FROM exercises 
      WHERE is_active = true AND array_length(equipment, 1) > 0
      ORDER BY equipment_item ASC
    `;
    const result = await query(sql);
    return result.rows.map(row => row.equipment_item);
  }
}