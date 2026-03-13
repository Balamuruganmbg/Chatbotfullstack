import { Router } from 'express';
import { feedbackController } from '../controllers/feedback.controller';
import { authenticate } from '../middlewares/auth.middleware';
import {
  validateFeedback,
  validateMongoId,
} from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

// POST /feedback
router.post('/', validateFeedback, (req, res, next) =>
  feedbackController.submitFeedback(req as any, res, next)
);

// GET /feedback/:messageId
router.get('/:messageId', validateMongoId('messageId'), (req, res, next) =>
  feedbackController.getMessageFeedback(req as any, res, next)
);

export default router;
