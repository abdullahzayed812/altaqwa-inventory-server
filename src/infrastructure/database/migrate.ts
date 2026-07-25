import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'agriculture_inventory';

// Every FK that should cascade so deleting a customer/supplier also removes
// their orders/payments/purchases/ledger entries instead of being blocked.
const CASCADE_TARGETS = [
  { table: 'orders', column: 'customerId' },
  { table: 'order_items', column: 'orderId' },
  { table: 'payments', column: 'customerId' },
  { table: 'purchases', column: 'supplierId' },
  { table: 'purchase_items', column: 'purchaseId' },
  { table: 'supplier_payments', column: 'supplierId' },
  { table: 'supplier_ledger', column: 'supplierId' },
];

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME,
  });

  try {
    for (const { table, column } of CASCADE_TARGETS) {
      const [rows] = await conn.query(
        `SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME
         FROM information_schema.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
           AND REFERENCED_TABLE_NAME IS NOT NULL`,
        [DB_NAME, table, column]
      );
      const fk = (rows as any[])[0];
      if (!fk) {
        console.log(`skip ${table}.${column}: no foreign key found`);
        continue;
      }
      await conn.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
      await conn.query(
        `ALTER TABLE \`${table}\` ADD FOREIGN KEY (\`${column}\`) REFERENCES \`${fk.REFERENCED_TABLE_NAME}\`(id) ON DELETE CASCADE`
      );
      console.log(`migrated ${table}.${column} -> ON DELETE CASCADE`);
    }
    console.log('Migration complete.');
  } finally {
    await conn.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
