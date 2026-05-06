import { Request, Response } from 'express';
import { CustomerUseCases } from '../../application/use-cases/CustomerUseCases';

const uc = new CustomerUseCases();

export class CustomerController {
  async getAll(req: Request, res: Response) {
    try {
      const customers = await uc.getAllCustomers();
      res.json(customers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const customer = await uc.addCustomer(req.body);
      res.status(201).json(customer);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
