import { useCallback, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { chatService } from '../services/chat.service';
import { Message, StreamEvent } from '../types';
import { useToast } from './useToast';
import { v4 as uuidv4 } from 'uuid';

export const useChat = () => {
  const store = useChatStore();
  const { showToast } = useToast();
  const abortRef = useRef<(() => void) | null>(null);

  const loadHistory = useCallback(async () => {
    store.setIsLoadingHistory(true);
    try {
      const chats = await chatService.getHistory();
      store.setChats(chats);
    } catch (error) {
      showToast({ title: 'Error', description: 'Failed to load chat history', variant: 'destructive' });
    } finally {
      store.setIsLoadingHistory(false);
    }
  }, []);

  const loadChat = useCallback(async (chatId: string) => {
    store.setIsLoadingMessages(true);
    store.setActiveChatId(chatId);
    try {
      const result = await chatService.getChatById(chatId);
      store.setMessages(result.messages);
    } catch (error) {
      showToast({ title: 'Error', description: 'Failed to load conversation', variant: 'destructive' });
    } finally {
      store.setIsLoadingMessages(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string, chatId?: string) => {
      if (store.isStreaming || store.isSendingMessage) return;

      store.setIsSendingMessage(true);
      store.setIsStreaming(true);
      store.setStreamingContent('');

      // Optimistically add user message
      const tempUserMsg: Message = {
        _id: `temp-user-${uuidv4()}`,
        chatId: chatId || '',
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      store.addMessage(tempUserMsg);

      // Add placeholder for streaming assistant message
      const tempAssistantMsg: Message = {
        _id: `temp-assistant-${uuidv4()}`,
        chatId: chatId || '',
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        isStreaming: true,
      };
      store.addMessage(tempAssistantMsg);

      const cleanup = chatService.streamMessage(
        content,
        chatId,
        (event: StreamEvent) => {
          if (event.type === 'chat_created') {
            store.addChat({
              _id: event.chatId,
              userId: '',
              title: event.chatTitle,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            store.setActiveChatId(event.chatId);
            // Track whether this response uses document context
            store.setActiveDocumentContext({
              active: event.hasDocumentContext,
              docNames: event.documentNames,
            });
          } else if (event.type === 'token') {
            store.setStreamingContent(event.content);
            store.updateLastMessage(event.content);
          } else if (event.type === 'done') {
            store.setIsStreaming(false);
            store.setIsSendingMessage(false);
            store.setStreamingContent('');
            store.setActiveDocumentContext({ active: false, docNames: [] });
            // Mark the last message as no longer streaming
            const messages = useChatStore.getState().messages;
            const updated = messages.map((m, i) =>
              i === messages.length - 1 ? { ...m, _id: event.messageId, isStreaming: false } : m
            );
            store.setMessages(updated);
          }
        },
        (error) => {
          showToast({ title: 'Error', description: error.message, variant: 'destructive' });
          store.setIsStreaming(false);
          store.setIsSendingMessage(false);
        },
        () => {
          store.setIsStreaming(false);
          store.setIsSendingMessage(false);
        }
      );

      abortRef.current = cleanup;
    },
    [store]
  );

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      await chatService.deleteChat(chatId);
      store.removeChat(chatId);
      store.setMessages([]);
      showToast({ title: 'Deleted', description: 'Conversation removed', variant: 'default' });
    } catch (error) {
      showToast({ title: 'Error', description: 'Failed to delete conversation', variant: 'destructive' });
    }
  }, []);

  const startNewChat = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
    }
    store.setActiveChatId(null);
    store.setMessages([]);
    store.setIsStreaming(false);
    store.setIsSendingMessage(false);
    store.setStreamingContent('');
    store.setActiveDocumentContext({ active: false, docNames: [] });
  }, []);

  return {
    chats: store.chats,
    messages: store.messages,
    activeChatId: store.activeChatId,
    isStreaming: store.isStreaming,
    isSendingMessage: store.isSendingMessage,
    isLoadingHistory: store.isLoadingHistory,
    isLoadingMessages: store.isLoadingMessages,
    sidebarOpen: store.sidebarOpen,
    activeDocumentContext: store.activeDocumentContext,
    toggleSidebar: store.toggleSidebar,
    loadHistory,
    loadChat,
    sendMessage,
    deleteChat,
    startNewChat,
  };
};
