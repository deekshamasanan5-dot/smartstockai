import { Router, Request, Response } from 'express';
import { inventoryService } from '../supabaseServer.ts';

const router = Router();

// GET /api/movements - Get stock audit ledger
router.get('/', async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;
    const movements = await inventoryService.getMovements(productId as string);
    res.json({ success: true, data: movements, meta: { count: movements.length } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
