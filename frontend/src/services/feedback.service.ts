import { apiClient } from './api';
import { Feedback, FeedbackRating } from '../types';

export const feedbackService = {
  async submitFeedback(
    messageId: string,
    rating: FeedbackRating,
    comment?: string
  ): Promise<Feedback> {
    return apiClient.post<Feedback>('/feedback', { messageId, rating, comment });
  },

  async getMessageFeedback(messageId: string): Promise<Feedback | null> {
    return apiClient.get<Feedback | null>(`/feedback/${messageId}`);
  },
};
