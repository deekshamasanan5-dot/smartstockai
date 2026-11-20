import { Router, Request, Response } from 'express';
import { inventoryService } from '../supabaseServer.ts';

const router = Router();

// GET /api/alerts - Get reorder and anomaly alerts
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || 'active';
    const alerts = await inventoryService.getAlerts(status);
    res.json({ success: true, data: alerts, meta: { count: alerts.length } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/alerts/:id/resolve - Resolve or dismiss alert
router.post('/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { status = 'resolved' } = req.body;
    const ok = await inventoryService.resolveAlert(req.params.id, status);
    if (!ok) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    res.json({ success: true, message: `Alert marked as ${status}` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
