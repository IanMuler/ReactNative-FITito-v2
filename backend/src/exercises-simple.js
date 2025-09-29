const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

// Set timezone to Argentina (UTC-3)
process.env.TZ = 'America/Argentina/Buenos_Aires';

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
  // Set timezone for all connections
  options: '--timezone=America/Argentina/Buenos_Aires'
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const body = req.body && Object.keys(req.body).length > 0 ? req.body : null;
  
  console.log(`🚀 [${timestamp}] ${method} ${url}`);
  if (body) {
    console.log(`📦 Request Body:`, JSON.stringify(body, null, 2));
  }
  
  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 400 ? '❌' : '✅';
    console.log(`${statusEmoji} [${timestamp}] ${method} ${url} - ${statusCode}`);
    
    if (statusCode >= 400) {
      console.log(`🚨 Error Response:`, data);
    }
    
    originalSend.call(this, data);
  };
  
  next();
});

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
    
    console.log('🏋️ Creating training day:', {
      profile_id,
      name,
      description,
      exerciseCount: exercises.length,
      exercises: exercises.map(ex => ({ id: ex.exercise_id, sets: ex.sets, reps: ex.reps, weight: ex.weight }))
    });
    
    if (!profile_id || !name) {
      console.log('❌ Validation failed: Missing profile_id or name', { profile_id, name });
      return res.status(400).json({
        success: false,
        error: 'profile_id and name are required'
      });
    }
    
    if (exercises.length === 0) {
      console.log('❌ Validation failed: No exercises provided');
      return res.status(400).json({
        success: false,
        error: 'At least one exercise is required'
      });
    }
    
    console.log('🔄 Starting transaction for training day creation');
    await client.query('BEGIN');
    
    // Check for duplicate name for this profile
    console.log('🔍 Checking for duplicate training day name:', { profile_id, name });
    const duplicateCheck = await client.query(`
      SELECT id FROM training_days 
      WHERE profile_id = $1 AND name = $2 AND is_active = true
    `, [profile_id, name]);
    
    if (duplicateCheck.rows.length > 0) {
      console.log('❌ Duplicate training day name found:', duplicateCheck.rows[0]);
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'A training day with this name already exists'
      });
    }
    
    console.log('✅ No duplicate found, proceeding with creation');
    
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

// Initialize routine weeks (create weekly schedule) for a profile
app.post('/api/v1/routine-weeks/initialize', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { profile_id } = req.body;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    await client.query('BEGIN');
    
    // Check if routine weeks already exist for this profile
    const existingWeeks = await client.query(`
      SELECT COUNT(*) as count FROM routine_weeks WHERE profile_id = $1
    `, [profile_id]);
    
    if (parseInt(existingWeeks.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'Routine weeks already initialized for this profile'
      });
    }
    
    // Create routine weeks for all 7 days
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const routineWeeks = [];
    
    for (let i = 0; i < dayNames.length; i++) {
      const result = await client.query(`
        INSERT INTO routine_weeks (profile_id, day_of_week, day_name, is_rest_day, routine_id, completed_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, profile_id, day_of_week, day_name, is_rest_day, routine_id, completed_date, created_at, updated_at
      `, [profile_id, i + 1, dayNames[i], false, null, null]);
      
      routineWeeks.push(result.rows[0]);
    }
    
    await client.query('COMMIT');
    
    console.log(`📅 Initialized routine weeks for profile ${profile_id}`);
    
    res.status(201).json({
      success: true,
      data: routineWeeks,
      message: 'Routine weeks initialized successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing routine weeks:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    client.release();
  }
});

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
        rw.routine_name,
        rw.training_day_id,
        rw.exercises_config,
        rw.completed_date,
        rw.created_at,
        rw.updated_at,
        CASE 
          WHEN jsonb_array_length(rw.exercises_config) > 0 THEN true 
          ELSE false 
        END as has_configuration
      FROM routine_weeks rw
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
    const { profile_id, routine_id, training_day_id, is_rest_day, completed_date } = req.body;
    
    console.log('🎯 [API] Update routine week request:', {
      routineWeekId: id,
      requestBody: req.body,
      profile_id,
      routine_id,
      training_day_id,
      is_rest_day,
      completed_date,
    });
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }

    await client.query('BEGIN');
    
    // Handle routine_id or training_day_id assignment
    let finalRoutineId = routine_id;
    
    console.log('🔍 [DEBUG] Checking conditions:', {
      hasRoutineId: !!routine_id,
      routineIdValue: routine_id,
      hasTrainingDayId: !!training_day_id,
      trainingDayIdValue: training_day_id
    });
    
    if (routine_id) {
      // If routine_id provided, validate it exists
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
    } else if (training_day_id) {
      // If training_day_id provided, create a routine from the training day
      const trainingDayId = training_day_id;
      
      // Validate training day exists and belongs to profile
      const trainingDayCheck = await client.query(`
        SELECT id, name FROM training_days 
        WHERE id = $1 AND profile_id = $2
      `, [trainingDayId, profile_id]);
      
      if (trainingDayCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Training day not found or does not belong to this profile'
        });
      }
      
      const trainingDay = trainingDayCheck.rows[0];
      
      // Create a routine from the training day
      const createRoutineResult = await client.query(`
        INSERT INTO routines (name, description, profile_id, is_active, created_at)
        VALUES ($1, $2, $3, true, NOW())
        RETURNING id
      `, [`Rutina - ${trainingDay.name}`, `Rutina creada automáticamente desde ${trainingDay.name}`, profile_id]);
      
      finalRoutineId = createRoutineResult.rows[0].id;
      
      console.log('✅ Created routine from training day:', {
        trainingDayId,
        trainingDayName: trainingDay.name,
        newRoutineId: finalRoutineId
      });
    }
    
    // Update routine week (preserve routine_name, training_day_id, exercises_config if they exist)
    const updateFields = [];
    const updateValues = [];
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
    
    if (completed_date !== undefined) {
      updateFields.push(`completed_date = $${paramCount}`);
      updateValues.push(completed_date);
      paramCount++;
      console.log('📅 [API] Setting completed_date to:', completed_date);
    }
    
    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id, profile_id);
    
    const result = await client.query(`
      UPDATE routine_weeks 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount} AND profile_id = $${paramCount + 1}
      RETURNING 
        id,
        profile_id,
        day_of_week,
        day_name,
        is_rest_day,
        routine_id,
        routine_name,
        training_day_id,
        exercises_config,
        completed_date,
        updated_at
    `, updateValues);
    
    console.log('🔄 [API] Update query executed:', {
      updateFields: updateFields.join(', '),
      updateValues,
      rowsAffected: result.rowCount,
      returnedData: result.rows[0],
    });
    
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
    
    console.log('🎯 [API] Mark day as completed request:', {
      routineWeekId: id,
      requestBody: req.body,
      profile_id,
      completed_date,
    });
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    const dateToSet = completed_date || new Date().toISOString().split('T')[0];
    console.log('📅 [API] Date to set:', dateToSet);
    
    // Check current state before update
    const beforeUpdate = await pool.query(`
      SELECT id, day_name, completed_date 
      FROM routine_weeks 
      WHERE id = $1 AND profile_id = $2
    `, [id, profile_id]);
    
    console.log('🔍 [API] Before update:', beforeUpdate.rows[0]);
    
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
    
    console.log('🔄 [API] Update result:', {
      rowsAffected: result.rowCount,
      returnedData: result.rows[0],
    });
    
    if (result.rows.length === 0) {
      console.error('❌ [API] No rows found to update');
      return res.status(404).json({
        success: false,
        error: 'Routine week not found or does not belong to this profile'
      });
    }
    
    console.log(`✅ [API] Marked routine week ${id} as completed on ${dateToSet}`, result.rows[0]);
    
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
// ROUTINE DAY CONFIGURATIONS ENDPOINTS
// ==========================================

// Get routine day configuration for a specific routine week
app.get('/api/v1/routine-weeks/:id/configuration', async (req, res) => {
  try {
    const { id } = req.params;
    const { profile_id } = req.query;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    // Get routine week with unified configuration
    const result = await pool.query(`
      SELECT 
        rw.id,
        rw.day_name,
        rw.routine_id,
        rw.routine_name,
        rw.exercises_config
      FROM routine_weeks rw
      WHERE rw.id = $1 AND rw.profile_id = $2
    `, [id, profile_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Routine week not found or does not belong to this profile'
      });
    }
    
    const routineWeek = result.rows[0];
    
    // Convert exercises_config JSONB to array format expected by frontend
    const exercises = routineWeek.exercises_config || [];
    
    console.log(`📋 Retrieved configuration for routine week ${id}: ${exercises.length} exercises`);
    
    res.json({
      success: true,
      data: {
        routine_week: {
          id: routineWeek.id,
          day_name: routineWeek.day_name,
          routine_id: routineWeek.routine_id,
          routine_name: routineWeek.routine_name
        },
        exercises: exercises
      }
    });
  } catch (error) {
    console.error('Error fetching routine day configuration:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Initialize routine day configuration from training day
app.post('/api/v1/routine-weeks/:id/configuration/initialize', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { profile_id, training_day_id } = req.body;
    
    if (!profile_id || !training_day_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id and training_day_id are required'
      });
    }
    
    await client.query('BEGIN');
    
    // Verify routine week belongs to profile
    const routineWeekCheck = await client.query(`
      SELECT id FROM routine_weeks 
      WHERE id = $1 AND profile_id = $2
    `, [id, profile_id]);
    
    if (routineWeekCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Routine week not found or does not belong to this profile'
      });
    }
    
    // Verify training day belongs to profile
    const trainingDayCheck = await client.query(`
      SELECT id FROM training_days 
      WHERE id = $1 AND profile_id = $2 AND is_active = true
    `, [training_day_id, profile_id]);
    
    if (trainingDayCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Training day not found or does not belong to this profile'
      });
    }
    
    // Initialize configuration using stored function
    await client.query(`
      SELECT initialize_routine_day_configuration($1, $2)
    `, [id, training_day_id]);
    
    await client.query('COMMIT');
    
    // Get the created configuration
    const result = await pool.query(`
      SELECT * FROM get_routine_day_configuration($1)
    `, [id]);
    
    console.log(`🔧 Initialized configuration for routine week ${id} from training day ${training_day_id}`);
    
    res.status(201).json({
      success: true,
      data: result.rows,
      message: 'Routine day configuration initialized successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing routine day configuration:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    client.release();
  }
});

// Update routine day configuration
app.put('/api/v1/routine-weeks/:id/configuration', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { profile_id, exercises, routine_name } = req.body;
    
    
    if (!profile_id || !exercises || !Array.isArray(exercises)) {
      return res.status(400).json({
        success: false,
        error: 'profile_id and exercises array are required'
      });
    }
    
    await client.query('BEGIN');
    
    // Verify routine week belongs to profile
    const routineWeekCheck = await client.query(`
      SELECT id FROM routine_weeks 
      WHERE id = $1 AND profile_id = $2
    `, [id, profile_id]);
    
    if (routineWeekCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Routine week not found or does not belong to this profile'
      });
    }
    
    // Build exercises config array with validation
    const exercisesConfig = [];
    
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      
      // Validate exercise exists
      const exerciseCheck = await client.query(`
        SELECT id, name, image FROM exercises WHERE id = $1
      `, [exercise.exercise_id]);
      
      if (exerciseCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Exercise with ID ${exercise.exercise_id} not found`
        });
      }
      
      const exerciseData = exerciseCheck.rows[0];
      
      exercisesConfig.push({
        exercise_id: exercise.exercise_id,
        exercise_name: exerciseData.name,
        exercise_image: exerciseData.image,
        order_index: i,
        sets_config: exercise.sets_config || [],
        notes: exercise.notes || ''
      });
    }
    
    // Determine routine name: use provided name, or query from training_day_id, or default
    let finalRoutineName = null;
    const trainingDayId = exercises.length > 0 ? exercises[0].training_day_id || null : null;
    
    
    if (exercises.length > 0) {
      if (routine_name) {
        // Use provided routine name
        finalRoutineName = routine_name;
      } else if (trainingDayId) {
        // Query training day name from database
        const trainingDayResult = await client.query(
          'SELECT name FROM training_days WHERE id = $1', 
          [trainingDayId]
        );
        finalRoutineName = trainingDayResult.rows.length > 0 
          ? trainingDayResult.rows[0].name 
          : 'Entreno configurado';
      } else {
        // Fallback to default
        finalRoutineName = 'Entreno configurado';
      }
    }
    
    // Update routine week with unified configuration
    await client.query(`
      UPDATE routine_weeks 
      SET 
        routine_name = $5,
        training_day_id = $4,
        exercises_config = $3
      WHERE id = $1 AND profile_id = $2
    `, [
      id, 
      profile_id, 
      JSON.stringify(exercisesConfig),
      trainingDayId,
      finalRoutineName
    ]);
    
    await client.query('COMMIT');
    
    console.log(`💾 Updated unified configuration for routine week ${id} with ${exercises.length} exercises`);
    
    res.json({
      success: true,
      data: exercisesConfig,
      message: 'Routine day configuration updated successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating routine day configuration:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    client.release();
  }
});

// Delete routine day configuration
app.delete('/api/v1/routine-weeks/:id/configuration', async (req, res) => {
  try {
    const { id } = req.params;
    const { profile_id } = req.query;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'profile_id is required'
      });
    }
    
    // Verify routine week belongs to profile
    const routineWeekCheck = await pool.query(`
      SELECT id FROM routine_weeks 
      WHERE id = $1 AND profile_id = $2
    `, [id, profile_id]);
    
    if (routineWeekCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Routine week not found or does not belong to this profile'
      });
    }
    
    // Clear configuration from unified structure
    const result = await pool.query(`
      UPDATE routine_weeks 
      SET 
        routine_name = NULL,
        training_day_id = NULL,
        exercises_config = '[]'
      WHERE id = $1 AND profile_id = $2
      RETURNING id
    `, [id, profile_id]);
    
    console.log(`🗑️ Deleted ${result.rows.length} configurations for routine week ${id}`);
    
    res.json({
      success: true,
      message: 'Routine day configuration deleted successfully',
      deleted_count: result.rows.length
    });
  } catch (error) {
    console.error('Error deleting routine day configuration:', error.message);
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

// Get workout session by date (must be before /:id route)
app.get('/api/v1/workout-sessions/by-date', async (req, res) => {
  try {
    const { profile_id, date } = req.query;
    
    if (!profile_id || !date) {
      return res.status(400).json({
        success: false,
        error: 'profile_id and date are required'
      });
    }
    
    console.log(`📅 Getting workout session for profile ${profile_id} on ${date}`);
    
    // Parse date and create date range for the full day
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
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
        COUNT(wse.id) as exercises_count
      FROM workout_sessions ws
      LEFT JOIN workout_session_exercises wse ON ws.id = wse.workout_session_id
      WHERE ws.profile_id = $1 
        AND ws.started_at >= $2 
        AND ws.started_at <= $3
        AND ws.is_completed = true
      GROUP BY ws.id
      ORDER BY ws.started_at DESC
      LIMIT 1
    `, [profile_id, startOfDay.toISOString(), endOfDay.toISOString()]);
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No workout session found for this date'
      });
    }
    
    const session = result.rows[0];
    
    // Get exercises for this session
    const exercisesResult = await pool.query(`
      SELECT 
        wse.id,
        wse.exercise_id,
        wse.exercise_name,
        wse.exercise_image,
        wse.order_in_session,
        wse.is_completed,
        wse.notes as exercise_notes,
        e.name as exercise_full_name,
        e.image as exercise_full_image
      FROM workout_session_exercises wse
      LEFT JOIN exercises e ON wse.exercise_id = e.id
      WHERE wse.workout_session_id = $1
      ORDER BY wse.order_in_session
    `, [session.id]);
    
    // Get sets for each exercise
    const setsResult = await pool.query(`
      SELECT 
        ws.id,
        ws.workout_session_exercise_id,
        ws.set_number,
        ws.reps,
        ws.weight,
        ws.rir,
        ws.rest_pause_reps,
        ws.drop_set_weights,
        ws.partial_reps,
        ws.is_completed,
        ws.notes,
        ws.created_at
      FROM workout_session_sets ws
      WHERE ws.workout_session_exercise_id IN (
        SELECT id FROM workout_session_exercises WHERE workout_session_id = $1
      )
      ORDER BY ws.workout_session_exercise_id, ws.set_number
    `, [session.id]);
    
    // Group sets by exercise
    const exercisesWithSets = exercisesResult.rows.map(exercise => ({
      ...exercise,
      sets: setsResult.rows.filter(set => set.workout_session_exercise_id === exercise.id)
    }));
    
    const sessionData = {
      ...session,
      exercises: exercisesWithSets
    };
    
    console.log(`✅ Found workout session for ${date}: ${session.routine_name}`);
    
    res.json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    console.error('Error getting workout session by date:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get workout history in AsyncStorage format for replacement compatibility
// URL format: /api/v1/workout-history/:profileId/:date
// Date format: DD/MM/YYYY (like original AsyncStorage)
app.get('/api/v1/workout-history/:profileId/:date', async (req, res) => {
  try {
    const { profileId, date } = req.params;
    
    
    // Handle both YYYY-MM-DD and DD/MM/YYYY date formats
    let dbDateString;
    if (date.includes('/')) {
      // DD/MM/YYYY format
      const [day, month, year] = date.split('/');
      dbDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else if (date.includes('-')) {
      // YYYY-MM-DD format (already correct for database)
      dbDateString = date;
    } else {
      throw new Error(`Invalid date format: ${date}. Expected DD/MM/YYYY or YYYY-MM-DD`);
    }
    
    
    // Query for training session on the specific date (using training_sessions schema)
    const sessionResult = await pool.query(`
      SELECT 
        ts.id,
        ts.routine_name as name,
        ts.created_at as started_at,
        NULL as completed_at,
        NULL as duration_minutes,
        TO_CHAR(ts.created_at, 'DD/MM/YYYY') as formatted_date
      FROM training_sessions ts
      WHERE ts.profile_id = $1 
        AND DATE(ts.created_at) = $2
        AND ts.status = 'completed'
      ORDER BY ts.created_at DESC
      LIMIT 1
    `, [profileId, dbDateString]);
    
    if (sessionResult.rows.length === 0) {
      console.log(`📭 [ASYNC-STORAGE] No workout session found for ${date}`);
      return res.json({
        success: true,
        data: [] // Return empty array, matching AsyncStorage format when no history
      });
    }
    
    const session = sessionResult.rows[0];
    console.log(`📋 [ASYNC-STORAGE] Found session: ${session.name}`);
    
    // Get performed data from training session progress
    const workoutSetsResult = await pool.query(`
      SELECT 
        tsp.exercise_id,
        e.name as exercise_name,
        e.image as exercise_image,
        tsp.set_number,
        tsp.reps as performed_reps,
        tsp.weight as performed_weight,
        tsp.rir as performed_rir,
        tsp.is_completed,
        tsp.notes
      FROM training_session_progress tsp
      JOIN exercises e ON tsp.exercise_id = e.id
      WHERE tsp.training_session_id = $1
      ORDER BY tsp.exercise_id, tsp.set_number
    `, [session.id]);
    
    // Get planned data from routine_weeks.exercises_config (JSONB)
    // This contains the original routine configuration that was planned
    // Use the training session's routine_week_id to get the planned data
    const plannedDataResult = await pool.query(`
      SELECT 
        rw.exercises_config
      FROM training_sessions ts
      LEFT JOIN routine_weeks rw ON rw.id = ts.routine_week_id
      WHERE ts.id = $1
      AND rw.exercises_config IS NOT NULL 
      AND rw.exercises_config != '[]'
      LIMIT 1
    `, [session.id]);
    
    const performedData = workoutSetsResult.rows;
    
    console.log(`🔍 [ASYNC-STORAGE] Found data:`, {
      plannedConfigResults: plannedDataResult.rows.length,
      performedSets: performedData.length
    });
    
    // Transform to AsyncStorage format with both planned and performed data
    let exerciseGroups = {};
    
    // Process planned data from routine_weeks.exercises_config JSONB
    if (plannedDataResult.rows.length > 0) {
      const exercisesConfig = plannedDataResult.rows[0].exercises_config;
      console.log(`🔍 [PLANNED] Raw exercises_config:`, JSON.stringify(exercisesConfig, null, 2));
      
      if (Array.isArray(exercisesConfig)) {
        exercisesConfig.forEach(exerciseConfig => {
          const exerciseKey = `${exerciseConfig.exercise_id}-${exerciseConfig.exercise_name}`;
          
          if (!exerciseGroups[exerciseKey]) {
            exerciseGroups[exerciseKey] = {
              name: exerciseConfig.exercise_name,
              image: exerciseConfig.exercise_image || '',
              sets: [],
              performedSets: []
            };
          }
          
          // Process JSONB sets_config data from routine configuration
          if (exerciseConfig.sets_config && Array.isArray(exerciseConfig.sets_config)) {
            exerciseGroups[exerciseKey].sets = exerciseConfig.sets_config.map(setConfig => ({
              reps: String(setConfig.reps || ''),
              weight: String(setConfig.weight || ''),
              rir: setConfig.rir ? String(setConfig.rir) : undefined
            }));
            console.log(`✅ [PLANNED] Processed ${exerciseGroups[exerciseKey].sets.length} planned sets for ${exerciseConfig.exercise_name}`);
          }
        });
      }
    }
    
    // Process performed sets from workout_session_sets
    performedData.forEach(setData => {
      const exerciseKey = `${setData.exercise_id}-${setData.exercise_name}`;
      
      if (!exerciseGroups[exerciseKey]) {
        exerciseGroups[exerciseKey] = {
          name: setData.exercise_name,
          image: setData.exercise_image || '',
          sets: [], // Will be populated by planned data if available
          performedSets: []
        };
      }
      
      // Add performed set
      exerciseGroups[exerciseKey].performedSets.push({
        reps: String(setData.performed_reps || ''),
        weight: String(setData.performed_weight || ''),
        rir: setData.performed_rir ? String(setData.performed_rir) : undefined,
        isCompleted: setData.is_completed || false,
        notes: setData.notes || ''
      });
    });
    
    console.log(`✅ [ASYNC-STORAGE] Processed ${Object.keys(exerciseGroups).length} exercises from real data`);
    
    // Transform to final AsyncStorage format
    const historyEntry = {
      date: date, // Keep original DD/MM/YYYY format
      exerciseDetails: Object.values(exerciseGroups)
    };
    
    console.log(`✅ [ASYNC-STORAGE] Returning ${Object.keys(exerciseGroups).length} exercises for ${date}`);
    
    // Final response logging
    const finalResponse = {
      success: true,
      data: [historyEntry] // Return as array with single entry, matching AsyncStorage format
    };
    console.log(`📤 [ASYNC-STORAGE] FINAL RESPONSE for ${date}:`, JSON.stringify(finalResponse, null, 2));
    
    res.json(finalResponse);
    
  } catch (error) {
    console.error('❌ [ASYNC-STORAGE] Error getting workout history:', error.message);
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

// TEMPORARY: Cleanup problematic workout sessions (remove after testing)
app.delete('/api/v1/workout-sessions/cleanup/:profileId', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { profileId } = req.params;
    
    console.log('🧹 [CLEANUP] Starting cleanup for profile:', profileId);
    
    await client.query('BEGIN');
    
    // Delete all workout sessions for this profile
    const workoutSessionsResult = await client.query(`
      DELETE FROM workout_sessions
      WHERE profile_id = $1
      RETURNING id, name, created_at
    `, [profileId]);
    
    console.log('🗑️ [CLEANUP] Deleted workout sessions:', workoutSessionsResult.rows);
    
    // Clear completed_date from all routine weeks for this profile
    const routineWeeksResult = await client.query(`
      UPDATE routine_weeks 
      SET completed_date = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE profile_id = $1 AND completed_date IS NOT NULL
      RETURNING id, day_name, completed_date
    `, [profileId]);
    
    console.log('📅 [CLEANUP] Cleared completion dates:', routineWeeksResult.rows);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      data: {
        deletedWorkoutSessions: workoutSessionsResult.rows.length,
        clearedCompletionDates: routineWeeksResult.rows.length,
        workoutSessions: workoutSessionsResult.rows,
        routineWeeks: routineWeeksResult.rows
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ [CLEANUP] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    client.release();
  }
});

// ==========================================
// TRAINING SESSIONS ENDPOINTS
// ==========================================

// Get active training session for a profile
app.get('/api/v1/training-sessions/active/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    
    console.log(`🔍 Getting active training session for profile ${profileId}`);
    
    const result = await pool.query(`
      SELECT * FROM get_active_training_session($1)
    `, [profileId]);
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No active training session found'
      });
    }
    
    const session = result.rows[0];
    
    // Get exercises for the session
    const exercisesResult = await pool.query(`
      SELECT 
        tse.*,
        e.name as exercise_name,
        e.image as exercise_image
      FROM training_session_exercises tse
      LEFT JOIN exercises e ON tse.exercise_id = e.id
      WHERE tse.training_session_id = $1
      ORDER BY tse.order_in_session
    `, [session.session_id]);
    
    // Get progress for each exercise
    const progressResult = await pool.query(`
      SELECT *
      FROM training_session_progress 
      WHERE training_session_id = $1
      ORDER BY exercise_id, set_number
    `, [session.session_id]);
    
    const sessionData = {
      ...session,
      id: session.session_id, // Map session_id to id for frontend compatibility
      exercises: exercisesResult.rows,
      progress: progressResult.rows
    };
    
    console.log(`✅ Found active session: ${session.routine_name} - ${session.day_name}`);
    
    res.json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    console.error('Error getting active training session:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Create new training session
app.post('/api/v1/training-sessions', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      profile_id, 
      routine_week_id, 
      routine_name, 
      day_of_week, 
      day_name, 
      exercises 
    } = req.body;
    
    console.log(`🚀 Creating training session: ${routine_name} - ${day_name} for profile ${profile_id}`);
    
    // Check if there's already an active session
    const activeSessionCheck = await client.query(`
      SELECT id FROM training_sessions 
      WHERE profile_id = $1 AND status = 'active'
    `, [profile_id]);
    
    if (activeSessionCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Active session already exists',
        message: 'Complete or cancel the current session before starting a new one'
      });
    }
    
    // Create training session
    const sessionResult = await client.query(`
      INSERT INTO training_sessions (
        profile_id, routine_week_id, routine_name, day_of_week, day_name
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [profile_id, routine_week_id, routine_name, day_of_week, day_name]);
    
    const sessionId = sessionResult.rows[0].id;
    
    // Add exercises to session
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      
      await client.query(`
        INSERT INTO training_session_exercises (
          training_session_id, exercise_id, exercise_name, exercise_image, 
          order_in_session, planned_sets
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        sessionId, 
        exercise.exercise_id, 
        exercise.exercise_name, 
        exercise.exercise_image,
        i + 1,
        JSON.stringify(exercise.sets_config || [])
      ]);
    }
    
    await client.query('COMMIT');
    
    console.log(`✅ Created training session ${sessionId}: ${routine_name} - ${day_name}`);
    
    res.status(201).json({
      success: true,
      data: { sessionId },
      message: 'Training session created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating training session:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    client.release();
  }
});

// Update training session progress
app.put('/api/v1/training-sessions/:sessionId/progress', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { 
      exercise_id, 
      set_number, 
      reps, 
      weight, 
      rir, 
      rest_pause_details, 
      drop_set_details, 
      partials_details,
      is_completed,
      current_exercise_index
    } = req.body;
    
    console.log(`📊 [BACKEND] Updating progress for session ${sessionId}, exercise ${exercise_id}, set ${set_number}`, {
      reps, weight, rir, is_completed, current_exercise_index
    });
    
    // Update or insert progress
    const result = await pool.query(`
      INSERT INTO training_session_progress (
        training_session_id, exercise_id, set_number, reps, weight, rir,
        rest_pause_details, drop_set_details, partials_details, is_completed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (training_session_id, exercise_id, set_number)
      DO UPDATE SET
        reps = EXCLUDED.reps,
        weight = EXCLUDED.weight,
        rir = EXCLUDED.rir,
        rest_pause_details = EXCLUDED.rest_pause_details,
        drop_set_details = EXCLUDED.drop_set_details,
        partials_details = EXCLUDED.partials_details,
        is_completed = EXCLUDED.is_completed,
        completed_at = CASE WHEN EXCLUDED.is_completed THEN CURRENT_TIMESTAMP ELSE NULL END,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `, [
      sessionId, exercise_id, set_number, reps, weight, rir,
      rest_pause_details ? JSON.stringify(rest_pause_details) : null,
      drop_set_details ? JSON.stringify(drop_set_details) : null,
      partials_details ? JSON.stringify(partials_details) : null,
      is_completed
    ]);
    
    // Update session's current exercise index and last activity
    if (current_exercise_index !== undefined) {
      await pool.query(`
        UPDATE training_sessions 
        SET current_exercise_index = $1, last_activity = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [current_exercise_index, sessionId]);
    } else {
      await pool.query(`
        UPDATE training_sessions 
        SET last_activity = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [sessionId]);
    }
    
    console.log(`✅ Updated progress for session ${sessionId}`);
    
    res.json({
      success: true,
      data: { progressId: result.rows[0].id },
      message: 'Progress updated successfully'
    });
  } catch (error) {
    console.error('Error updating training session progress:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Complete training session
app.post('/api/v1/training-sessions/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { notes, rating, progressData } = req.body;
    
    console.log(`🏁 Completing training session ${sessionId}`, {
      sessionId,
      sessionIdType: typeof sessionId,
      isValidNumber: !isNaN(sessionId) && isFinite(sessionId),
      params: req.params,
      body: req.body,
      hasProgressData: !!progressData,
      progressDataLength: progressData ? progressData.length : 0
    });
    
    // Validate sessionId
    if (!sessionId) {
      const error = 'SessionId is required';
      console.error('❌ Complete training session failed:', error);
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: error
      });
    }
    
    const sessionIdNum = parseInt(sessionId, 10);
    if (isNaN(sessionIdNum) || !isFinite(sessionIdNum)) {
      const error = `Invalid sessionId: ${sessionId} (must be a valid integer)`;
      console.error('❌ Complete training session failed:', error);
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: error
      });
    }
    
    
    // Process progressData if provided (from local state in frontend)
    if (progressData && Array.isArray(progressData) && progressData.length > 0) {
      
      // Insert or update progress data
      for (const progressEntry of progressData) {
        const {
          exercise_id,
          set_number,
          reps,
          weight,
          rir,
          rest_pause_details,
          drop_set_details,
          partials_details,
          is_completed
        } = progressEntry;
        
        
        // Insert or update the progress record
        await pool.query(`
          INSERT INTO training_session_progress (
            training_session_id,
            exercise_id,
            set_number,
            reps,
            weight,
            rir,
            rest_pause_details,
            drop_set_details,
            partials_details,
            is_completed,
            completed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (training_session_id, exercise_id, set_number)
          DO UPDATE SET
            reps = EXCLUDED.reps,
            weight = EXCLUDED.weight,
            rir = EXCLUDED.rir,
            rest_pause_details = EXCLUDED.rest_pause_details,
            drop_set_details = EXCLUDED.drop_set_details,
            partials_details = EXCLUDED.partials_details,
            is_completed = EXCLUDED.is_completed,
            completed_at = EXCLUDED.completed_at,
            updated_at = CURRENT_TIMESTAMP
        `, [
          sessionIdNum,
          exercise_id,
          set_number,
          reps,
          weight,
          rir,
          rest_pause_details ? JSON.stringify(rest_pause_details) : null,
          drop_set_details ? JSON.stringify(drop_set_details) : null,
          partials_details ? JSON.stringify(partials_details) : null,
          is_completed || false,
          is_completed ? new Date() : null
        ]);
      }
      
    } else {
    }
    
    // Complete the session using the database function
    const result = await pool.query(`
      SELECT complete_training_session($1) as workout_session_id
    `, [sessionIdNum]);
    
    const workoutSessionId = result.rows[0].workout_session_id;
    
    
    // Update workout session with additional notes/rating if provided
    if (notes || rating) {
      await pool.query(`
        UPDATE workout_sessions 
        SET notes = COALESCE($1, notes), rating = COALESCE($2, rating)
        WHERE id = $3
      `, [notes, rating, workoutSessionId]);
    }
    
    console.log(`✅ Training session ${sessionId} completed, workout session ${workoutSessionId} created`);
    
    res.json({
      success: true,
      data: { workoutSessionId },
      message: 'Training session completed successfully'
    });
  } catch (error) {
    console.error('Error completing training session:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Cancel training session
app.delete('/api/v1/training-sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log(`❌ Cancelling training session ${sessionId}`);
    
    const result = await pool.query(`
      UPDATE training_sessions 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'active'
      RETURNING id
    `, [sessionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Training session not found or not active'
      });
    }
    
    console.log(`✅ Training session ${sessionId} cancelled`);
    
    res.json({
      success: true,
      message: 'Training session cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling training session:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get training session details
app.get('/api/v1/training-sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log(`📋 Getting training session details for ${sessionId}`);
    
    // Get session details
    const sessionResult = await pool.query(`
      SELECT * FROM training_sessions WHERE id = $1
    `, [sessionId]);
    
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Training session not found'
      });
    }
    
    const session = sessionResult.rows[0];
    
    // Get exercises
    const exercisesResult = await pool.query(`
      SELECT 
        tse.*,
        e.name as exercise_name,
        e.image as exercise_image
      FROM training_session_exercises tse
      LEFT JOIN exercises e ON tse.exercise_id = e.id
      WHERE tse.training_session_id = $1
      ORDER BY tse.order_in_session
    `, [sessionId]);
    
    // Get progress
    const progressResult = await pool.query(`
      SELECT *
      FROM training_session_progress 
      WHERE training_session_id = $1
      ORDER BY exercise_id, set_number
    `, [sessionId]);
    
    const sessionData = {
      ...session,
      exercises: exercisesResult.rows,
      progress: progressResult.rows
    };
    
    console.log(`✅ Retrieved session details for ${sessionId}`);
    
    res.json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    console.error('Error getting training session details:', error.message);
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

// Temporary endpoint to clean data for testing
app.delete('/api/v1/clean-history/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Convert DD/MM/YYYY to YYYY-MM-DD for database query
    const [day, month, year] = date.split('/');
    const dbDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    console.log(`🧹 [CLEANUP] Cleaning workout data for ${date} (${dbDateString})`);
    
    // Delete workout sets first (foreign key constraint)
    const setsResult = await pool.query(`
      DELETE FROM workout_sets 
      WHERE session_id IN (
        SELECT id FROM workout_sessions 
        WHERE DATE(started_at) = $1
      )
    `, [dbDateString]);
    
    // Delete workout sessions
    const sessionsResult = await pool.query(`
      DELETE FROM workout_sessions 
      WHERE DATE(started_at) = $1
    `, [dbDateString]);
    
    console.log(`✅ [CLEANUP] Deleted ${setsResult.rowCount} sets and ${sessionsResult.rowCount} sessions for ${date}`);
    
    res.json({
      success: true,
      deleted: {
        sets: setsResult.rowCount,
        sessions: sessionsResult.rowCount
      }
    });
  } catch (error) {
    console.error('❌ [CLEANUP] Error cleaning data:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Cleanup endpoint for testing
app.delete('/api/v1/cleanup-workout-data', async (req, res) => {
  try {
    console.log('🧹 [CLEANUP] Starting cleanup of all workout data...');
    
    // Delete all workout data
    await pool.query('DELETE FROM workout_sets');
    await pool.query('DELETE FROM workout_sessions');
    await pool.query('DELETE FROM training_session_progress');
    await pool.query('DELETE FROM training_session_exercises');
    await pool.query('DELETE FROM training_sessions');
    
    // Reset routine weeks to not completed
    await pool.query('UPDATE routine_weeks SET is_completed = FALSE, completed_date = NULL');
    
    // Reset training days to not completed
    await pool.query('UPDATE training_days SET is_completed = FALSE, completed_date = NULL');
    
    console.log('✅ [CLEANUP] All workout data cleaned successfully');
    
    res.json({
      success: true,
      message: 'All workout data cleaned and routine weeks reset'
    });
  } catch (error) {
    console.error('❌ [CLEANUP] Error cleaning workout data:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
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
  console.log(`🎯 Training Sessions API: http://192.168.1.50:${PORT}/api/v1/training-sessions`);
  console.log(`📚 Workout History (AsyncStorage format): http://192.168.1.50:${PORT}/api/v1/workout-history/:profileId/:date`);
});

// Cleanup endpoint for testing
app.delete('/api/v1/cleanup-workout-data', async (req, res) => {
  try {
    console.log('🧹 [CLEANUP] Starting cleanup of all workout data...');
    
    // Delete all workout data
    await pool.query('DELETE FROM workout_sets');
    await pool.query('DELETE FROM workout_sessions');
    await pool.query('DELETE FROM training_session_progress');
    await pool.query('DELETE FROM training_session_exercises');
    await pool.query('DELETE FROM training_sessions');
    
    // Reset routine weeks to not completed
    await pool.query('UPDATE routine_weeks SET is_completed = FALSE, completed_date = NULL');
    
    // Reset training days to not completed
    await pool.query('UPDATE training_days SET is_completed = FALSE, completed_date = NULL');
    
    console.log('✅ [CLEANUP] All workout data cleaned successfully');
    
    res.json({
      success: true,
      message: 'All workout data cleaned and routine weeks reset'
    });
  } catch (error) {
    console.error('❌ [CLEANUP] Error cleaning workout data:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});