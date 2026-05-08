import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../../infrastructure/database/connection';
import { OrderStatus } from '../../core/entities';

export class DashboardUseCases {
  async getStats() {
    const [orderRows] = await pool.query<RowDataPacket[]>(
      'SELECT SUM(totalAmount) AS totalSales FROM orders WHERE status = ?',
      [OrderStatus.DELIVERED]
    );
    const totalSales = parseFloat(orderRows[0]?.totalSales) || 0;

    const [debtRows] = await pool.query<RowDataPacket[]>(
      'SELECT SUM(totalDebt) AS totalDebt FROM customers'
    );
    const totalDebt = parseFloat(debtRows[0]?.totalDebt) || 0;

    const [paymentRows] = await pool.query<RowDataPacket[]>(
      'SELECT SUM(amount) AS totalPayments FROM payments'
    );
    const totalPayments = parseFloat(paymentRows[0]?.totalPayments) || 0;

    const [purchaseRows] = await pool.query<RowDataPacket[]>(
      'SELECT SUM(totalAmount) AS totalPurchases FROM purchases'
    );
    const totalPurchases = parseFloat(purchaseRows[0]?.totalPurchases) || 0;

    const [companyPaymentRows] = await pool.query<RowDataPacket[]>(
      'SELECT SUM(amount) AS totalCompanyPayments FROM supplier_payments'
    );
    const totalCompanyPayments = parseFloat(companyPaymentRows[0]?.totalCompanyPayments) || 0;

    const [lowStockRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS cnt FROM products WHERE stock < 10'
    );
    const lowStockCount = parseInt(lowStockRows[0]?.cnt) || 0;

    const [topProductRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM products ORDER BY stock DESC LIMIT 5'
    );
    const topProducts = topProductRows.map(r => ({
      id: r.id,
      name: r.name,
      price: parseFloat(r.price) || 0,
      stock: parseInt(r.stock) || 0,
      imagePath: r.imagePath ?? null,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    }));

    return {
      totalSales,
      totalPayments,
      totalDebt,
      totalPurchases,
      totalCompanyPayments,
      lowStockCount,
      topProducts,
      monthlySales: [],
    };
  }
}
