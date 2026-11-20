import { Request, Response } from 'express';
import { inventoryService } from '../services/inventoryService.ts';

export const alertController = {
  async getAlerts(req: Request, res: Response) {
    try {
      const status = (req.query.status as string) || 'active';
      const alerts = await inventoryService.getAlerts(status);
      res.json({ success: true, data: alerts, meta: { count: alerts.length } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async resolveAlert(req: Request, res: Response) {
    try {
      const { status = 'resolved' } = req.body;
      const ok = await inventoryService.resolveAlert(req.params.id, status);
      if (!ok) {
        return res.status(404).json({ success: false, error: 'Alert not found' });
      }
      res.json({ success: true, message: `Alert marked as ${status}` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
