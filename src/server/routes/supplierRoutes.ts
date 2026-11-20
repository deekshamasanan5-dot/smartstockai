import { Router, Request, Response } from 'express';
import { inventoryService } from '../supabaseServer.ts';

const router = Router();

// GET /api/suppliers - Get all suppliers
router.get('/', async (_req: Request, res: Response) => {
  try {
    const suppliers = await inventoryService.getSuppliers();
    res.json({ success: true, data: suppliers, meta: { count: suppliers.length } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/suppliers - Create supplier
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, code } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Supplier name is required.' });
    }
    const supplier = await inventoryService.createSupplier(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
