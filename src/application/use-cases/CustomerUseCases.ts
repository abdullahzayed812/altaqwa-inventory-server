import { CustomerRepository } from '../../infrastructure/repositories/CustomerRepository';
import { Customer } from '../../core/entities';
import { CreateCustomerDto } from '../../core/dto';

const repo = new CustomerRepository();

export class CustomerUseCases {
  async getAllCustomers(): Promise<Customer[]> {
    return repo.findAll();
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    return repo.findById(id);
  }

  async addCustomer(data: CreateCustomerDto): Promise<Customer> {
    return repo.create(data);
  }

  async updateDebt(id: number, amount: number): Promise<void> {
    const customer = await repo.findById(id);
    if (!customer) throw new Error('Customer not found');
    await repo.updateDebt(id, amount);
  }
}
