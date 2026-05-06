import { Request, Response } from 'express';
import { InventoryUseCases } from '../../application/use-cases/InventoryUseCases';

const uc = new InventoryUseCases();

export class InventoryController {
  async getAll(req: Request, res: Response) {
    try {
      res.json(await uc.getAllProducts());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      res.status(201).json(await uc.addProduct(req.body));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async updateStock(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const { quantity } = req.body;
      res.json(await uc.updateStock(id, quantity));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
