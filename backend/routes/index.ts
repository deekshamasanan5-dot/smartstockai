import { Router } from 'express';
import healthRoutes from './healthRoutes.ts';
import inventoryRoutes from './inventoryRoutes.ts';
import supplierRoutes from './supplierRoutes.ts';
import alertRoutes from './alertRoutes.ts';
import movementRoutes from './movementRoutes.ts';
import dashboardRoutes from './dashboardRoutes.ts';
import customerRoutes from './customerRoutes.ts';
import ragRoutes from './ragRoutes.ts';

const router = Router();

router.use('/health', healthRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/alerts', alertRoutes);
router.use('/movements', movementRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/customer-inquiries', customerRoutes);
router.use('/rag', ragRoutes);

export default router;
