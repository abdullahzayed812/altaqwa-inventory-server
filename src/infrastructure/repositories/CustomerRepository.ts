import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool, Queryable } from '../database/connection';
import { Customer } from '../../core/entities';
import { CreateCustomerDto, UpdateCustomerDto } from '../../core/dto';

function parseRow(row: RowDataPacket): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? null,
    address: row.address ?? null,
    totalDebt: parseFloat(row.totalDebt) || 0,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export class CustomerRepository {
  async findAll(db: Queryable = pool): Promise<Customer[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM customers ORDER BY createdAt DESC'
    );
    return rows.map(parseRow);
  }

  async findById(id: number, db: Queryable = pool): Promise<Customer | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? parseRow(rows[0]) : null;
  }

  async create(data: CreateCustomerDto, db: Queryable = pool): Promise<Customer> {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO customers (name, phone, address, totalDebt) VALUES (?, ?, ?, ?)',
      [data.name, data.phone ?? null, data.address ?? null, data.initialDebt ?? 0]
    );
    const customer = await this.findById(result.insertId, db);
    return customer!;
  }

  async update(id: number, data: UpdateCustomerDto, db: Queryable = pool): Promise<Customer> {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address); }
    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return (await this.findById(id, db))!;
  }

  async delete(id: number, db: Queryable = pool): Promise<void> {
    await db.query('DELETE FROM customers WHERE id = ?', [id]);
  }

  async updateDebt(id: number, delta: number, db: Queryable = pool): Promise<void> {
    await db.query(
      'UPDATE customers SET totalDebt = totalDebt + ? WHERE id = ?',
      [delta, id]
    );
  }
}
