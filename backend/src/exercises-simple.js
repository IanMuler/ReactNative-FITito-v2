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
});