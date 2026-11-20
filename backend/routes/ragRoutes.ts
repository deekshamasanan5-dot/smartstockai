import { Router } from 'express';
import { ragController } from '../controllers/ragController.ts';

const router = Router();

router.post('/chat', ragController.chat);
router.get('/knowledge-base', ragController.getKnowledgeBase);

export default router;
