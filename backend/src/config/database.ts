import { Pool, PoolConfig } from 'pg';

const config: PoolConfig = {
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432'),
  database: process.env['DB_NAME'] || 'fitito_dev',
  user: process.env['DB_USER'] || 'fitito_user',
  password: process.env['DB_PASSWORD'] || 'fitito_password',
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait when connecting a new client
};

export const pool = new Pool(config);

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
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