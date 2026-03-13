import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.signup({ email, password });
      sendCreated(res, result, 'Account created successfully');
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    // With JWT, logout is handled client-side (token deletion)
    // For server-side invalidation, use a token blacklist/Redis
    sendSuccess(res, null, 'Logged out successfully');
  }

  async getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await authService.getProfile(userId);
      sendSuccess(res, profile, 'Profile retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
