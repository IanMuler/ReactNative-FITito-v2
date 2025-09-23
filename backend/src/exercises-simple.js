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
});