import { Router } from 'express';
import { alertController } from '../controllers/alertController.ts';

const router = Router();

router.get('/', alertController.getAlerts);
router.post('/:id/resolve', alertController.resolveAlert);

export default router;
