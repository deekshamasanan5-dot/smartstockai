import { Router } from 'express';
import { customerController } from '../controllers/customerController.ts';

const router = Router();

router.get('/', customerController.getInquiries);
router.get('/:id', customerController.getInquiryById);
router.post('/', customerController.createInquiry);
router.post('/:id/generate-ai-response', customerController.generateAIResponse);
router.post('/:id/respond', customerController.sendResponse);
router.put('/:id/status', customerController.updateStatus);

export default router;
