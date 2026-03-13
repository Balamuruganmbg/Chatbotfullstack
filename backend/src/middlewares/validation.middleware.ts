import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.type === 'field' ? e.path : 'unknown',
        message: e.msg,
      })),
    });
    return;
  }
  next();
};

export const validateSignup = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors,
];

export const validateLogin = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

export const validateSendMessage = [
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 10000 })
    .withMessage('Message cannot exceed 10,000 characters'),
  body('chatId')
    .optional()
    .isMongoId()
    .withMessage('Invalid chat ID format'),
  handleValidationErrors,
];

export const validateFeedback = [
  body('messageId').isMongoId().withMessage('Invalid message ID'),
  body('rating')
    .isIn(['like', 'dislike'])
    .withMessage('Rating must be either "like" or "dislike"'),
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  handleValidationErrors,
];

export const validateMongoId = (paramName: string) => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName} format`),
  handleValidationErrors,
];
