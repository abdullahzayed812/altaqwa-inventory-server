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

  async getById(req: Request, res: Response) {
    try {
      const driver = await uc.getDriverById(Number(req.params.id));
      if (!driver) return res.status(404).json({ error: 'Driver not found' });
      res.json(driver);
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

  async addPayment(req: Request, res: Response) {
    try {
      const driverId = Number(req.params.id);
      await uc.addPayment({ ...req.body, driverId });
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async addDebt(req: Request, res: Response) {
    try {
      const driverId = Number(req.params.id);
      await uc.addDebt({ ...req.body, driverId });
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async getLedger(req: Request, res: Response) {
    try {
      const driverId = Number(req.params.id);
      res.json(await uc.getLedger(driverId));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
