import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool, Queryable } from '../database/connection';
import { Payment, PaymentMethod } from '../../core/entities';
import { AddPaymentDto } from '../../core/dto';

function parseRow(row: RowDataPacket): Payment {
  return {
    id: row.id,
    customerId: row.customerId,
    customer: row.customerName
      ? {
          id: row.customerId,
          name: row.customerName,
          phone: row.customerPhone ?? null,
          address: row.customerAddress ?? null,
          totalDebt: parseFloat(row.customerTotalDebt) || 0,
          createdAt: new Date(row.customerCreatedAt),
          updatedAt: new Date(row.customerUpdatedAt),
        }
      : undefined,
    amount: parseFloat(row.amount) || 0,
    method: row.method as PaymentMethod,
    notes: row.notes ?? null,
    createdAt: new Date(row.createdAt),
  };
}

export class PaymentRepository {
  async findAll(db: Queryable = pool): Promise<Payment[]> {
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT py.*, c.name AS customerName, c.phone AS customerPhone,
        c.address AS customerAddress, c.totalDebt AS customerTotalDebt,
        c.createdAt AS customerCreatedAt, c.updatedAt AS customerUpdatedAt
      FROM payments py
      LEFT JOIN customers c ON py.customerId = c.id
      ORDER BY py.createdAt DESC
    `);
    return rows.map(parseRow);
  }

  async findByCustomerId(customerId: number, db: Queryable = pool): Promise<Payment[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM payments WHERE customerId = ? ORDER BY createdAt DESC',
      [customerId]
    );
    return rows.map(r => ({ ...parseRow(r), customerId }));
  }

  async create(data: AddPaymentDto, db: Queryable = pool): Promise<Payment> {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO payments (customerId, amount, method, notes) VALUES (?, ?, ?, ?)',
      [data.customerId, data.amount, data.method, data.notes ?? null]
    );
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT py.*, c.name AS customerName, c.phone AS customerPhone,
        c.address AS customerAddress, c.totalDebt AS customerTotalDebt,
        c.createdAt AS customerCreatedAt, c.updatedAt AS customerUpdatedAt
      FROM payments py
      LEFT JOIN customers c ON py.customerId = c.id
      WHERE py.id = ?
    `, [result.insertId]);
    return parseRow(rows[0]);
  }

  async sumByCustomer(db: Queryable = pool): Promise<{ customerId: number; total: number }[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT customerId, SUM(amount) AS total FROM payments GROUP BY customerId'
    );
    return rows.map(r => ({ customerId: r.customerId, total: parseFloat(r.total) || 0 }));
  }
}
