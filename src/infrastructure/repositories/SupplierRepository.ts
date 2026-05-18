import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool, Queryable } from '../database/connection';
import { Supplier } from '../../core/entities';
import { CreateSupplierDto } from '../../core/dto';

export function parseRow(row: RowDataPacket): Supplier {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? null,
    address: row.address ?? null,
    totalBalance: parseFloat(row.totalBalance) || 0,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export class SupplierRepository {
  async findAll(db: Queryable = pool): Promise<Supplier[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM suppliers ORDER BY name ASC'
    );
    return rows.map(parseRow);
  }

  async findById(id: number, db: Queryable = pool): Promise<Supplier | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM suppliers WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? parseRow(rows[0]) : null;
  }

  async create(data: CreateSupplierDto, db: Queryable = pool): Promise<Supplier> {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO suppliers (name, phone, address, totalBalance) VALUES (?, ?, ?, ?)',
      [data.name, data.phone ?? null, data.address ?? null, data.initialBalance ?? 0]
    );
    return (await this.findById(result.insertId, db))!;
  }

  async updateBalance(id: number, delta: number, db: Queryable = pool): Promise<void> {
    await db.query(
      'UPDATE suppliers SET totalBalance = totalBalance + ? WHERE id = ?',
      [delta, id]
    );
  }
}
