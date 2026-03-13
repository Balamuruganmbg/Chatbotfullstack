import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { env } from '../config/env';

interface AppError extends Error {
  statusCode?: number;
  code?: number | string;
}

export const errorMiddleware = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Resource already exists';
  }

  // MongoDB Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  // Domain-level errors mapped to HTTP status
  const domainToStatus: Record<string, number> = {
    'Email already registered': 409,
    'Invalid email or password': 401,
    'Chat not found': 404,
    'Document not found': 404,
    'Message not found': 404,
    'User not found': 404,
    'Unauthorized to delete this document': 403,
    'Feedback can only be submitted on assistant messages': 400,
  };

  if (domainToStatus[message]) {
    statusCode = domainToStatus[message];
  }

  logger.error(`[${req.method}] ${req.path} >> StatusCode: ${statusCode}, Message: ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.isDevelopment && { stack: err.stack }),
  });
};

export const notFoundMiddleware = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};
