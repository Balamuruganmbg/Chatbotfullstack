import mongoose, { Document, Schema, Types } from 'mongoose';

export type MessageRole = 'user' | 'assistant';

export interface IMessageDocument extends Document {
  chatId: Types.ObjectId;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
  }
);

MessageSchema.index({ chatId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessageDocument>('Message', MessageSchema);
