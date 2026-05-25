import { Request, Response } from 'express';
import { SupplierUseCases } from '../../application/use-cases/SupplierUseCases';

const uc = new SupplierUseCases();

export class SupplierController {
  async getAll(req: Request, res: Response) {
    try {
      res.json(await uc.getAllSuppliers());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const supplier = await uc.getSupplierById(Number(req.params.id));
      if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
      res.json(supplier);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      res.status(201).json(await uc.addSupplier(req.body));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      res.json(await uc.updateSupplier(Number(req.params.id), req.body));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await uc.deleteSupplier(Number(req.params.id));
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async createPurchase(req: Request, res: Response) {
    try {
      res.status(201).json(await uc.createPurchase(req.body));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async addPayment(req: Request, res: Response) {
    try {
      const supplierId = Number(req.params.id);
      res.status(201).json(await uc.addPayment({ ...req.body, supplierId }));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async getLedger(req: Request, res: Response) {
    try {
      const supplierId = Number(req.params.id);
      const { type, startDate, endDate } = req.query as { type?: string; startDate?: string; endDate?: string };
      res.json(await uc.getLedger(supplierId, { type, startDate, endDate }));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getAllPayments(req: Request, res: Response) {
    try {
      res.json(await uc.getAllPayments());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getPurchaseById(req: Request, res: Response) {
    try {
      const purchase = await uc.getPurchaseById(Number(req.params.id));
      if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
      res.json(purchase);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getAllPurchases(req: Request, res: Response) {
    try {
      res.json(await uc.getAllPurchases());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
