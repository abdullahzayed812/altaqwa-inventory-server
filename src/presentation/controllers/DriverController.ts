import { Request, Response } from 'express';
import { DriverUseCases } from '../../application/use-cases/DriverUseCases';

const uc = new DriverUseCases();

export class DriverController {
  async getAll(req: Request, res: Response) {
    try {
      res.json(await uc.getAllDrivers());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      res.status(201).json(await uc.addDriver(req.body));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async updateAvailability(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const { isAvailable } = req.body;
      res.json(await uc.updateAvailability(id, Boolean(isAvailable)));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
