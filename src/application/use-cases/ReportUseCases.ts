import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../../infrastructure/database/connection';
import { OrderStatus } from '../../core/entities';

export class ReportUseCases {
  async getReportData() {
    const [orderRows] = await pool.query<RowDataPacket[]>(`
      SELECT o.createdAt AS date, o.totalAmount AS total, c.name AS customer
      FROM orders o
      LEFT JOIN customers c ON o.customerId = c.id
      WHERE o.status = ?
      ORDER BY o.createdAt DESC
    `, [OrderStatus.DELIVERED]);

    const recentSales = orderRows.map(r => ({
      date: new Date(r.date),
      total: parseFloat(r.total) || 0,
      customer: r.customer,
    }));

    const [customerRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, phone, totalDebt FROM customers ORDER BY totalDebt DESC'
    );

    const customerBalances = customerRows.map(r => ({
      id: r.id,
      name: r.name,
      phone: r.phone ?? null,
      totalDebt: parseFloat(r.totalDebt) || 0,
    }));

    return { recentSales, customerBalances };
  }
}
