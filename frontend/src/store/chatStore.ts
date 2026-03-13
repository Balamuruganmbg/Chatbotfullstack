import { create } from 'zustand';
import { Chat, Message } from '../types';

interface ChatState {
  // Sidebar state
  chats: Chat[];
  activeChatId: string | null;
  sidebarOpen: boolean;

  // Messages for current chat
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;

  // Document context indicator for the active response
  activeDocumentContext: { active: boolean; docNames: string[] };

  // Loading states
  isLoadingHistory: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;

  // Actions
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  removeChat: (chatId: string) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  setActiveChatId: (chatId: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;

  setIsStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (token: string) => void;
  setActiveDocumentContext: (ctx: { active: boolean; docNames: string[] }) => void;

  setIsLoadingHistory: (loading: boolean) => void;
  setIsLoadingMessages: (loading: boolean) => void;
  setIsSendingMessage: (sending: boolean) => void;

  reset: () => void;
}

const initialState = {
  chats: [],
  activeChatId: null,
  sidebarOpen: true,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  activeDocumentContext: { active: false, docNames: [] as string[] },
  isLoadingHistory: false,
  isLoadingMessages: false,
  isSendingMessage: false,
};

export const useChatStore = create<ChatState>((set) => ({
  ...initialState,

  setChats: (chats) => set({ chats }),
  addChat: (chat) =>
    set((state) => ({
      chats: [chat, ...state.chats.filter((c) => c._id !== chat._id)],
    })),
  removeChat: (chatId) =>
    set((state) => ({
      chats: state.chats.filter((c) => c._id !== chatId),
      activeChatId: state.activeChatId === chatId ? null : state.activeChatId,
      messages: state.activeChatId === chatId ? [] : state.messages,
    })),
  updateChatTitle: (chatId, title) =>
    set((state) => ({
      chats: state.chats.map((c) => (c._id === chatId ? { ...c, title } : c)),
    })),
  setActiveChatId: (chatId) => set({ activeChatId: chatId }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content,
        };
      }
      return { messages };
    }),

  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (token) =>
    set((state) => ({ streamingContent: token })),
  setActiveDocumentContext: (ctx) => set({ activeDocumentContext: ctx }),

  setIsLoadingHistory: (loading) => set({ isLoadingHistory: loading }),
  setIsLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
  setIsSendingMessage: (sending) => set({ isSendingMessage: sending }),

  reset: () => set(initialState),
}));
