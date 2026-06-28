import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool, Queryable } from '../database/connection';
import { Customer, CustomerType } from '../../core/entities';
import { CreateCustomerDto, UpdateCustomerDto } from '../../core/dto';

export function parseRow(row: RowDataPacket): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? null,
    address: row.address ?? null,
    type: (row.type ?? 'customer') as CustomerType,
    vehiclePlate: row.vehiclePlate ?? null,
    vehicleDetails: row.vehicleDetails ?? null,
    isAvailable: Boolean(row.isAvailable ?? 1),
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

  async findAllByType(type: CustomerType, db: Queryable = pool): Promise<Customer[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM customers WHERE type = ? ORDER BY name ASC',
      [type]
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
      'INSERT INTO customers (name, phone, address, type, vehiclePlate, vehicleDetails, isAvailable, totalDebt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.name,
        data.phone ?? null,
        data.address ?? null,
        data.type ?? CustomerType.CUSTOMER,
        data.vehiclePlate ?? null,
        data.vehicleDetails ?? null,
        1,
        data.initialDebt ?? 0,
      ]
    );
    return (await this.findById(result.insertId, db))!;
  }

  async update(id: number, data: UpdateCustomerDto, db: Queryable = pool): Promise<Customer> {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address); }
    if (data.vehiclePlate !== undefined) { fields.push('vehiclePlate = ?'); values.push(data.vehiclePlate); }
    if (data.vehicleDetails !== undefined) { fields.push('vehicleDetails = ?'); values.push(data.vehicleDetails); }
    if (data.isAvailable !== undefined) { fields.push('isAvailable = ?'); values.push(data.isAvailable ? 1 : 0); }
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
