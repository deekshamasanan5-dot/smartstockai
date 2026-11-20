import { Router, Request, Response } from 'express';
import { checkSupabaseHealth } from '../supabaseServer.ts';

const router = Router();

// GET /api/health - Supabase connectivity status & server diagnostics
router.get('/', async (_req: Request, res: Response) => {
  try {
    const health = await checkSupabaseHealth();
    res.json({
      success: true,
      data: {
        server: 'online',
        uptime: process.uptime(),
        supabase: health,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
