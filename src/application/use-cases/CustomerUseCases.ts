import { CustomerRepository } from '../../infrastructure/repositories/CustomerRepository';
import { Customer, CustomerType } from '../../core/entities';
import { CreateCustomerDto, UpdateCustomerDto } from '../../core/dto';

const repo = new CustomerRepository();

export class CustomerUseCases {
  async getAllCustomers(): Promise<Customer[]> {
    return repo.findAll();
  }

  async getCustomersByType(type: CustomerType): Promise<Customer[]> {
    return repo.findAllByType(type);
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    return repo.findById(id);
  }

  async addCustomer(data: CreateCustomerDto): Promise<Customer> {
    return repo.create(data);
  }

  async updateCustomer(id: number, data: UpdateCustomerDto): Promise<Customer> {
    const customer = await repo.findById(id);
    if (!customer) throw new Error('Customer not found');
    return repo.update(id, data);
  }

  async deleteCustomer(id: number): Promise<void> {
    const customer = await repo.findById(id);
    if (!customer) throw new Error('Customer not found');
    await repo.delete(id);
  }

  async updateDebt(id: number, amount: number): Promise<void> {
    const customer = await repo.findById(id);
    if (!customer) throw new Error('Customer not found');
    await repo.updateDebt(id, amount);
  }
}
