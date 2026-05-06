import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'agriculture_inventory';

async function reset() {
  console.log(`Resetting database "${DB_NAME}"...`);

  // Connect without specifying a database so we can drop/create it
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    console.log('Dropped existing database.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await conn.query(statement);
    }

    console.log('Database recreated from schema successfully.');
  } finally {
    await conn.end();
  }
}

reset().catch(err => {
  console.error('Reset failed:', err);
  process.exit(1);
});
