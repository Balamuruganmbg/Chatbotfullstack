import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { feedbackService } from '../../services/feedback.service';
import { FeedbackRating } from '../../types';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../lib/utils';

interface FeedbackButtonsProps {
  messageId: string;
  isTemp?: boolean;
}

export function FeedbackButtons({ messageId, isTemp = false }: FeedbackButtonsProps) {
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleFeedback = async (newRating: FeedbackRating) => {
    if (isTemp || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await feedbackService.submitFeedback(messageId, newRating, comment || undefined);
      setRating(newRating);
      if (newRating === 'dislike' && !showComment) {
        setShowComment(true);
      } else {
        showToast({
          title: 'Thanks for the feedback!',
          variant: 'success',
        });
        setShowComment(false);
      }
    } catch (err: any) {
      showToast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to submit feedback',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!rating) return;
    setIsSubmitting(true);
    try {
      await feedbackService.submitFeedback(messageId, rating, comment || undefined);
      showToast({ title: 'Feedback submitted — thank you!', variant: 'success' });
      setShowComment(false);
    } catch {
      // Already rated — just close
      setShowComment(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isTemp) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleFeedback('like')}
          disabled={isSubmitting}
          className={cn(
            'p-1.5 rounded-md transition-colors flex items-center gap-1',
            rating === 'like'
              ? 'text-green-400 bg-green-400/10'
              : 'text-muted-foreground hover:text-green-400 hover:bg-green-400/10'
          )}
          title="Good response"
        >
          {isSubmitting && rating === null ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <ThumbsUp className="w-3 h-3" />
          )}
        </button>

        <button
          onClick={() => handleFeedback('dislike')}
          disabled={isSubmitting}
          className={cn(
            'p-1.5 rounded-md transition-colors flex items-center gap-1',
            rating === 'dislike'
              ? 'text-red-400 bg-red-400/10'
              : 'text-muted-foreground hover:text-red-400 hover:bg-red-400/10'
          )}
          title="Bad response"
        >
          <ThumbsDown className="w-3 h-3" />
        </button>
      </div>

      {/* Comment box — shown on dislike */}
      <AnimatePresence>
        {showComment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border/50 rounded-lg p-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                What was wrong with this response? (optional)
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us more..."
                rows={2}
                className="w-full bg-input border border-border/50 rounded-md text-xs text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary/50 transition-colors p-2"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowComment(false)}
                  className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleCommentSubmit}
                  disabled={isSubmitting}
                  className="text-xs bg-primary/20 text-primary hover:bg-primary/30 px-3 py-1 rounded transition-colors flex items-center gap-1"
                >
                  {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  Submit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
