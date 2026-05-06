import { Request, Response } from 'express';
import { PaymentUseCases } from '../../application/use-cases/PaymentUseCases';

const uc = new PaymentUseCases();

export class PaymentController {
  async getAll(req: Request, res: Response) {
    try {
      res.json(await uc.getAllPayments());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      res.status(201).json(await uc.addPayment(req.body));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
