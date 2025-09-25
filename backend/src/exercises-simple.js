const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fitito_dev',
  user: process.env.DB_USER || 'fitito_user',
  password: process.env.DB_PASSWORD || 'fitito_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Server is unhealthy',
      error: error.message
    });
  }
});

// Get all exercises
app.get('/api/v1/exercises', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, image, created_at FROM exercises ORDER BY created_at DESC');
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get exercise by ID
app.get('/api/v1/exercises/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT id, name, image, created_at FROM exercises WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exercise not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Create exercise
app.post('/api/v1/exercises', async (req, res) => {
  try {
    const { name, image } = req.body;
    
    if (!name || !image) {
      return res.status(400).json({
        success: false,
        error: 'Name and image are required'
      });
    }
    
    const result = await pool.query(
      'INSERT INTO exercises (name, image) VALUES ($1, $2) RETURNING id, name, image, created_at',
      [name, image]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Exercise created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Update exercise
app.put('/api/v1/exercises/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image } = req.body;
    
    if (!name || !image) {
      return res.status(400).json({
        success: false,
        error: 'Name and image are required'
      });
    }
    
    const result = await pool.query(
      'UPDATE exercises SET name = $1, image = $2 WHERE id = $3 RETURNING id, name, image, created_at',
      [name, image, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exercise not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Exercise updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Delete exercise
app.delete('/api/v1/exercises/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM exercises WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exercise not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// TRAINING DAYS ENDPOINTS

// Get all training days for a profile
app.get('/api/v1/training-days', async (req, res) => {
  try {
    const { profile_id } = req.query;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    const result = await pool.query(`
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
    `, [profile_id]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get training day by ID with exercises
app.get('/api/v1/training-days/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { profile_id } = req.query;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    // Get training day info
    const dayResult = await pool.query(`
      SELECT id, name, description, is_active, created_at, updated_at
      FROM training_days 
      WHERE id = $1 AND profile_id = $2
    `, [id, profile_id]);
    
    if (dayResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Training day not found'
      });
    }
    
    // Get exercises for this training day
    const exercisesResult = await pool.query(`
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
    `, [id]);
    
    const trainingDay = {
      ...dayResult.rows[0],
      exercises: exercisesResult.rows.map(row => ({
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
      }))
    };
    
    res.json({
      success: true,
      data: trainingDay
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Create training day
app.post('/api/v1/training-days', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { profile_id, name, description, exercises = [] } = req.body;
    
    if (!profile_id || !name) {
      return res.status(400).json({
        success: false,
        error: 'profile_id and name are required'
      });
    }
    
    if (exercises.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one exercise is required'
      });
    }
    
    await client.query('BEGIN');
    
    // Check for duplicate name for this profile
    const duplicateCheck = await client.query(`
      SELECT id FROM training_days 
      WHERE profile_id = $1 AND name = $2 AND is_active = true
    `, [profile_id, name]);
    
    if (duplicateCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'A training day with this name already exists'
      });
    }
    
    // Create training day
    const dayResult = await client.query(`
      INSERT INTO training_days (profile_id, name, description, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, is_active, created_at, updated_at
    `, [profile_id, name, description || null, true]);
    
    const trainingDayId = dayResult.rows[0].id;
    
    // Validate all exercise IDs exist before inserting
    const exerciseIds = exercises.map(ex => ex.exercise_id);
    if (exerciseIds.length > 0) {
      const existingExercises = await client.query(
        `SELECT id FROM exercises WHERE id = ANY($1)`,
        [exerciseIds]
      );
      
      const existingIds = existingExercises.rows.map(row => row.id);
      const missingIds = exerciseIds.filter(id => !existingIds.includes(id));
      
      if (missingIds.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Invalid exercise IDs: ${missingIds.join(', ')}. Please select valid exercises.`
        });
      }
    }

    // Create training day exercises
    const exercisePromises = exercises.map((exercise, index) => {
      return client.query(`
        INSERT INTO training_day_exercises 
        (training_day_id, exercise_id, order_index, sets, reps, weight, rest_seconds, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        trainingDayId,
        exercise.exercise_id,
        exercise.order_index || index,
        exercise.sets || 3,
        exercise.reps || 12,
        exercise.weight || null,
        exercise.rest_seconds || 60,
        exercise.notes || null
      ]);
    });
    
    await Promise.all(exercisePromises);
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      data: dayResult.rows[0],
      message: 'Training day created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating training day:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    client.release();
  }
});

// Update training day
app.put('/api/v1/training-days/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { profile_id, name, description, exercises } = req.body;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    await client.query('BEGIN');
    
    // Check if training day exists and belongs to profile
    const existingDay = await client.query(`
      SELECT id FROM training_days 
      WHERE id = $1 AND profile_id = $2
    `, [id, profile_id]);
    
    if (existingDay.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Training day not found'
      });
    }
    
    // Check for duplicate name (excluding current training day)
    if (name) {
      const duplicateCheck = await client.query(`
        SELECT id FROM training_days 
        WHERE profile_id = $1 AND name = $2 AND id != $3 AND is_active = true
      `, [profile_id, name, id]);
      
      if (duplicateCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          error: 'A training day with this name already exists'
        });
      }
    }
    
    // Update training day
    const updateFields = [];
    const updateValues = [];
    let paramCounter = 1;
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramCounter++}`);
      updateValues.push(name);
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramCounter++}`);
      updateValues.push(description);
    }
    
    if (updateFields.length > 0) {
      updateValues.push(id);
      const updateQuery = `
        UPDATE training_days 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCounter}
        RETURNING id, name, description, is_active, created_at, updated_at
      `;
      
      var dayResult = await client.query(updateQuery, updateValues);
    } else {
      var dayResult = await client.query(`
        SELECT id, name, description, is_active, created_at, updated_at
        FROM training_days WHERE id = $1
      `, [id]);
    }
    
    // Update exercises if provided
    if (exercises && Array.isArray(exercises)) {
      if (exercises.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'At least one exercise is required'
        });
      }
      
      // Delete existing exercises
      await client.query('DELETE FROM training_day_exercises WHERE training_day_id = $1', [id]);
      
      // Insert new exercises
      const exercisePromises = exercises.map((exercise, index) => {
        return client.query(`
          INSERT INTO training_day_exercises 
          (training_day_id, exercise_id, order_index, sets, reps, weight, rest_seconds, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          id,
          exercise.exercise_id,
          exercise.order_index || index,
          exercise.sets || 3,
          exercise.reps || 12,
          exercise.weight || null,
          exercise.rest_seconds || 60,
          exercise.notes || null
        ]);
      });
      
      await Promise.all(exercisePromises);
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      data: dayResult.rows[0],
      message: 'Training day updated successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    client.release();
  }
});

// Delete training day
app.delete('/api/v1/training-days/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { profile_id } = req.query;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    const result = await pool.query(`
      UPDATE training_days 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND profile_id = $2 AND is_active = true
      RETURNING id
    `, [id, profile_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Training day not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Training day deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// ROUTINES ENDPOINTS

// Get all routines for a profile
app.get('/api/v1/routines', async (req, res) => {
  try {
    const { profile_id } = req.query;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    const result = await pool.query(`
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
    `, [profile_id]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get routine by ID with exercises
app.get('/api/v1/routines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { profile_id } = req.query;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    // Get routine info
    const routineResult = await pool.query(`
      SELECT id, name, description, color, duration_minutes, difficulty_level, 
             is_active, is_favorite, tags, notes, created_at, updated_at
      FROM routines 
      WHERE id = $1 AND profile_id = $2
    `, [id, profile_id]);
    
    if (routineResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Routine not found'
      });
    }
    
    // Get exercises for this routine
    const exercisesResult = await pool.query(`
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
    `, [id]);
    
    const routine = {
      ...routineResult.rows[0],
      exercises: exercisesResult.rows.map(row => ({
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
      }))
    };
    
    res.json({
      success: true,
      data: routine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Create routine
app.post('/api/v1/routines', async (req, res) => {
  const client = await pool.connect();
  
  try {
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
      exercises = [] 
    } = req.body;
    
    if (!profile_id || !name) {
      return res.status(400).json({
        success: false,
        error: 'profile_id and name are required'
      });
    }
    
    if (exercises.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one exercise is required'
      });
    }
    
    await client.query('BEGIN');
    
    // Validate all exercise IDs exist
    const exerciseIds = exercises.map(ex => ex.exercise_id);
    const existingExercises = await client.query(
      `SELECT id FROM exercises WHERE id = ANY($1)`,
      [exerciseIds]
    );
    
    const existingIds = existingExercises.rows.map(row => row.id);
    const missingIds = exerciseIds.filter(id => !existingIds.includes(id));
    
    if (missingIds.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Invalid exercise IDs: ${missingIds.join(', ')}. Please select valid exercises.`
      });
    }
    
    // Create routine
    const routineResult = await client.query(`
      INSERT INTO routines (profile_id, name, description, color, duration_minutes, difficulty_level, is_favorite, tags, notes, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, name, description, color, duration_minutes, difficulty_level, is_favorite, tags, notes, is_active, created_at, updated_at
    `, [profile_id, name, description, color, duration_minutes, difficulty_level, is_favorite, tags, notes, true]);
    
    const routineId = routineResult.rows[0].id;
    
    // Create routine exercises
    const exercisePromises = exercises.map((exercise, index) => {
      return client.query(`
        INSERT INTO routine_exercises 
        (routine_id, exercise_id, order_in_routine, sets, reps, weight, duration_seconds, rest_time_seconds, rpe, notes, is_superset, superset_group)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
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
      ]);
    });
    
    await Promise.all(exercisePromises);
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      data: routineResult.rows[0],
      message: 'Routine created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating routine:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    client.release();
  }
});

// Update routine
app.put('/api/v1/routines/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
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
    } = req.body;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    await client.query('BEGIN');
    
    // Check if routine exists and belongs to profile
    const existingRoutine = await client.query(`
      SELECT id FROM routines 
      WHERE id = $1 AND profile_id = $2
    `, [id, profile_id]);
    
    if (existingRoutine.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Routine not found'
      });
    }
    
    // Update routine
    const updateFields = [];
    const updateValues = [];
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
        RETURNING id, name, description, color, duration_minutes, difficulty_level, is_favorite, tags, notes, is_active, created_at, updated_at
      `;
      
      routineResult = await client.query(updateQuery, updateValues);
    } else {
      routineResult = await client.query(`
        SELECT id, name, description, color, duration_minutes, difficulty_level, is_favorite, tags, notes, is_active, created_at, updated_at
        FROM routines WHERE id = $1
      `, [id]);
    }
    
    // Update exercises if provided
    if (exercises && Array.isArray(exercises)) {
      if (exercises.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'At least one exercise is required'
        });
      }
      
      // Validate exercise IDs
      const exerciseIds = exercises.map(ex => ex.exercise_id);
      const existingExercises = await client.query(
        `SELECT id FROM exercises WHERE id = ANY($1)`,
        [exerciseIds]
      );
      
      const existingIds = existingExercises.rows.map(row => row.id);
      const missingIds = exerciseIds.filter(id => !existingIds.includes(id));
      
      if (missingIds.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Invalid exercise IDs: ${missingIds.join(', ')}. Please select valid exercises.`
        });
      }
      
      // Delete existing exercises
      await client.query('DELETE FROM routine_exercises WHERE routine_id = $1', [id]);
      
      // Insert new exercises
      const exercisePromises = exercises.map((exercise, index) => {
        return client.query(`
          INSERT INTO routine_exercises 
          (routine_id, exercise_id, order_in_routine, sets, reps, weight, duration_seconds, rest_time_seconds, rpe, notes, is_superset, superset_group)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
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
        ]);
      });
      
      await Promise.all(exercisePromises);
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      data: routineResult.rows[0],
      message: 'Routine updated successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating routine:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    client.release();
  }
});

// Delete routine (soft delete)
app.delete('/api/v1/routines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { profile_id } = req.query;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    const result = await pool.query(`
      UPDATE routines 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND profile_id = $2 AND is_active = true
      RETURNING id
    `, [id, profile_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Routine not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Routine deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting routine:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// ==========================================
// ROUTINE WEEKS ENDPOINTS
// ==========================================

// Get routine weeks (weekly schedule) for a profile
app.get('/api/v1/routine-weeks', async (req, res) => {
  try {
    const { profile_id } = req.query;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    const result = await pool.query(`
      SELECT 
        rw.id,
        rw.profile_id,
        rw.day_of_week,
        rw.day_name,
        rw.is_rest_day,
        rw.routine_id,
        rw.completed_date,
        r.name as routine_name,
        r.color as routine_color,
        r.difficulty_level,
        r.duration_minutes,
        rw.created_at,
        rw.updated_at
      FROM routine_weeks rw
      LEFT JOIN routines r ON rw.routine_id = r.id AND r.is_active = true
      WHERE rw.profile_id = $1
      ORDER BY rw.day_of_week
    `, [profile_id]);
    
    console.log(`📅 Retrieved ${result.rows.length} routine weeks for profile ${profile_id}`);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching routine weeks:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Update routine week (assign routine to day)
app.put('/api/v1/routine-weeks/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { profile_id, routine_id, is_rest_day } = req.body;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }

    await client.query('BEGIN');
    
    // Validate that the routine belongs to this profile (if routine_id provided)
    if (routine_id) {
      const routineCheck = await client.query(`
        SELECT id FROM routines 
        WHERE id = $1 AND profile_id = $2 AND is_active = true
      `, [routine_id, profile_id]);
      
      if (routineCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Routine not found or does not belong to this profile'
        });
      }
    }
    
    // Update routine week
    const result = await client.query(`
      UPDATE routine_weeks 
      SET 
        routine_id = $1,
        is_rest_day = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND profile_id = $4
      RETURNING 
        id,
        profile_id,
        day_of_week,
        day_name,
        is_rest_day,
        routine_id,
        completed_date,
        updated_at
    `, [routine_id, is_rest_day || false, id, profile_id]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Routine week not found or does not belong to this profile'
      });
    }
    
    await client.query('COMMIT');
    
    // Get updated routine week with routine details
    const updatedResult = await client.query(`
      SELECT 
        rw.id,
        rw.profile_id,
        rw.day_of_week,
        rw.day_name,
        rw.is_rest_day,
        rw.routine_id,
        rw.completed_date,
        r.name as routine_name,
        r.color as routine_color,
        r.difficulty_level,
        r.duration_minutes,
        rw.created_at,
        rw.updated_at
      FROM routine_weeks rw
      LEFT JOIN routines r ON rw.routine_id = r.id AND r.is_active = true
      WHERE rw.id = $1
    `, [id]);
    
    console.log(`📅 Updated routine week ${id} for profile ${profile_id}`);
    
    res.json({
      success: true,
      data: updatedResult.rows[0],
      message: 'Routine week updated successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating routine week:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    client.release();
  }
});

// Mark a day as completed
app.put('/api/v1/routine-weeks/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { profile_id, completed_date } = req.body;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    const dateToSet = completed_date || new Date().toISOString().split('T')[0];
    
    const result = await pool.query(`
      UPDATE routine_weeks 
      SET 
        completed_date = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND profile_id = $3
      RETURNING 
        id,
        profile_id,
        day_of_week,
        day_name,
        is_rest_day,
        routine_id,
        completed_date,
        updated_at
    `, [dateToSet, id, profile_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Routine week not found or does not belong to this profile'
      });
    }
    
    console.log(`✅ Marked routine week ${id} as completed on ${dateToSet}`);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Day marked as completed'
    });
  } catch (error) {
    console.error('Error marking day as completed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// ==========================================
// WORKOUT SESSIONS ENDPOINTS
// ==========================================

// Get workout sessions (workout history) for a profile
app.get('/api/v1/workout-sessions', async (req, res) => {
  try {
    const { profile_id, days_back = 30, limit = 50 } = req.query;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    const result = await pool.query(`
      SELECT 
        ws.id,
        ws.profile_id,
        ws.routine_id,
        ws.name as routine_name,
        ws.started_at,
        ws.completed_at,
        ws.duration_minutes,
        ws.total_weight_lifted,
        ws.total_sets,
        ws.total_reps,
        ws.average_rpe,
        ws.notes,
        ws.is_completed,
        ws.workout_type,
        ws.location,
        ws.mood_before,
        ws.mood_after,
        ws.energy_before,
        ws.energy_after,
        ws.created_at,
        ws.updated_at,
        COUNT(DISTINCT wse.id)::INTEGER as exercises_count
      FROM workout_sessions ws
      LEFT JOIN workout_session_exercises wse ON ws.id = wse.workout_session_id
      WHERE ws.profile_id = $1
      AND ws.started_at >= CURRENT_DATE - INTERVAL '${days_back} days'
      GROUP BY ws.id
      ORDER BY ws.started_at DESC, ws.created_at DESC
      LIMIT $2
    `, [profile_id, limit]);
    
    console.log(`🏃 Retrieved ${result.rows.length} workout sessions for profile ${profile_id}`);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching workout sessions:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get specific workout session with exercises and sets
app.get('/api/v1/workout-sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { profile_id } = req.query;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    // Get workout session
    const sessionResult = await pool.query(`
      SELECT 
        ws.id,
        ws.profile_id,
        ws.routine_id,
        ws.name as routine_name,
        ws.started_at,
        ws.completed_at,
        ws.duration_minutes,
        ws.total_weight_lifted,
        ws.total_sets,
        ws.total_reps,
        ws.average_rpe,
        ws.notes,
        ws.is_completed,
        ws.workout_type,
        ws.location,
        ws.mood_before,
        ws.mood_after,
        ws.energy_before,
        ws.energy_after,
        ws.created_at,
        ws.updated_at
      FROM workout_sessions ws
      WHERE ws.id = $1 AND ws.profile_id = $2
    `, [id, profile_id]);
    
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Workout session not found'
      });
    }
    
    // Get exercises with sets using existing workout_sets table
    const exercisesResult = await pool.query(`
      SELECT 
        wse.id,
        wse.workout_session_id,
        wse.exercise_id,
        wse.exercise_name,
        wse.exercise_image,
        wse.order_in_session,
        wse.notes as exercise_notes,
        wse.is_completed as exercise_completed,
        wse.created_at as exercise_created_at,
        json_agg(
          json_build_object(
            'id', ws.id,
            'set_number', ws.set_number,
            'reps', ws.reps,
            'weight', ws.weight,
            'rir', ws.rir,
            'rest_time_seconds', ws.rest_time_seconds,
            'duration_seconds', ws.duration_seconds,
            'distance_meters', ws.distance_meters,
            'rpe', ws.rpe,
            'notes', ws.notes,
            'is_completed', ws.is_completed,
            'is_warmup', ws.is_warmup,
            'rp', ws.rest_pause_sets,
            'ds', ws.drop_sets,
            'partials', ws.partials,
            'completed_at', ws.completed_at,
            'created_at', ws.created_at
          ) ORDER BY ws.set_number
        ) FILTER (WHERE ws.id IS NOT NULL) as sets
      FROM workout_session_exercises wse
      LEFT JOIN workout_sets ws ON wse.id = ws.exercise_id AND ws.session_id = wse.workout_session_id
      WHERE wse.workout_session_id = $1
      GROUP BY wse.id, wse.workout_session_id, wse.exercise_id, wse.exercise_name, 
               wse.exercise_image, wse.order_in_session, wse.notes, wse.is_completed, wse.created_at
      ORDER BY wse.order_in_session
    `, [id]);
    
    const workoutSession = {
      ...sessionResult.rows[0],
      exercises: exercisesResult.rows
    };
    
    console.log(`🏃 Retrieved workout session ${id} with ${exercisesResult.rows.length} exercises`);
    
    res.json({
      success: true,
      data: workoutSession
    });
  } catch (error) {
    console.error('Error fetching workout session:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Create workout session
app.post('/api/v1/workout-sessions', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      profile_id,
      routine_id,
      name,
      workout_type = 'strength',
      location,
      mood_before,
      energy_before,
      notes,
      exercises = []
    } = req.body;
    
    if (!profile_id || !name) {
      return res.status(400).json({
        success: false,
        error: 'profile_id and name are required'
      });
    }
    
    await client.query('BEGIN');
    
    // Create workout session
    const sessionResult = await client.query(`
      INSERT INTO workout_sessions (
        profile_id, routine_id, name, workout_type, location, 
        mood_before, energy_before, notes, is_completed, started_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, CURRENT_TIMESTAMP)
      RETURNING id, profile_id, routine_id, name as routine_name, started_at, 
                completed_at, duration_minutes, total_weight_lifted, total_sets, 
                total_reps, average_rpe, notes, is_completed, workout_type, location,
                mood_before, mood_after, energy_before, energy_after, created_at, updated_at
    `, [profile_id, routine_id, name, workout_type, location, mood_before, energy_before, notes]);
    
    const workoutSession = sessionResult.rows[0];
    
    // Add exercises if provided
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      
      // Validate exercise exists
      const exerciseCheck = await client.query(
        'SELECT id, name, image FROM exercises WHERE id = $1',
        [exercise.exercise_id]
      );
      
      if (exerciseCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Exercise with ID ${exercise.exercise_id} not found`
        });
      }
      
      const exerciseData = exerciseCheck.rows[0];
      
      // Insert exercise into workout session
      const exerciseResult = await client.query(`
        INSERT INTO workout_session_exercises (
          workout_session_id, exercise_id, exercise_name, exercise_image, 
          order_in_session, notes, is_completed
        )
        VALUES ($1, $2, $3, $4, $5, $6, false)
        RETURNING id
      `, [
        workoutSession.id,
        exercise.exercise_id,
        exerciseData.name,
        exerciseData.image,
        exercise.order_in_session || (i + 1),
        exercise.notes
      ]);
      
      const sessionExerciseId = exerciseResult.rows[0].id;
      
      // Add sets if provided using workout_sets table
      if (exercise.sets && exercise.sets.length > 0) {
        for (const set of exercise.sets) {
          await client.query(`
            INSERT INTO workout_sets (
              session_id, exercise_id, set_number, reps, weight, 
              rest_time_seconds, rpe, rir, notes, is_completed, is_warmup,
              rest_pause_sets, drop_sets, partials
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          `, [
            workoutSession.id,
            sessionExerciseId,
            set.set_number,
            set.reps,
            set.weight,
            set.rest_time_seconds || set.rest_seconds,
            set.rpe,
            set.rir,
            set.notes,
            set.is_completed || true,
            set.is_warmup || false,
            set.rp ? JSON.stringify(set.rp) : null, // rest_pause_sets (RP)
            set.ds ? JSON.stringify(set.ds) : null, // drop_sets (DS)
            set.partials ? JSON.stringify(set.partials) : null // partials (P)
          ]);
        }
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`🏃 Created workout session ${workoutSession.id} for profile ${profile_id} with ${exercises.length} exercises`);
    
    res.status(201).json({
      success: true,
      data: workoutSession,
      message: 'Workout session created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating workout session:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    client.release();
  }
});

// Complete workout session
app.put('/api/v1/workout-sessions/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      profile_id, 
      duration_minutes, 
      total_weight_lifted,
      total_sets,
      total_reps,
      average_rpe,
      mood_after,
      energy_after
    } = req.body;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    const result = await pool.query(`
      UPDATE workout_sessions 
      SET 
        completed_at = CURRENT_TIMESTAMP,
        duration_minutes = $1,
        total_weight_lifted = $2,
        total_sets = $3,
        total_reps = $4,
        average_rpe = $5,
        mood_after = $6,
        energy_after = $7,
        is_completed = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND profile_id = $9
      RETURNING id, profile_id, routine_id, name as routine_name, started_at, 
                completed_at, duration_minutes, total_weight_lifted, total_sets, 
                total_reps, average_rpe, notes, is_completed, workout_type, location,
                mood_before, mood_after, energy_before, energy_after, created_at, updated_at
    `, [duration_minutes, total_weight_lifted, total_sets, total_reps, average_rpe, mood_after, energy_after, id, profile_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Workout session not found or does not belong to this profile'
      });
    }
    
    console.log(`✅ Completed workout session ${id} for profile ${profile_id}`);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Workout session completed successfully'
    });
  } catch (error) {
    console.error('Error completing workout session:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Delete workout session
app.delete('/api/v1/workout-sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { profile_id } = req.body;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    const result = await pool.query(`
      DELETE FROM workout_sessions
      WHERE id = $1 AND profile_id = $2
      RETURNING id
    `, [id, profile_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Workout session not found or does not belong to this profile'
      });
    }
    
    console.log(`🗑️ Deleted workout session ${id} for profile ${profile_id}`);
    
    res.json({
      success: true,
      message: 'Workout session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workout session:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FITito API Server running on http://localhost:${PORT}`);
  console.log(`📱 Mobile access: http://192.168.1.50:${PORT}`);
  console.log(`🏥 Health check: http://192.168.1.50:${PORT}/health`);
  console.log(`💪 Exercises API: http://192.168.1.50:${PORT}/api/v1/exercises`);
  console.log(`📅 Training Days API: http://192.168.1.50:${PORT}/api/v1/training-days`);
  console.log(`🏋️ Routines API: http://192.168.1.50:${PORT}/api/v1/routines`);
  console.log(`📆 Routine Weeks API: http://192.168.1.50:${PORT}/api/v1/routine-weeks`);
  console.log(`🏃 Workout Sessions API: http://192.168.1.50:${PORT}/api/v1/workout-sessions`);
});