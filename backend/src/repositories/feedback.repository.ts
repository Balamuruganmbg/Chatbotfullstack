import { Feedback, IFeedbackDocument } from '../models/Feedback';
import { FeedbackRating } from '../types';

export class FeedbackRepository {
  async findByMessageAndUser(
    messageId: string,
    userId: string
  ): Promise<IFeedbackDocument | null> {
    return Feedback.findOne({ messageId, userId }).exec();
  }

  async upsert(
    messageId: string,
    userId: string,
    rating: FeedbackRating,
    comment?: string
  ): Promise<IFeedbackDocument> {
    return Feedback.findOneAndUpdate(
      { messageId, userId },
      { rating, comment },
      { new: true, upsert: true, runValidators: true }
    ).exec() as Promise<IFeedbackDocument>;
  }

  async findByMessageId(messageId: string): Promise<IFeedbackDocument[]> {
    return Feedback.find({ messageId }).exec();
  }
}

export const feedbackRepository = new FeedbackRepository();
