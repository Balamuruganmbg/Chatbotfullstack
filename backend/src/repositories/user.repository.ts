import { User, IUserDocument } from '../models/User';
import { CreateUserDto } from '../types';

export class UserRepository {
  async findById(id: string): Promise<IUserDocument | null> {
    return User.findById(id).exec();
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    // Explicitly select password since it's excluded by default
    return User.findOne({ email }).select('+password').exec();
  }

  async findByEmailWithoutPassword(email: string): Promise<IUserDocument | null> {
    return User.findOne({ email }).exec();
  }

  async create(dto: CreateUserDto): Promise<IUserDocument> {
    const user = new User({
      email: dto.email.toLowerCase().trim(),
      password: dto.password,
    });
    return user.save();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }
}

export const userRepository = new UserRepository();
