import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateSignup, validateLogin } from '../middlewares/validation.middleware';

const router = Router();

// POST /auth/signup
router.post('/signup', validateSignup, (req, res, next) =>
  authController.signup(req, res, next)
);

// POST /auth/login
router.post('/login', validateLogin, (req, res, next) =>
  authController.login(req, res, next)
);

// POST /auth/logout (protected)
router.post('/logout', authenticate, (req, res) =>
  authController.logout(req, res)
);

// GET /auth/profile (protected)
router.get('/profile', authenticate, (req, res, next) =>
  authController.getProfile(req as any, res, next)
);

export default router;
