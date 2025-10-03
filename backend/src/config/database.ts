import { Pool as NeonPool } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';

// Environment detection
const isProduction = process.env['NODE_ENV'] === 'production';

// Create pool based on environment
let pool: NeonPool | PgPool;

if (isProduction) {
  // Production: Use Neon serverless driver
  const connectionString = process.env['DATABASE_URL'];

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined');
  }

  pool = new NeonPool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 5000,
  });
} else {
  // Development: Use standard pg driver with local PostgreSQL
  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

  if (!DB_HOST || !DB_PORT || !DB_NAME || !DB_USER || !DB_PASSWORD) {
    throw new Error('Local PostgreSQL environment variables are not defined (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)');
  }

  pool = new PgPool({
    host: DB_HOST,
    port: parseInt(DB_PORT, 10),
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

// Export the pool
export { pool };

/**
 * Execute a query using the pool
 */
export const query = async <T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> => {
  const result = await pool.query(text, params);
  return result as { rows: T[]; rowCount: number };
};

/**
 * Get a client from the pool for transactions
 */
export const getClient = () => pool.connect();

/**
 * Execute queries in a transaction
 */
export const transaction = async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
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

export default pool;
