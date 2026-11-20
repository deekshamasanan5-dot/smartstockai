import { Router } from 'express';
import { inventoryController } from '../controllers/inventoryController.ts';

const router = Router();

router.get('/', inventoryController.getProducts);
router.get('/:id', inventoryController.getProductById);
router.post('/', inventoryController.createProduct);
router.put('/:id', inventoryController.updateProduct);
router.delete('/:id', inventoryController.deleteProduct);
router.post('/:id/adjust', inventoryController.adjustStock);

export default router;
