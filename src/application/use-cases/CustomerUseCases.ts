import { CustomerRepository } from '../../infrastructure/repositories/CustomerRepository';
import { Customer } from '../../core/entities';
import { CreateCustomerDto, UpdateCustomerDto } from '../../core/dto';

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

  async updateCustomer(id: number, data: UpdateCustomerDto): Promise<Customer> {
    const customer = await repo.findById(id);
    if (!customer) throw new Error('Customer not found');
    return repo.update(id, data);
  }

  async deleteCustomer(id: number): Promise<void> {
    const customer = await repo.findById(id);
    if (!customer) throw new Error('Customer not found');
    try {
      await repo.delete(id);
    } catch (err: any) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        throw new Error('لا يمكن حذف هذا العميل لأن له طلبات أو مدفوعات مرتبطة');
      }
      throw err;
    }
  }

  async updateDebt(id: number, amount: number): Promise<void> {
    const customer = await repo.findById(id);
    if (!customer) throw new Error('Customer not found');
    await repo.updateDebt(id, amount);
  }
}
