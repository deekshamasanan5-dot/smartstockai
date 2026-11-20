import { Router } from 'express';
import { supplierController } from '../controllers/supplierController.ts';

const router = Router();

router.get('/', supplierController.getSuppliers);
router.post('/', supplierController.createSupplier);

export default router;
