import { Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export class ChatController {
  async getHistory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const chats = await chatService.getChatHistory(userId);
      sendSuccess(res, chats, 'Chat history retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getChatById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { chatId } = req.params;
      const result = await chatService.getChatById(chatId, userId);
      sendSuccess(res, result, 'Chat retrieved');
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { content, chatId } = req.body;
      const result = await chatService.sendMessage(userId, content, chatId);
      sendSuccess(res, result, 'Message sent');
    } catch (error) {
      next(error);
    }
  }

  async streamMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { content, chatId } = req.body;

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
      res.flushHeaders();

      // Handle client disconnect
      req.on('close', () => {
        res.end();
      });

      await chatService.streamMessage(res, userId, content, chatId);
    } catch (error) {
      next(error);
    }
  }

  async deleteChat(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { chatId } = req.params;
      await chatService.deleteChat(chatId, userId);
      sendSuccess(res, null, 'Chat deleted');
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
