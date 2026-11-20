import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController.ts';

const router = Router();

router.get('/stats', dashboardController.getStats);
router.get('/forecasts', dashboardController.getForecasts);

export default router;
