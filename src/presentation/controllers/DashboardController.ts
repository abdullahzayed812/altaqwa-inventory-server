import { Request, Response } from 'express';
import { DashboardUseCases } from '../../application/use-cases/DashboardUseCases';

const uc = new DashboardUseCases();

export class DashboardController {
  async getStats(req: Request, res: Response) {
    try {
      res.json(await uc.getStats());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
