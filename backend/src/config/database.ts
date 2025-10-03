import { Pool } from '@neondatabase/serverless';

// Serverless-optimized configuration
const isProduction = process.env['NODE_ENV'] === 'production';

const connectionString = process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

// Use Neon's Pool which is compatible with node-postgres
export const pool = new Pool({
  connectionString,
  max: isProduction ? 1 : 10,
  idleTimeoutMillis: isProduction ? 0 : 30000,
  connectionTimeoutMillis: 5000,
});

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
