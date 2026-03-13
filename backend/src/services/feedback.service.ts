import { feedbackRepository } from '../repositories/feedback.repository';
import { messageRepository } from '../repositories/message.repository';
import { IFeedbackDocument } from '../models/Feedback';
import { CreateFeedbackDto } from '../types';
import { logger } from '../utils/logger';

export class FeedbackService {
  async submitFeedback(
    userId: string,
    dto: CreateFeedbackDto
  ): Promise<IFeedbackDocument> {
    // Verify message exists
    const message = await messageRepository.findById(dto.messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Only allow feedback on assistant messages
    if (message.role !== 'assistant') {
      throw new Error('Feedback can only be submitted on assistant messages');
    }

    const feedback = await feedbackRepository.upsert(
      dto.messageId,
      userId,
      dto.rating,
      dto.comment
    );

    logger.info(`Feedback submitted: ${dto.rating} on message ${dto.messageId}`);
    return feedback;
  }

  async getMessageFeedback(
    messageId: string,
    userId: string
  ): Promise<IFeedbackDocument | null> {
    return feedbackRepository.findByMessageAndUser(messageId, userId);
  }
}

export const feedbackService = new FeedbackService();
