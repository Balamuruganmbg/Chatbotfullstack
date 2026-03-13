import { apiClient } from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  async signup(email: string, password: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/signup', { email, password });
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', { email, password });
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  async getProfile(): Promise<User> {
    return apiClient.get<User>('/auth/profile');
  },

  setAuthData(token: string, user: User): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  },

  getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  getStoredUser(): User | null {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  },

  clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },
};
