import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';
import {
  validateSendMessage,
  validateMongoId,
} from '../middlewares/validation.middleware';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// GET /chat/history
router.get('/history', (req, res, next) =>
  chatController.getHistory(req as any, res, next)
);

// GET /chat/:chatId
router.get('/:chatId', validateMongoId('chatId'), (req, res, next) =>
  chatController.getChatById(req as any, res, next)
);

// POST /chat/message (non-streaming)
router.post('/message', validateSendMessage, (req, res, next) =>
  chatController.sendMessage(req as any, res, next)
);

// POST /chat/stream (SSE streaming)
router.post('/stream', validateSendMessage, (req, res, next) =>
  chatController.streamMessage(req as any, res, next)
);

// DELETE /chat/:chatId
router.delete('/:chatId', validateMongoId('chatId'), (req, res, next) =>
  chatController.deleteChat(req as any, res, next)
);

export default router;
