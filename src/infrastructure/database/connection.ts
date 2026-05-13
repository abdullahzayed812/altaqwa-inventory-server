import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

export const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agriculture_inventory',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  decimalNumbers: true,
});

export type Queryable = Pool | PoolConnection;

export async function withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function initDatabase(): Promise<void> {
  const conn = await pool.getConnection();
  await conn.query('SELECT 1');
  conn.release();
}
