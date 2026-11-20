import { Router, Request, Response } from 'express';
import { testSupabaseConnection } from '../config/supabase.ts';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const supabaseHealth = await testSupabaseConnection();
    res.json({
      success: true,
      data: {
        server: 'online',
        uptime: process.uptime(),
        supabase: supabaseHealth,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
