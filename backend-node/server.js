const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection with better error handling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Add connection timeout
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

// Test database connection
const testDatabaseConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
};

// Initialize database table with error handling
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Database table initialized successfully');
    return true;
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    return false;
  }
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Task Manager API is running!',
    version: '1.0.0',
    database: pool.totalCount ? 'connected' : 'pending',
    endpoints: {
      tasks: '/api/tasks',
      taskById: '/api/tasks/:id',
      health: '/health'
    }
  });
});

// Health check with database status
app.get('/health', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    const client = await pool.connect();
    dbStatus = 'healthy';
    client.release();
  } catch (err) {
    dbStatus = 'unhealthy';
  }
  
  res.json({ 
    status: 'running', 
    service: 'node-api',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tasks:', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks', details: err.message });
  }
});

// Get single task
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching task:', err.message);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, status } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO tasks (title, description, status) VALUES ($1, $2, $3) RETURNING *',
      [title.trim(), description || '', status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating task:', err.message);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;
    const result = await pool.query(
      'UPDATE tasks SET title = $1, description = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [title, description, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating task:', err.message);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err.message);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Start server with proper error handling
const startServer = async () => {
  console.log('🚀 Starting Node.js API server...');
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('⚠️  Warning: Could not connect to database. The API will still run but database features won't work.');
  }
  
  // Initialize database
  if (dbConnected) {
    await initDB();
  }
  
  // Start server
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  });
  
  // Handle server errors
  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();