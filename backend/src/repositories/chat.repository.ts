import { Chat, IChatDocument } from '../models/Chat';

export class ChatRepository {
  async findById(chatId: string): Promise<IChatDocument | null> {
    return Chat.findById(chatId).exec();
  }

  async findByIdAndUserId(
    chatId: string,
    userId: string
  ): Promise<IChatDocument | null> {
    return Chat.findOne({ _id: chatId, userId }).exec();
  }

  async findAllByUserId(userId: string): Promise<IChatDocument[]> {
    return Chat.find({ userId })
      .sort({ updatedAt: -1 })
      .select('-__v')
      .exec();
  }

  async create(userId: string, title: string): Promise<IChatDocument> {
    const chat = new Chat({ userId, title });
    return chat.save();
  }

  async updateTitle(chatId: string, title: string): Promise<IChatDocument | null> {
    return Chat.findByIdAndUpdate(
      chatId,
      { title },
      { new: true, runValidators: true }
    ).exec();
  }

  async deleteById(chatId: string): Promise<boolean> {
    const result = await Chat.deleteOne({ _id: chatId });
    return result.deletedCount > 0;
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    const result = await Chat.deleteMany({ userId });
    return result.deletedCount;
  }
}

export const chatRepository = new ChatRepository();
