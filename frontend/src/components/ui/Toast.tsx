import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useToastProvider } from '../../hooks/useToast';
import { cn } from '../../lib/utils';

const icons = {
  default: Info,
  success: CheckCircle,
  destructive: XCircle,
};

const colors = {
  default: 'border-border/50 bg-card',
  success: 'border-green-500/30 bg-green-500/10',
  destructive: 'border-destructive/30 bg-destructive/10',
};

const iconColors = {
  default: 'text-muted-foreground',
  success: 'text-green-400',
  destructive: 'text-destructive',
};

export function Toast() {
  const { toast, dismissToast } = useToastProvider();
  const variant = toast?.variant || 'default';
  const Icon = icons[variant];

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.9 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div
            className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-sm',
              colors[variant]
            )}
          >
            <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', iconColors[variant])} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
              )}
            </div>
            <button
              onClick={dismissToast}
              className="p-0.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
