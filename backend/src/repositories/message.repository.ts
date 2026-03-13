import { Message, IMessageDocument } from '../models/Message';
import { MessageRole } from '../models/Message';

export class MessageRepository {
  async findById(messageId: string): Promise<IMessageDocument | null> {
    return Message.findById(messageId).exec();
  }

  async findByChatId(chatId: string): Promise<IMessageDocument[]> {
    return Message.find({ chatId })
      .sort({ createdAt: 1 })
      .select('-__v')
      .exec();
  }

  async create(
    chatId: string,
    role: MessageRole,
    content: string
  ): Promise<IMessageDocument> {
    const message = new Message({ chatId, role, content });
    return message.save();
  }

  async deleteAllByChatId(chatId: string): Promise<number> {
    const result = await Message.deleteMany({ chatId });
    return result.deletedCount;
  }

  async countByChatId(chatId: string): Promise<number> {
    return Message.countDocuments({ chatId });
  }

  async findLastByChatId(chatId: string): Promise<IMessageDocument | null> {
    return Message.findOne({ chatId }).sort({ createdAt: -1 }).exec();
  }
}

export const messageRepository = new MessageRepository();
