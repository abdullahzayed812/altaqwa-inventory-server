import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool, Queryable } from '../database/connection';
import { Order, OrderItem, OrderStatus } from '../../core/entities';
import { parseRow as parseProduct } from './ProductRepository';
import { parseRow as parseDriver } from './DriverRepository';

function parseCustomerRow(row: RowDataPacket) {
  return {
    id: row.customerId,
    name: row.customerName,
    phone: row.customerPhone ?? null,
    address: row.customerAddress ?? null,
    totalDebt: parseFloat(row.customerTotalDebt) || 0,
    createdAt: new Date(row.customerCreatedAt),
    updatedAt: new Date(row.customerUpdatedAt),
  };
}

function parseOrderRow(row: RowDataPacket): Order {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    customerId: row.customerId,
    customer: row.customerName ? parseCustomerRow(row) : undefined,
    totalAmount: parseFloat(row.totalAmount) || 0,
    status: row.status as OrderStatus,
    driverId: row.driverId ?? null,
    assignedDriver: row.driverId
      ? {
          id: row.driverId,
          name: row.driverName,
          phone: row.driverPhone ?? null,
          vehiclePlate: row.vehiclePlate ?? null,
          vehicleDetails: row.vehicleDetails ?? null,
          isAvailable: Boolean(row.driverIsAvailable),
          createdAt: new Date(row.driverCreatedAt),
          updatedAt: new Date(row.driverUpdatedAt),
        }
      : null,
    items: [],
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function parseItemRow(row: RowDataPacket): OrderItem {
  return {
    id: row.id,
    orderId: row.orderId,
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

const ORDER_WITH_RELATIONS = `
  SELECT
    o.id, o.orderNumber, o.customerId, o.totalAmount, o.status, o.driverId,
    o.createdAt, o.updatedAt,
    c.name AS customerName, c.phone AS customerPhone, c.address AS customerAddress,
    c.totalDebt AS customerTotalDebt, c.createdAt AS customerCreatedAt, c.updatedAt AS customerUpdatedAt,
    d.name AS driverName, d.phone AS driverPhone, d.vehiclePlate, d.vehicleDetails,
    d.isAvailable AS driverIsAvailable, d.createdAt AS driverCreatedAt, d.updatedAt AS driverUpdatedAt
  FROM orders o
  LEFT JOIN customers c ON o.customerId = c.id
  LEFT JOIN drivers d ON o.driverId = d.id
`;

const ITEMS_WITH_PRODUCT = `
  SELECT
    oi.id, oi.orderId, oi.productId, oi.quantity, oi.price,
    p.name AS productName, p.price AS productPrice, p.stock AS productStock,
    p.imagePath AS productImagePath, p.createdAt AS productCreatedAt, p.updatedAt AS productUpdatedAt
  FROM order_items oi
  LEFT JOIN products p ON oi.productId = p.id
`;

async function attachItems(orders: Order[], db: Queryable): Promise<Order[]> {
  if (orders.length === 0) return orders;
  const ids = orders.map(o => o.id);
  const [itemRows] = await db.query<RowDataPacket[]>(
    `${ITEMS_WITH_PRODUCT} WHERE oi.orderId IN (${ids.map(() => '?').join(',')})`,
    ids
  );
  const itemMap = new Map<number, OrderItem[]>();
  for (const row of itemRows) {
    const item = parseItemRow(row);
    if (!itemMap.has(item.orderId)) itemMap.set(item.orderId, []);
    itemMap.get(item.orderId)!.push(item);
  }
  return orders.map(o => ({ ...o, items: itemMap.get(o.id) ?? [] }));
}

export class OrderRepository {
  async findAll(db: Queryable = pool): Promise<Order[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      `${ORDER_WITH_RELATIONS} ORDER BY o.createdAt DESC`
    );
    const orders = rows.map(parseOrderRow);
    return attachItems(orders, db);
  }

  async findById(id: number, db: Queryable = pool): Promise<Order | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      `${ORDER_WITH_RELATIONS} WHERE o.id = ?`,
      [id]
    );
    if (rows.length === 0) return null;
    const orders = await attachItems([parseOrderRow(rows[0])], db);
    return orders[0];
  }

  async create(
    data: { orderNumber: string; customerId: number; totalAmount: number; status: OrderStatus },
    db: Queryable = pool
  ): Promise<Order> {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO orders (orderNumber, customerId, totalAmount, status) VALUES (?, ?, ?, ?)',
      [data.orderNumber, data.customerId, data.totalAmount, data.status]
    );
    return (await this.findById(result.insertId, db))!;
  }

  async createItem(
    data: { orderId: number; productId: number; quantity: number; price: number },
    db: Queryable = pool
  ): Promise<void> {
    await db.query(
      'INSERT INTO order_items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)',
      [data.orderId, data.productId, data.quantity, data.price]
    );
  }

  async updateStatus(id: number, status: OrderStatus, db: Queryable = pool): Promise<void> {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  }

  async assignDriver(orderId: number, driverId: number, db: Queryable = pool): Promise<Order> {
    await db.query(
      'UPDATE orders SET driverId = ?, status = ? WHERE id = ?',
      [driverId, OrderStatus.ASSIGNED, orderId]
    );
    return (await this.findById(orderId, db))!;
  }

  async findByCustomerId(customerId: number, db: Queryable = pool): Promise<Order[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      `${ORDER_WITH_RELATIONS} WHERE o.customerId = ? ORDER BY o.createdAt DESC`,
      [customerId]
    );
    return attachItems(rows.map(parseOrderRow), db);
  }
}
