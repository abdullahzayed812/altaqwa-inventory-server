import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool, Queryable } from '../database/connection';
import { Driver } from '../../core/entities';
import { CreateDriverDto } from '../../core/dto';

export function parseRow(row: RowDataPacket): Driver {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? null,
    vehiclePlate: row.vehiclePlate ?? null,
    vehicleDetails: row.vehicleDetails ?? null,
    isAvailable: Boolean(row.isAvailable),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export class DriverRepository {
  async findAll(db: Queryable = pool): Promise<Driver[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM drivers ORDER BY name ASC'
    );
    return rows.map(parseRow);
  }

  async findById(id: number, db: Queryable = pool): Promise<Driver | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM drivers WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? parseRow(rows[0]) : null;
  }

  async create(data: CreateDriverDto, db: Queryable = pool): Promise<Driver> {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO drivers (name, phone, vehiclePlate, vehicleDetails) VALUES (?, ?, ?, ?)',
      [data.name, data.phone ?? null, data.vehiclePlate ?? null, data.vehicleDetails ?? null]
    );
    return (await this.findById(result.insertId, db))!;
  }

  async updateAvailability(id: number, isAvailable: boolean, db: Queryable = pool): Promise<Driver> {
    await db.query(
      'UPDATE drivers SET isAvailable = ? WHERE id = ?',
      [isAvailable ? 1 : 0, id]
    );
    return (await this.findById(id, db))!;
  }
}
