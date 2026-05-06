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
    note: row.note ?? null,
    createdAt: new Date(row.createdAt),
  };
}

export class PurchaseRepository {
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

  async getLedger(supplierId: number, db: Queryable = pool): Promise<SupplierLedger[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM supplier_ledger WHERE supplierId = ? ORDER BY createdAt DESC',
      [supplierId]
    );
    return rows.map(parseLedgerRow);
  }

  async createSupplierPayment(
    data: { supplierId: number; amount: number; note?: string },
    db: Queryable = pool
  ): Promise<SupplierPayment> {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO supplier_payments (supplierId, amount, note) VALUES (?, ?, ?)',
      [data.supplierId, data.amount, data.note ?? null]
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
}
