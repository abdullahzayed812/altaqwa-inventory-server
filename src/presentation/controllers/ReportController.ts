import { Request, Response } from 'express';
import { ReportUseCases } from '../../application/use-cases/ReportUseCases';

const uc = new ReportUseCases();

export class ReportController {
  async getReportData(req: Request, res: Response) {
    try {
      res.json(await uc.getReportData());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
