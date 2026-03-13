import { chatRepository } from '../repositories/chat.repository';
import { messageRepository } from '../repositories/message.repository';
import { documentRepository } from '../repositories/document.repository';
import { IChatDocument } from '../models/Chat';
import { IMessageDocument } from '../models/Message';
import { Response } from 'express';
import { logger } from '../utils/logger';
import {
  buildDocumentContext,
  generateDocumentAnswer,
} from '../utils/documentParser';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateChatTitle = (firstMessage: string): string => {
  const words = firstMessage.trim().split(/\s+/).slice(0, 6);
  return words.join(' ') + (firstMessage.split(/\s+/).length > 6 ? '...' : '');
};

interface DocumentContext {
  contextText: string;
  docNames: string[];
  hasDocuments: boolean;
}

/**
 * Load extracted text from all documents the user has uploaded.
 * Only includes documents with extractionStatus = 'completed'.
 */
const loadDocumentContext = async (userId: string): Promise<DocumentContext> => {
  const docs = await documentRepository.findContextByUserId(userId);
  if (docs.length === 0) {
    return { contextText: '', docNames: [], hasDocuments: false };
  }
  const contextText = buildDocumentContext(docs);
  const docNames = docs.map((d) => d.originalName);
  return { contextText, docNames, hasDocuments: true };
};

/**
 * Build the full response text for a user question.
 * - With documents  → keyword search over extracted content
 * - Without documents → generic fallback message
 */
const buildResponse = (question: string, ctx: DocumentContext): string => {
  if (!ctx.hasDocuments) {
    return (
      `I'm ready to help! You asked: *"${question.substring(0, 120)}${question.length > 120 ? '...' : ''}"*\n\n` +
      `This is a built-in response. To unlock **document-aware answers**:\n\n` +
      `1. Open the **Documents** panel in the sidebar.\n` +
      `2. Upload a **PDF**, **DOCX**, or **TXT** file.\n` +
      `3. Once the upload is complete, ask questions about its contents.\n\n` +
      `The chatbot will search your document and return relevant excerpts.`
    );
  }
  return generateDocumentAnswer(question, ctx.contextText, ctx.docNames);
};

/**
 * Stream a pre-built text string word-by-word over an SSE connection.
 */
const streamWords = async (res: Response, text: string): Promise<void> => {
  const words = text.split(' ');
  let accumulated = '';

  for (let i = 0; i < words.length; i++) {
    accumulated += (i === 0 ? '' : ' ') + words[i];
    res.write(`data: ${JSON.stringify({ type: 'token', content: accumulated })}\n\n`);
    // 15–40 ms per word — feels like fast streaming
    await new Promise((r) => setTimeout(r, 15 + Math.random() * 25));
  }
};

// ─── ChatService ──────────────────────────────────────────────────────────────

export class ChatService {
  async getChatHistory(userId: string): Promise<IChatDocument[]> {
    return chatRepository.findAllByUserId(userId);
  }

  async getChatById(
    chatId: string,
    userId: string
  ): Promise<{ chat: IChatDocument; messages: IMessageDocument[] }> {
    const chat = await chatRepository.findByIdAndUserId(chatId, userId);
    if (!chat) throw new Error('Chat not found');
    const messages = await messageRepository.findByChatId(chatId);
    return { chat, messages };
  }

  async sendMessage(
    userId: string,
    content: string,
    chatId?: string
  ): Promise<{
    chat: IChatDocument;
    userMessage: IMessageDocument;
    assistantMessage: IMessageDocument;
  }> {
    let chat: IChatDocument;

    if (chatId) {
      const existing = await chatRepository.findByIdAndUserId(chatId, userId);
      if (!existing) throw new Error('Chat not found');
      chat = existing;
    } else {
      chat = await chatRepository.create(userId, generateChatTitle(content));
    }

    const userMessage = await messageRepository.create(chat._id.toString(), 'user', content);

    // Load document context and generate response
    const ctx = await loadDocumentContext(userId);
    const aiContent = buildResponse(content, ctx);

    const assistantMessage = await messageRepository.create(
      chat._id.toString(),
      'assistant',
      aiContent
    );

    await chatRepository.updateTitle(chat._id.toString(), chat.title);
    logger.info(`Message sent in chat ${chat._id} by user ${userId} [docs: ${ctx.hasDocuments}]`);
    return { chat, userMessage, assistantMessage };
  }

  // ─── SSE streaming ──────────────────────────────────────────────────────────

  async streamMessage(
    res: Response,
    userId: string,
    content: string,
    chatId?: string
  ): Promise<void> {
    let chat: IChatDocument;

    if (chatId) {
      const existing = await chatRepository.findByIdAndUserId(chatId, userId);
      if (!existing) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Chat not found' })}\n\n`);
        res.end();
        return;
      }
      chat = existing;
    } else {
      chat = await chatRepository.create(userId, generateChatTitle(content));
    }

    // Load document context BEFORE streaming begins
    const ctx = await loadDocumentContext(userId);

    // Save user message
    const userMessage = await messageRepository.create(chat._id.toString(), 'user', content);

    // ── Event 1: chat metadata + document context indicator ───────────────────
    res.write(`data: ${JSON.stringify({
      type: 'chat_created',
      chatId: chat._id.toString(),
      chatTitle: chat.title,
      userMessageId: userMessage._id.toString(),
      hasDocumentContext: ctx.hasDocuments,
      documentNames: ctx.docNames,
    })}\n\n`);

    // ── Event 2: stream tokens word-by-word ───────────────────────────────────
    const fullResponse = buildResponse(content, ctx);
    await streamWords(res, fullResponse);

    // Save the complete assistant message
    const assistantMessage = await messageRepository.create(
      chat._id.toString(),
      'assistant',
      fullResponse
    );

    // ── Event 3: done ─────────────────────────────────────────────────────────
    res.write(`data: ${JSON.stringify({
      type: 'done',
      messageId: assistantMessage._id.toString(),
      hasDocumentContext: ctx.hasDocuments,
    })}\n\n`);

    res.end();
    logger.info(`Stream done for chat ${chat._id} [docs: ${ctx.hasDocuments}]`);
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    const chat = await chatRepository.findByIdAndUserId(chatId, userId);
    if (!chat) throw new Error('Chat not found');
    await messageRepository.deleteAllByChatId(chatId);
    await chatRepository.deleteById(chatId);
    logger.info(`Chat deleted: ${chatId}`);
  }
}

export const chatService = new ChatService();
