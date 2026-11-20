import { Request, Response } from 'express';
import { inventoryService } from '../services/inventoryService.ts';

export const inventoryController = {
  async getProducts(req: Request, res: Response) {
    try {
      const { search, category, status } = req.query;
      const products = await inventoryService.getProducts({
        search: search as string,
        category: category as string,
        status: status as string,
      });
      res.json({ success: true, data: products, meta: { count: products.length } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getProductById(req: Request, res: Response) {
    try {
      const product = await inventoryService.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      res.json({ success: true, data: product });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async createProduct(req: Request, res: Response) {
    try {
      const { sku, name, category } = req.body;
      if (!sku || !name || !category) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: sku, name, and category are mandatory.',
        });
      }
      const product = await inventoryService.createProduct(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateProduct(req: Request, res: Response) {
    try {
      const updated = await inventoryService.updateProduct(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async deleteProduct(req: Request, res: Response) {
    try {
      const ok = await inventoryService.deleteProduct(req.params.id);
      if (!ok) {
        return res.status(404).json({ success: false, error: 'Product not found or already deleted' });
      }
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async adjustStock(req: Request, res: Response) {
    try {
      const { movement_type, quantity, reason, reference_number, performed_by } = req.body;
      if (!movement_type || quantity === undefined) {
        return res.status(400).json({
          success: false,
          error: 'movement_type and quantity are required.',
        });
      }

      const result = await inventoryService.adjustStock({
        productId: req.params.id,
        movementType: movement_type,
        quantity: Number(quantity),
        reason,
        referenceNumber: reference_number,
        performedBy: performed_by,
      });

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
