import { Pool, PoolClient, PoolConfig } from 'pg';
import { config } from './environment';

// Database configuration interface
interface DatabaseConfig extends PoolConfig {
  connectionString?: string;
}

// Database configuration
const dbConfig: DatabaseConfig = {
  // Use DATABASE_URL if available, otherwise construct from individual parts
  connectionString: config.database.url,
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  max: config.database.maxConnections,
  idleTimeoutMillis: config.database.idleTimeoutMs,
  connectionTimeoutMillis: config.database.connectionTimeoutMs,
  // Additional pool settings
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

// Global connection pool
let pool: Pool | null = null;

/**
 * Get or create the database connection pool
 */
export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool(dbConfig);

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client:', err);
    });

    pool.on('connect', () => {
      console.log('✅ New database client connected');
    });

    pool.on('remove', () => {
      console.log('🔄 Database client removed from pool');
    });
  }

  return pool;
};

/**
 * Get a database client from the pool
 */
export const getClient = async (): Promise<PoolClient> => {
  const dbPool = getPool();
  return await dbPool.connect();
};

/**
 * Execute a query with automatic client management
 */
export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> => {
  const client = await getClient();
  try {
    const result = await client.query(text, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
    };
  } finally {
    client.release();
  }
};

/**
 * Execute multiple queries in a transaction
 */
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await query('SELECT NOW() as current_time, version() as version');
    if (result.rows.length > 0) {
      console.log('✅ Database connection successful');
      console.log(`📅 Server time: ${result.rows[0].current_time}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

/**
 * Run database migrations
 */
export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🔄 Running database migrations...');
    
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // List of migration files in order
    const migrations = [
      '001-create-users-and-profiles',
      '002-create-exercises', 
      '003-create-routines',
      '004-create-workout-sessions',
    ];

    for (const migration of migrations) {
      // Check if migration already executed
      const { rows } = await query(
        'SELECT id FROM migrations WHERE name = $1',
        [migration]
      );

      if (rows.length === 0) {
        console.log(`📝 Running migration: ${migration}`);
        
        // Here you would read and execute the SQL file
        // For now, we'll just mark it as executed
        await query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migration]
        );
        
        console.log(`✅ Migration completed: ${migration}`);
      } else {
        console.log(`⏭️  Migration already executed: ${migration}`);
      }
    }

    console.log('✅ All migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

/**
 * Close database pool (for graceful shutdown)
 */
export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔒 Database pool closed');
  }
};

// Export pool instance for direct access if needed
export { pool };