import { PaymentRepository } from '../../infrastructure/repositories/PaymentRepository';
import { CustomerRepository } from '../../infrastructure/repositories/CustomerRepository';
import { Payment } from '../../core/entities';
import { AddPaymentDto } from '../../core/dto';

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
}
