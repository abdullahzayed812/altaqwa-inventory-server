import { withTransaction } from '../../infrastructure/database/connection';
import { OrderRepository } from '../../infrastructure/repositories/OrderRepository';
import { ProductRepository } from '../../infrastructure/repositories/ProductRepository';
import { CustomerRepository } from '../../infrastructure/repositories/CustomerRepository';
import { Order, OrderStatus } from '../../core/entities';
import { CreateOrderDto } from '../../core/dto';

const orderRepo = new OrderRepository();
const productRepo = new ProductRepository();
const customerRepo = new CustomerRepository();

export class OrderUseCases {
  async getAllOrders(): Promise<Order[]> {
    return orderRepo.findAll();
  }

  async getCustomerOrders(customerId: number, filters: { startDate?: string; endDate?: string; keyword?: string } = {}): Promise<Order[]> {
    return orderRepo.findByCustomerIdFiltered(customerId, filters);
  }

  async createOrder(data: CreateOrderDto): Promise<Order> {
    return withTransaction(async (conn) => {
      const customer = await customerRepo.findById(data.customerId, conn);
      if (!customer) throw new Error('Customer not found');

      const orderNumber = `ORD-${Date.now().toString().slice(-4)}`;
      const naulon = data.naulonUncollected ?? 0;

      const order = await orderRepo.create(
        {
          orderNumber,
          customerId: data.customerId,
          totalAmount: data.totalAmount,
          naulonUncollected: naulon,
          status: OrderStatus.PENDING,
        },
        conn
      );

      for (const item of data.items) {
        const stock = await productRepo.checkStock(item.productId, conn);
        if (stock < item.quantity) {
          const product = await productRepo.findById(item.productId, conn);
          throw new Error(`Insufficient stock for product: ${product?.name ?? item.productId}`);
        }
        await orderRepo.createItem(
          {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            deliveryFeePerTon: item.deliveryFeePerTon || 0,
            totalDelivery: item.totalDelivery || 0,
          },
          conn
        );
        await productRepo.updateStock(item.productId, -item.quantity, conn);
      }

      // Regular customers: owe totalAmount (naoulon/ton already deducted from total)
      // Drivers: owe totalAmount minus uncollected delivery fee (fee is credit to driver)
      const isDriver = customer.type === 'driver';
      const debtDelta = data.totalAmount - (isDriver ? naulon : 0);
      await customerRepo.updateDebt(data.customerId, debtDelta, conn);

      return (await orderRepo.findById(order.id, conn))!;
    });
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    return withTransaction(async (conn) => {
      const order = await orderRepo.findById(id, conn);
      if (!order) throw new Error('Order not found');

      if (order.status === OrderStatus.CANCELLED) return order;

      if (status === OrderStatus.CANCELLED) {
        for (const item of order.items ?? []) {
          await productRepo.updateStock(item.productId, item.quantity, conn);
        }
        if (order.customerId) {
          const customer = await customerRepo.findById(order.customerId, conn);
          const isDriver = customer?.type === 'driver';
          await customerRepo.updateDebt(
            order.customerId,
            -(order.totalAmount - (isDriver ? order.naulonUncollected : 0)),
            conn
          );
        }
      }

      await orderRepo.updateStatus(id, status, conn);
      return (await orderRepo.findById(id, conn))!;
    });
  }
}
