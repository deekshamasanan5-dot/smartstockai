import { Router, Request, Response } from 'express';
import { inventoryService } from '../supabaseServer.ts';

const router = Router();

// GET /api/dashboard/stats - Inventory metrics & valuation
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await inventoryService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/dashboard/forecasts - AI restocking predictions
router.get('/forecasts', async (_req: Request, res: Response) => {
  try {
    const forecasts = await inventoryService.getAIForecasts();
    res.json({ success: true, data: forecasts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
