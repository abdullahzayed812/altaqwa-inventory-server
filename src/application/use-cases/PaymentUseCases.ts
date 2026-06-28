import { withTransaction } from '../../infrastructure/database/connection';
import { PaymentRepository } from '../../infrastructure/repositories/PaymentRepository';
import { CustomerRepository } from '../../infrastructure/repositories/CustomerRepository';
import { Payment } from '../../core/entities';
import { AddPaymentDto, UpdatePaymentDto } from '../../core/dto';

const repo = new PaymentRepository();
const customerRepo = new CustomerRepository();

export class PaymentUseCases {
  async getAllPayments(): Promise<Payment[]> {
    return repo.findAll();
  }

  async getCustomerPayments(customerId: number, filters: { startDate?: string; endDate?: string; keyword?: string } = {}): Promise<Payment[]> {
    return repo.findByCustomerIdFiltered(customerId, filters);
  }

  async addPayment(data: AddPaymentDto): Promise<Payment> {
    const customer = await customerRepo.findById(data.customerId);
    if (!customer) throw new Error('Customer not found');

    const payment = await repo.create(data);
    await customerRepo.updateDebt(data.customerId, -data.amount);
    return payment;
  }

  async updatePayment(id: number, data: UpdatePaymentDto): Promise<Payment> {
    return withTransaction(async (conn) => {
      const payment = await repo.findById(id, conn);
      if (!payment) throw new Error('Payment not found');

      const oldAmount = payment.amount;
      const newAmount = data.amount;
      const delta = oldAmount - newAmount; // reverse old, apply new (reduces debt by new amount)

      await repo.update(id, data, conn);
      // debt was reduced by oldAmount before; now reduce by newAmount instead
      // net effect: increase debt by oldAmount, decrease by newAmount → delta
      await customerRepo.updateDebt(payment.customerId, delta, conn);

      return (await repo.findById(id, conn))!;
    });
  }
}
