import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { CreateUserDto, LoginDto } from '../types';
import { logger } from '../utils/logger';

export class AuthService {
  async signup(dto: CreateUserDto): Promise<{ user: object; token: string }> {
    const email = dto.email.toLowerCase().trim();

    // Check for duplicate
    const exists = await userRepository.existsByEmail(email);
    if (exists) {
      throw new Error('Email already registered');
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await userRepository.create({ email, password: passwordHash });

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    logger.info(`New user registered: ${email}`);

    return {
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async login(dto: LoginDto): Promise<{ user: object; token: string }> {
    const email = dto.email.toLowerCase().trim();

    // Must use +password selector
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Use generic message to prevent user enumeration
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(dto.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    logger.info(`User logged in: ${email}`);

    return {
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async getProfile(userId: string): Promise<object> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user._id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
