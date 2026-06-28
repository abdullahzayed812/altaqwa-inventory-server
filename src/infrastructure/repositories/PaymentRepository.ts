import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool, Queryable } from '../database/connection';
import { Payment, PaymentMethod, CustomerType } from '../../core/entities';
import { AddPaymentDto, UpdatePaymentDto } from '../../core/dto';

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
        type: (row.customerType ?? 'customer') as CustomerType,
        vehiclePlate: row.customerVehiclePlate ?? null,
        vehicleDetails: row.customerVehicleDetails ?? null,
        isAvailable: Boolean(row.customerIsAvailable ?? 1),
        totalDebt: parseFloat(row.customerTotalDebt) || 0,
        createdAt: new Date(row.customerCreatedAt),
        updatedAt: new Date(row.customerUpdatedAt),
      }
      : undefined,
    amount: parseFloat(row.amount) || 0,
    method: row.method as PaymentMethod,
    senderName: row.senderName ?? null,
    notes: row.notes ?? null,
    createdAt: new Date(row.createdAt),
  };
}

const JOIN_CUSTOMER = `
  SELECT py.*, c.name AS customerName, c.phone AS customerPhone,
    c.address AS customerAddress, c.type AS customerType,
    c.vehiclePlate AS customerVehiclePlate, c.vehicleDetails AS customerVehicleDetails,
    c.isAvailable AS customerIsAvailable,
    c.totalDebt AS customerTotalDebt,
    c.createdAt AS customerCreatedAt, c.updatedAt AS customerUpdatedAt
  FROM payments py
  LEFT JOIN customers c ON py.customerId = c.id
`;

export class PaymentRepository {
  async findAll(db: Queryable = pool): Promise<Payment[]> {
    const [rows] = await db.query<RowDataPacket[]>(`${JOIN_CUSTOMER} ORDER BY py.createdAt DESC`);
    return rows.map(parseRow);
  }

  async findById(id: number, db: Queryable = pool): Promise<Payment | null> {
    const [rows] = await db.query<RowDataPacket[]>(`${JOIN_CUSTOMER} WHERE py.id = ?`, [id]);
    return rows.length > 0 ? parseRow(rows[0]) : null;
  }

  async findByCustomerId(customerId: number, db: Queryable = pool): Promise<Payment[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM payments WHERE customerId = ? ORDER BY createdAt DESC',
      [customerId]
    );
    return rows.map(r => ({ ...parseRow(r), customerId }));
  }

  async findByCustomerIdFiltered(
    customerId: number,
    filters: { startDate?: string; endDate?: string; keyword?: string } = {},
    db: Queryable = pool
  ): Promise<Payment[]> {
    let query = 'SELECT * FROM payments WHERE customerId = ?';
    const params: any[] = [customerId];
    if (filters.startDate) {
      query += ' AND DATE(createdAt) >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ' AND DATE(createdAt) <= ?';
      params.push(filters.endDate);
    }
    if (filters.keyword) {
      query += ' AND (notes LIKE ? OR CAST(amount AS CHAR) LIKE ?)';
      params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
    }
    query += ' ORDER BY createdAt DESC';
    const [rows] = await db.query<RowDataPacket[]>(query, params);
    return rows.map(r => ({ ...parseRow(r), customerId }));
  }

  async create(data: AddPaymentDto, db: Queryable = pool): Promise<Payment> {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO payments (customerId, amount, method, senderName, notes) VALUES (?, ?, ?, ?, ?)',
      [data.customerId, data.amount, data.method, data.senderName ?? null, data.notes ?? null]
    );
    return (await this.findById(result.insertId, db))!;
  }

  async update(id: number, data: UpdatePaymentDto, db: Queryable = pool): Promise<Payment> {
    const fields: string[] = ['amount = ?'];
    const values: any[] = [data.amount];
    if (data.method !== undefined) { fields.push('method = ?'); values.push(data.method); }
    if (data.senderName !== undefined) { fields.push('senderName = ?'); values.push(data.senderName); }
    if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
    values.push(id);
    await db.query(`UPDATE payments SET ${fields.join(', ')} WHERE id = ?`, values);
    return (await this.findById(id, db))!;
  }

  async sumByCustomer(db: Queryable = pool): Promise<{ customerId: number; total: number }[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT customerId, SUM(amount) AS total FROM payments GROUP BY customerId'
    );
    return rows.map(r => ({ customerId: r.customerId, total: parseFloat(r.total) || 0 }));
  }
}
