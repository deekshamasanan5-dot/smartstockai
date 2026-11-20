import { Router, Request, Response } from 'express';
import { inventoryService } from '../services/inventoryService.ts';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;
    const movements = await inventoryService.getMovements(productId as string);
    res.json({ success: true, data: movements, meta: { count: movements.length } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
