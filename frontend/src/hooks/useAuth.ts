import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';
import { useToast } from './useToast';

export const useAuth = () => {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const signup = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await authService.signup(email, password);
      setAuth(result.user, result.token);
      showToast({ title: 'Welcome!', description: 'Account created successfully.', variant: 'success' });
      navigate('/chat');
      return true;
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Signup failed';
      showToast({ title: 'Error', description: message, variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      setAuth(result.user, result.token);
      showToast({ title: 'Welcome back!', description: 'Logged in successfully.', variant: 'success' });
      navigate('/chat');
      return true;
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Login failed';
      showToast({ title: 'Error', description: message, variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors — clear local state regardless
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return { user, isAuthenticated, isLoading, signup, login, logout };
};
