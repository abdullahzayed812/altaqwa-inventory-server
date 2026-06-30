import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool, Queryable } from '../database/connection';
import { Product } from '../../core/entities';
import { CreateProductDto } from '../../core/dto';

export function parseRow(row: RowDataPacket): Product {
  return {
    id: row.id,
    name: row.name,
    price: row.price !== null && row.price !== undefined ? parseFloat(row.price) : null,
    stock: row.stock !== null && row.stock !== undefined ? parseInt(row.stock) : null,
    imagePath: row.imagePath ?? null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export class ProductRepository {
  async findAll(db: Queryable = pool): Promise<Product[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM products ORDER BY createdAt DESC'
    );
    return rows.map(parseRow);
  }

  async findById(id: number, db: Queryable = pool): Promise<Product | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? parseRow(rows[0]) : null;
  }

  async findByIds(ids: number[], db: Queryable = pool): Promise<Product[]> {
    if (ids.length === 0) return [];
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT * FROM products WHERE id IN (${ids.map(() => '?').join(',')})`,
      ids
    );
    return rows.map(parseRow);
  }

  async create(data: CreateProductDto, db: Queryable = pool): Promise<Product> {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO products (name, price, stock, imagePath) VALUES (?, ?, ?, ?)',
      [data.name, data.price, data.stock, data.imagePath ?? null]
    );
    return (await this.findById(result.insertId, db))!;
  }

  async update(id: number, data: Partial<CreateProductDto>, db: Queryable = pool): Promise<Product> {
    const updates: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.price !== undefined) { updates.push('price = ?'); values.push(data.price); }
    if (data.stock !== undefined) { updates.push('stock = ?'); values.push(data.stock); }
    if (data.imagePath !== undefined) { updates.push('imagePath = ?'); values.push(data.imagePath); }

    if (updates.length > 0) {
      values.push(id);
      await db.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);
    }
    return (await this.findById(id, db))!;
  }

  async updateStock(id: number, delta: number, db: Queryable = pool): Promise<void> {
    await db.query(
      'UPDATE products SET stock = stock + ? WHERE id = ?',
      [delta, id]
    );
  }

  async checkStock(id: number, db: Queryable = pool): Promise<number> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT stock FROM products WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? parseInt(rows[0].stock) : 0;
  }
}
