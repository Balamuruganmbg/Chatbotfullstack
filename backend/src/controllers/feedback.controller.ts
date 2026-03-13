import { Response, NextFunction } from 'express';
import { feedbackService } from '../services/feedback.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export class FeedbackController {
  async submitFeedback(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { messageId, rating, comment } = req.body;
      const feedback = await feedbackService.submitFeedback(userId, {
        messageId,
        rating,
        comment,
      });
      sendSuccess(res, feedback, 'Feedback submitted');
    } catch (error) {
      next(error);
    }
  }

  async getMessageFeedback(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { messageId } = req.params;
      const feedback = await feedbackService.getMessageFeedback(messageId, userId);
      sendSuccess(res, feedback, 'Feedback retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const feedbackController = new FeedbackController();
