import { useState, useCallback } from 'react';
import { ToastOptions } from '../types';

interface ToastState extends ToastOptions {
  id: string;
  open: boolean;
}

// Simple global toast state using module-level variable
let toastQueue: Array<{ options: ToastOptions; resolve: () => void }> = [];
let setGlobalToast: ((toast: ToastState | null) => void) | null = null;

export const useToastProvider = () => {
  const [toast, setToast] = useState<ToastState | null>(null);

  setGlobalToast = setToast;

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, dismissToast };
};

export const useToast = () => {
  const showToast = useCallback((options: ToastOptions) => {
    if (setGlobalToast) {
      setGlobalToast({
        id: Math.random().toString(36),
        open: true,
        ...options,
      });

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setGlobalToast?.(null);
      }, 4000);
    }
  }, []);

  return { showToast };
};
