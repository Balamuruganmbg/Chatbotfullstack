import { apiClient } from './api';
import { Chat, ChatWithMessages, Message, StreamEvent } from '../types';

export const chatService = {
  async getHistory(): Promise<Chat[]> {
    return apiClient.get<Chat[]>('/chat/history');
  },

  async getChatById(chatId: string): Promise<ChatWithMessages> {
    return apiClient.get<ChatWithMessages>(`/chat/${chatId}`);
  },

  async sendMessage(content: string, chatId?: string): Promise<{
    chat: Chat;
    userMessage: Message;
    assistantMessage: Message;
  }> {
    return apiClient.post('/chat/message', { content, chatId });
  },

  async deleteChat(chatId: string): Promise<void> {
    return apiClient.delete(`/chat/${chatId}`);
  },

  // SSE streaming
  streamMessage(
    content: string,
    chatId: string | undefined,
    onEvent: (event: StreamEvent) => void,
    onError: (error: Error) => void,
    onDone: () => void
  ): () => void {
    const token = localStorage.getItem('auth_token');
    const url = `/api/chat/stream`;

    // Use fetch with ReadableStream for SSE POST requests
    const controller = new AbortController();

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, chatId }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) as StreamEvent;
                onEvent(data);
              } catch {
                // Skip malformed lines
              }
            }
          }
        }

        onDone();
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          onError(error);
        }
      });

    // Return cleanup function
    return () => controller.abort();
  },
};
