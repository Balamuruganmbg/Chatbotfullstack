import mongoose, { Document, Schema, Types } from 'mongoose';
import { FeedbackRating } from '../types';

export interface IFeedbackDocument extends Document {
  messageId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: FeedbackRating;
  comment?: string;
  createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedbackDocument>(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: String,
      enum: ['like', 'dislike'],
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// One feedback per user per message
FeedbackSchema.index({ messageId: 1, userId: 1 }, { unique: true });

export const Feedback = mongoose.model<IFeedbackDocument>('Feedback', FeedbackSchema);
