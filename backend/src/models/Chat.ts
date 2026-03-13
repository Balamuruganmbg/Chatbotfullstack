import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChatDocument extends Document {
  userId: Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChatDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'New Conversation',
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

ChatSchema.index({ userId: 1, createdAt: -1 });

export const Chat = mongoose.model<IChatDocument>('Chat', ChatSchema);
