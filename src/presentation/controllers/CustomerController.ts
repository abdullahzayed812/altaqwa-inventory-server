import { Request, Response } from 'express';
import { CustomerUseCases } from '../../application/use-cases/CustomerUseCases';
import { PaymentUseCases } from '../../application/use-cases/PaymentUseCases';
import { OrderUseCases } from '../../application/use-cases/OrderUseCases';

const uc = new CustomerUseCases();
const paymentUc = new PaymentUseCases();
const orderUc = new OrderUseCases();

export class CustomerController {
  async getAll(req: Request, res: Response) {
    try {
      res.json(await uc.getAllCustomers());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const customer = await uc.getCustomerById(Number(req.params.id));
      if (!customer) return res.status(404).json({ error: 'Customer not found' });
      res.json(customer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      res.status(201).json(await uc.addCustomer(req.body));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      res.json(await uc.updateCustomer(Number(req.params.id), req.body));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await uc.deleteCustomer(Number(req.params.id));
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async getPayments(req: Request, res: Response) {
    try {
      const customerId = Number(req.params.id);
      const { startDate, endDate, keyword } = req.query as { startDate?: string; endDate?: string; keyword?: string };
      res.json(await paymentUc.getCustomerPayments(customerId, { startDate, endDate, keyword }));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getOrders(req: Request, res: Response) {
    try {
      const customerId = Number(req.params.id);
      const { startDate, endDate, keyword } = req.query as { startDate?: string; endDate?: string; keyword?: string };
      res.json(await orderUc.getCustomerOrders(customerId, { startDate, endDate, keyword }));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
