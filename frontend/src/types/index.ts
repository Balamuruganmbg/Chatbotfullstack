// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface Chat {
  _id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export type MessageRole = 'user' | 'assistant';

/** Populated only for synthetic file-upload messages (frontend-only, never persisted). */
export interface FileAttachment {
  name: string;
  size: number;
  mimeType: string;
  documentId: string;
}

export interface Message {
  _id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  isStreaming?: boolean;
  /** Present only when the message represents a file upload event. */
  fileAttachment?: FileAttachment;
}

export interface ChatWithMessages {
  chat: Chat;
  messages: Message[];
}

// ─── Documents ────────────────────────────────────────────────────────────────

export type ExtractionStatus = 'pending' | 'completed' | 'failed';

export interface Document {
  _id: string;
  userId: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  charCount: number;
  extractionStatus: ExtractionStatus;
  extractionError?: string;
  uploadedAt: string;
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export type FeedbackRating = 'like' | 'dislike';

export interface Feedback {
  _id: string;
  messageId: string;
  userId: string;
  rating: FeedbackRating;
  comment?: string;
  createdAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  errors?: ValidationError[];
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

export type StreamEvent =
  | {
      type: 'chat_created';
      chatId: string;
      chatTitle: string;
      userMessageId: string;
      hasDocumentContext: boolean;
      documentNames: string[];
    }
  | { type: 'token'; content: string }
  | { type: 'done'; messageId: string; hasDocumentContext: boolean }
  | { type: 'error'; error: string };
