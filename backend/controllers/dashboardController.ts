import { Request, Response } from 'express';
import { inventoryService } from '../services/inventoryService.ts';

export const dashboardController = {
  async getStats(_req: Request, res: Response) {
    try {
      const stats = await inventoryService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getForecasts(_req: Request, res: Response) {
    try {
      const forecasts = await inventoryService.getAIForecasts();
      res.json({ success: true, data: forecasts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
