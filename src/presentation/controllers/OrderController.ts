import { Request, Response } from 'express';
import { OrderUseCases } from '../../application/use-cases/OrderUseCases';
import { OrderStatus } from '../../core/entities';

const uc = new OrderUseCases();

export class OrderController {
  async getAll(req: Request, res: Response) {
    try {
      res.json(await uc.getAllOrders());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      res.status(201).json(await uc.createOrder(req.body));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      if (!Object.values(OrderStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      res.json(await uc.updateStatus(id, status as OrderStatus));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
