import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool, Queryable } from '../database/connection';
import { Driver, DriverLedger, DriverLedgerType, DriverPayment } from '../../core/entities';
import { CreateDriverDto, UpdateDriverDto } from '../../core/dto';

export function parseRow(row: RowDataPacket): Driver {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? null,
    vehiclePlate: row.vehiclePlate ?? null,
    vehicleDetails: row.vehicleDetails ?? null,
    isAvailable: Boolean(row.isAvailable),
    totalBalance: parseFloat(row.totalBalance) || 0,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function parseLedgerRow(row: RowDataPacket): DriverLedger {
  return {
    id: row.id,
    driverId: row.driverId,
    type: row.type as DriverLedgerType,
    amount: parseFloat(row.amount) || 0,
    referenceId: row.referenceId ?? null,
    notes: row.notes ?? null,
    createdAt: new Date(row.createdAt),
  };
}

function parsePaymentRow(row: RowDataPacket): DriverPayment {
  return {
    id: row.id,
    driverId: row.driverId,
    amount: parseFloat(row.amount) || 0,
    notes: row.notes ?? null,
    createdAt: new Date(row.createdAt),
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
      'INSERT INTO drivers (name, phone, vehiclePlate, vehicleDetails, totalBalance) VALUES (?, ?, ?, ?, ?)',
      [data.name, data.phone ?? null, data.vehiclePlate ?? null, data.vehicleDetails ?? null, data.initialBalance ?? 0]
    );
    return (await this.findById(result.insertId, db))!;
  }

  async update(id: number, data: UpdateDriverDto, db: Queryable = pool): Promise<Driver> {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.vehiclePlate !== undefined) { fields.push('vehiclePlate = ?'); values.push(data.vehiclePlate); }
    if (data.vehicleDetails !== undefined) { fields.push('vehicleDetails = ?'); values.push(data.vehicleDetails); }
    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE drivers SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return (await this.findById(id, db))!;
  }

  async delete(id: number, db: Queryable = pool): Promise<void> {
    await db.query('DELETE FROM drivers WHERE id = ?', [id]);
  }

  async updateAvailability(id: number, isAvailable: boolean, db: Queryable = pool): Promise<Driver> {
    await db.query(
      'UPDATE drivers SET isAvailable = ? WHERE id = ?',
      [isAvailable ? 1 : 0, id]
    );
    return (await this.findById(id, db))!;
  }

  async updateBalance(id: number, delta: number, db: Queryable = pool): Promise<void> {
    await db.query(
      'UPDATE drivers SET totalBalance = totalBalance + ? WHERE id = ?',
      [delta, id]
    );
  }

  async createLedgerEntry(
    data: { driverId: number; type: DriverLedgerType; amount: number; referenceId?: number; notes?: string },
    db: Queryable = pool
  ): Promise<void> {
    await db.query(
      'INSERT INTO driver_ledger (driverId, type, amount, referenceId, notes) VALUES (?, ?, ?, ?, ?)',
      [data.driverId, data.type, data.amount, data.referenceId ?? null, data.notes ?? null]
    );
  }

  async deleteLedgerEntryByReference(
    driverId: number, referenceId: number, type: DriverLedgerType, db: Queryable = pool
  ): Promise<void> {
    await db.query(
      'DELETE FROM driver_ledger WHERE driverId = ? AND referenceId = ? AND type = ?',
      [driverId, referenceId, type]
    );
  }

  async createPayment(
    data: { driverId: number; amount: number; notes?: string }, db: Queryable = pool
  ): Promise<DriverPayment> {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO driver_payments (driverId, amount, notes) VALUES (?, ?, ?)',
      [data.driverId, data.amount, data.notes ?? null]
    );
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM driver_payments WHERE id = ?', [result.insertId]
    );
    return parsePaymentRow(rows[0]);
  }

  async getLedger(driverId: number, db: Queryable = pool): Promise<DriverLedger[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM driver_ledger WHERE driverId = ? ORDER BY createdAt DESC',
      [driverId]
    );
    return rows.map(parseLedgerRow);
  }
}
