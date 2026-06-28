import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool, Queryable } from '../database/connection';
import { Purchase, PurchaseItem, SupplierLedger, SupplierLedgerType, SupplierPayment } from '../../core/entities';

function parsePurchaseRow(row: RowDataPacket): Purchase {
  return {
    id: row.id,
    supplierId: row.supplierId,
    supplier: row.supplierName
      ? {
        id: row.supplierId,
        name: row.supplierName,
        phone: row.supplierPhone ?? null,
        address: row.supplierAddress ?? null,
        totalBalance: parseFloat(row.supplierTotalBalance) || 0,
        createdAt: new Date(row.supplierCreatedAt),
        updatedAt: new Date(row.supplierUpdatedAt),
      }
      : undefined,
    totalAmount: parseFloat(row.totalAmount) || 0,
    items: [],
    createdAt: new Date(row.createdAt),
  };
}

function parsePurchaseItemRow(row: RowDataPacket): PurchaseItem {
  return {
    id: row.id,
    purchaseId: row.purchaseId,
    productId: row.productId,
    quantity: parseInt(row.quantity),
    price: parseFloat(row.price) || 0,
    product: row.productName
      ? {
        id: row.productId,
        name: row.productName,
        price: parseFloat(row.productPrice) || 0,
        stock: parseInt(row.productStock) || 0,
        imagePath: row.productImagePath ?? null,
        createdAt: new Date(row.productCreatedAt),
        updatedAt: new Date(row.productUpdatedAt),
      }
      : undefined,
  };
}

function parseLedgerRow(row: RowDataPacket): SupplierLedger {
  return {
    id: row.id,
    supplierId: row.supplierId,
    type: row.type as SupplierLedgerType,
    amount: parseFloat(row.amount) || 0,
    referenceId: row.referenceId ?? null,
    createdAt: new Date(row.createdAt),
  };
}

function parseSupplierPaymentRow(row: RowDataPacket): SupplierPayment {
  return {
    id: row.id,
    supplierId: row.supplierId,
    supplier: row.supplierName
      ? {
        id: row.supplierId,
        name: row.supplierName,
        phone: row.supplierPhone ?? null,
        address: row.supplierAddress ?? null,
        totalBalance: parseFloat(row.supplierTotalBalance) || 0,
        createdAt: new Date(row.supplierCreatedAt),
        updatedAt: new Date(row.supplierUpdatedAt),
      }
      : undefined,
    amount: parseFloat(row.amount) || 0,
    method: row.method as any, // PaymentMethod enum
    senderName: row.senderName ?? null,
    note: row.note ?? null,
    createdAt: new Date(row.createdAt),
  };
}

export class PurchaseRepository {
  async findById(id: number, db: Queryable = pool): Promise<Purchase | null> {
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT p.*, s.name AS supplierName, s.phone AS supplierPhone,
        s.address AS supplierAddress, s.totalBalance AS supplierTotalBalance,
        s.createdAt AS supplierCreatedAt, s.updatedAt AS supplierUpdatedAt
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplierId = s.id
      WHERE p.id = ?
    `, [id]);
    if (rows.length === 0) return null;
    const purchase = parsePurchaseRow(rows[0]);
    const [itemRows] = await db.query<RowDataPacket[]>(`
      SELECT pi.*, pr.name AS productName, pr.price AS productPrice,
        pr.stock AS productStock, pr.imagePath AS productImagePath,
        pr.createdAt AS productCreatedAt, pr.updatedAt AS productUpdatedAt
      FROM purchase_items pi
      LEFT JOIN products pr ON pi.productId = pr.id
      WHERE pi.purchaseId = ?
    `, [id]);
    purchase.items = itemRows.map(parsePurchaseItemRow);
    return purchase;
  }

  async findAll(db: Queryable = pool): Promise<Purchase[]> {
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT p.*, s.name AS supplierName, s.phone AS supplierPhone,
        s.address AS supplierAddress, s.totalBalance AS supplierTotalBalance,
        s.createdAt AS supplierCreatedAt, s.updatedAt AS supplierUpdatedAt
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplierId = s.id
      ORDER BY p.createdAt DESC
    `);
    const purchases = rows.map(parsePurchaseRow);
    if (purchases.length === 0) return [];
    const ids = purchases.map(p => p.id);
    const [itemRows] = await db.query<RowDataPacket[]>(`
      SELECT pi.*, pr.name AS productName, pr.price AS productPrice,
        pr.stock AS productStock, pr.imagePath AS productImagePath,
        pr.createdAt AS productCreatedAt, pr.updatedAt AS productUpdatedAt
      FROM purchase_items pi
      LEFT JOIN products pr ON pi.productId = pr.id
      WHERE pi.purchaseId IN (${ids.map(() => '?').join(',')})
    `, ids);
    const itemMap = new Map<number, PurchaseItem[]>();
    for (const row of itemRows) {
      const item = parsePurchaseItemRow(row);
      if (!itemMap.has(item.purchaseId)) itemMap.set(item.purchaseId, []);
      itemMap.get(item.purchaseId)!.push(item);
    }
    return purchases.map(p => ({ ...p, items: itemMap.get(p.id) ?? [] }));
  }

  async create(data: { supplierId: number; totalAmount: number }, db: Queryable = pool): Promise<Purchase> {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO purchases (supplierId, totalAmount) VALUES (?, ?)',
      [data.supplierId, data.totalAmount]
    );
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM purchases WHERE id = ?', [result.insertId]);
    return parsePurchaseRow(rows[0]);
  }

  async createItem(
    data: { purchaseId: number; productId: number; quantity: number; price: number },
    db: Queryable = pool
  ): Promise<void> {
    await db.query(
      'INSERT INTO purchase_items (purchaseId, productId, quantity, price) VALUES (?, ?, ?, ?)',
      [data.purchaseId, data.productId, data.quantity, data.price]
    );
  }

  async createLedgerEntry(
    data: { supplierId: number; type: SupplierLedgerType; amount: number; referenceId: number },
    db: Queryable = pool
  ): Promise<void> {
    await db.query(
      'INSERT INTO supplier_ledger (supplierId, type, amount, referenceId) VALUES (?, ?, ?, ?)',
      [data.supplierId, data.type, data.amount, data.referenceId]
    );
  }

  async getLedger(
    supplierId: number,
    filters: { type?: string; startDate?: string; endDate?: string } = {},
    db: Queryable = pool
  ): Promise<SupplierLedger[]> {
    let query = 'SELECT * FROM supplier_ledger WHERE supplierId = ?';
    const params: any[] = [supplierId];
    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.startDate) {
      query += ' AND DATE(createdAt) >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ' AND DATE(createdAt) <= ?';
      params.push(filters.endDate);
    }
    query += ' ORDER BY createdAt DESC';
    const [rows] = await db.query<RowDataPacket[]>(query, params);
    return rows.map(parseLedgerRow);
  }

  async createSupplierPayment(
    data: { supplierId: number; amount: number; method: string; senderName?: string; note?: string },
    db: Queryable = pool
  ): Promise<SupplierPayment> {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO supplier_payments (supplierId, amount, method, senderName, note) VALUES (?, ?, ?, ?, ?)',
      [data.supplierId, data.amount, data.method, data.senderName ?? null, data.note ?? null]
    );
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM supplier_payments WHERE id = ?', [result.insertId]);
    return parseSupplierPaymentRow(rows[0]);
  }

  async findAllSupplierPayments(db: Queryable = pool): Promise<SupplierPayment[]> {
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT sp.*, s.name AS supplierName, s.phone AS supplierPhone,
        s.address AS supplierAddress, s.totalBalance AS supplierTotalBalance,
        s.createdAt AS supplierCreatedAt, s.updatedAt AS supplierUpdatedAt
      FROM supplier_payments sp
      LEFT JOIN suppliers s ON sp.supplierId = s.id
      ORDER BY sp.createdAt DESC
    `);
    return rows.map(parseSupplierPaymentRow);
  }

  async findSupplierPaymentById(id: number, db: Queryable = pool): Promise<SupplierPayment | null> {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM supplier_payments WHERE id = ?', [id]);
    return rows.length > 0 ? parseSupplierPaymentRow(rows[0]) : null;
  }

  async updateSupplierPayment(
    id: number,
    data: { amount: number; method?: string; senderName?: string | null; note?: string | null },
    db: Queryable = pool
  ): Promise<SupplierPayment> {
    const fields: string[] = ['amount = ?'];
    const values: any[] = [data.amount];
    if (data.method !== undefined) { fields.push('method = ?'); values.push(data.method); }
    if (data.senderName !== undefined) { fields.push('senderName = ?'); values.push(data.senderName); }
    if (data.note !== undefined) { fields.push('note = ?'); values.push(data.note); }
    values.push(id);
    await db.query(`UPDATE supplier_payments SET ${fields.join(', ')} WHERE id = ?`, values);
    return (await this.findSupplierPaymentById(id, db))!;
  }

  async updateLedgerEntry(
    id: number,
    amount: number,
    db: Queryable = pool
  ): Promise<void> {
    await db.query('UPDATE supplier_ledger SET amount = ? WHERE id = ?', [amount, id]);
  }

  async findLedgerByReference(
    supplierId: number,
    referenceId: number,
    type: SupplierLedgerType,
    db: Queryable = pool
  ): Promise<SupplierLedger | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM supplier_ledger WHERE supplierId = ? AND referenceId = ? AND type = ?',
      [supplierId, referenceId, type]
    );
    return rows.length > 0 ? parseLedgerRow(rows[0]) : null;
  }

  async deletePurchaseItems(purchaseId: number, db: Queryable = pool): Promise<void> {
    await db.query('DELETE FROM purchase_items WHERE purchaseId = ?', [purchaseId]);
  }

  async updatePurchaseTotalAmount(id: number, totalAmount: number, db: Queryable = pool): Promise<void> {
    await db.query('UPDATE purchases SET totalAmount = ? WHERE id = ?', [totalAmount, id]);
  }
}
