import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool, Queryable } from "../database/connection";
import { Order, OrderItem, OrderStatus, CustomerType } from "../../core/entities";

function parseCustomerRow(row: RowDataPacket) {
  return {
    id: row.customerId,
    name: row.customerName,
    phone: row.customerPhone ?? null,
    address: row.customerAddress ?? null,
    type: (row.customerType ?? 'customer') as CustomerType,
    vehiclePlate: row.customerVehiclePlate ?? null,
    vehicleDetails: row.customerVehicleDetails ?? null,
    isAvailable: Boolean(row.customerIsAvailable ?? 1),
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
    naulonUncollected: parseFloat(row.naulonUncollected) || 0,
    status: row.status as OrderStatus,
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
    deliveryFeePerTon: parseFloat(row.deliveryFeePerTon) || 0,
    totalDelivery: parseFloat(row.totalDelivery) || 0,
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
    o.id, o.orderNumber, o.customerId, o.totalAmount, o.naulonUncollected, o.status,
    o.createdAt, o.updatedAt,
    c.name AS customerName, c.phone AS customerPhone, c.address AS customerAddress,
    c.type AS customerType, c.vehiclePlate AS customerVehiclePlate,
    c.vehicleDetails AS customerVehicleDetails, c.isAvailable AS customerIsAvailable,
    c.totalDebt AS customerTotalDebt, c.createdAt AS customerCreatedAt, c.updatedAt AS customerUpdatedAt
  FROM orders o
  LEFT JOIN customers c ON o.customerId = c.id
`;

const ITEMS_WITH_PRODUCT = `
  SELECT
    oi.id, oi.orderId, oi.productId, oi.quantity, oi.price, oi.deliveryFeePerTon, oi.totalDelivery,
    p.name AS productName, p.price AS productPrice, p.stock AS productStock,
    p.imagePath AS productImagePath, p.createdAt AS productCreatedAt, p.updatedAt AS productUpdatedAt
  FROM order_items oi
  LEFT JOIN products p ON oi.productId = p.id
`;

async function attachItems(orders: Order[], db: Queryable): Promise<Order[]> {
  if (orders.length === 0) return orders;
  const ids = orders.map((o) => o.id);
  const [itemRows] = await db.query<RowDataPacket[]>(`${ITEMS_WITH_PRODUCT} WHERE oi.orderId IN (${ids.map(() => "?").join(",")})`, ids);
  const itemMap = new Map<number, OrderItem[]>();
  for (const row of itemRows) {
    const item = parseItemRow(row);
    if (!itemMap.has(item.orderId)) itemMap.set(item.orderId, []);
    itemMap.get(item.orderId)!.push(item);
  }
  return orders.map((o) => ({ ...o, items: itemMap.get(o.id) ?? [] }));
}

export class OrderRepository {
  async findAll(db: Queryable = pool): Promise<Order[]> {
    const [rows] = await db.query<RowDataPacket[]>(`${ORDER_WITH_RELATIONS} ORDER BY o.createdAt DESC`);
    const orders = rows.map(parseOrderRow);
    return attachItems(orders, db);
  }

  async findById(id: number, db: Queryable = pool): Promise<Order | null> {
    const [rows] = await db.query<RowDataPacket[]>(`${ORDER_WITH_RELATIONS} WHERE o.id = ?`, [id]);
    if (rows.length === 0) return null;
    const orders = await attachItems([parseOrderRow(rows[0])], db);
    return orders[0];
  }

  async create(
    data: {
      orderNumber: string;
      customerId: number;
      totalAmount: number;
      naulonUncollected: number;
      status: OrderStatus;
    },
    db: Queryable = pool,
  ): Promise<Order> {
    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO orders (orderNumber, customerId, totalAmount, naulonUncollected, status) VALUES (?, ?, ?, ?, ?)",
      [data.orderNumber, data.customerId, data.totalAmount, data.naulonUncollected, data.status],
    );
    return (await this.findById(result.insertId, db))!;
  }

  async createItem(
    data: { orderId: number; productId: number; quantity: number; price: number; deliveryFeePerTon?: number; totalDelivery?: number },
    db: Queryable = pool,
  ): Promise<void> {
    await db.query("INSERT INTO order_items (orderId, productId, quantity, price, deliveryFeePerTon, totalDelivery) VALUES (?, ?, ?, ?, ?, ?)", [
      data.orderId,
      data.productId,
      data.quantity,
      data.price,
      data.deliveryFeePerTon || 0,
      data.totalDelivery || 0,
    ]);
  }

  async updateStatus(id: number, status: OrderStatus, db: Queryable = pool): Promise<void> {
    await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
  }

  async update(
    id: number,
    data: { customerId: number; totalAmount: number; naulonUncollected: number },
    db: Queryable = pool,
  ): Promise<void> {
    await db.query("UPDATE orders SET customerId = ?, totalAmount = ?, naulonUncollected = ? WHERE id = ?", [
      data.customerId,
      data.totalAmount,
      data.naulonUncollected,
      id,
    ]);
  }

  async deleteItems(orderId: number, db: Queryable = pool): Promise<void> {
    await db.query("DELETE FROM order_items WHERE orderId = ?", [orderId]);
  }

  async delete(id: number, db: Queryable = pool): Promise<void> {
    await db.query("DELETE FROM orders WHERE id = ?", [id]);
  }

  async findByCustomerId(customerId: number, db: Queryable = pool): Promise<Order[]> {
    const [rows] = await db.query<RowDataPacket[]>(`${ORDER_WITH_RELATIONS} WHERE o.customerId = ? ORDER BY o.createdAt DESC`, [customerId]);
    return attachItems(rows.map(parseOrderRow), db);
  }

  async findByCustomerIdFiltered(
    customerId: number,
    filters: { startDate?: string; endDate?: string; keyword?: string } = {},
    db: Queryable = pool,
  ): Promise<Order[]> {
    let query = `${ORDER_WITH_RELATIONS} WHERE o.customerId = ?`;
    const params: any[] = [customerId];
    if (filters.startDate) {
      query += " AND DATE(o.createdAt) >= ?";
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += " AND DATE(o.createdAt) <= ?";
      params.push(filters.endDate);
    }
    if (filters.keyword) {
      query += " AND (o.orderNumber LIKE ? OR CAST(o.totalAmount AS CHAR) LIKE ?)";
      params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
    }
    query += " ORDER BY o.createdAt DESC";
    const [rows] = await db.query<RowDataPacket[]>(query, params);
    return attachItems(rows.map(parseOrderRow), db);
  }
}
