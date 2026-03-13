import { Request } from 'express';
import { Types } from 'mongoose';

// ─── Auth Types ────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// ─── User Types ────────────────────────────────────────────────────────────────

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

// ─── Chat Types ────────────────────────────────────────────────────────────────

export interface IChat {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  _id: Types.ObjectId;
  chatId: Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface SendMessageDto {
  chatId?: string;
  content: string;
}

// ─── Document Types ────────────────────────────────────────────────────────────

export interface IDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

// ─── Feedback Types ────────────────────────────────────────────────────────────

export type FeedbackRating = 'like' | 'dislike';

export interface IFeedback {
  _id: Types.ObjectId;
  messageId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: FeedbackRating;
  comment?: string;
  createdAt: Date;
}

export interface CreateFeedbackDto {
  messageId: string;
  rating: FeedbackRating;
  comment?: string;
}

// ─── API Response Types ────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
