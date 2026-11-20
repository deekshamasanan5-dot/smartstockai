import { Request, Response } from 'express';
import { inventoryService } from '../services/inventoryService.ts';

export const supplierController = {
  async getSuppliers(_req: Request, res: Response) {
    try {
      const suppliers = await inventoryService.getSuppliers();
      res.json({ success: true, data: suppliers, meta: { count: suppliers.length } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async createSupplier(req: Request, res: Response) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, error: 'Supplier name is required.' });
      }
      const supplier = await inventoryService.createSupplier(req.body);
      res.status(201).json({ success: true, data: supplier });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
