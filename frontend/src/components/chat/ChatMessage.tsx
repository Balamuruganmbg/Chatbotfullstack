import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check, FileText } from 'lucide-react';
import { Message } from '../../types';
import { FeedbackButtons } from '../feedback/FeedbackButtons';
import { formatFileSize, getFileIcon } from '../../lib/utils';
import { cn } from '../../lib/utils';

// Heuristic: responses generated from documents contain this phrase
const isDocumentResponse = (content: string) =>
  content.includes('Based on your uploaded document') ||
  content.includes('I searched through your uploaded document');

interface ChatMessageProps {
  message: Message;
}

const TypingIndicator = () => (
  <div className="flex items-center gap-1 py-2 px-1">
    <span className="typing-dot" />
    <span className="typing-dot" />
    <span className="typing-dot" />
  </div>
);

// ─── File attachment bubble ──────────────────────────────────────────────────

const FileBubble = ({ message }: { message: Message }) => {
  const file = message.fileAttachment!;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex gap-3 justify-end"
    >
      {/* spacer to push bubble right */}
      <div className="flex flex-col items-end max-w-[75%]">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl rounded-tr-sm bg-primary/20 border border-primary/25 text-foreground min-w-0">
          {/* File type icon */}
          <span className="text-2xl leading-none flex-shrink-0">
            {getFileIcon(file.mimeType)}
          </span>

          {/* File info */}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
              {file.name}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {formatFileSize(file.size)} · Uploaded
            </p>
          </div>
        </div>

        {/* "Used as context" hint */}
        <div className="flex items-center gap-1 text-[10px] text-primary/60 mt-1">
          <FileText className="w-3 h-3" />
          <span>Available as document context</span>
        </div>
      </div>

      {/* User avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-primary/20 border border-primary/30">
        <User className="w-4 h-4 text-primary" />
      </div>
    </motion.div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  // Render the file bubble for upload events
  if (message.fileAttachment) {
    return <FileBubble message={message} />;
  }

  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming && !isUser;
  const fromDocument = !isUser && !isStreaming && isDocumentResponse(message.content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('flex gap-3 group', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
          isUser
            ? 'bg-primary/20 border border-primary/30'
            : 'bg-card border border-border/50'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary" />
        ) : (
          <Bot className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn('flex flex-col gap-1.5 max-w-[80%]', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed relative',
            isUser
              ? 'bg-primary/20 border border-primary/25 rounded-tr-sm text-foreground'
              : 'bg-card border border-border/40 rounded-tl-sm text-foreground'
          )}
        >
          {isStreaming && message.content === '' ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" />
              )}
            </div>
          )}
        </div>

        {/* Document source badge */}
        {fromDocument && (
          <div className="flex items-center gap-1 text-[10px] text-primary/70 mt-0.5">
            <FileText className="w-3 h-3" />
            <span>From your documents</span>
          </div>
        )}

        {/* Actions row — only for assistant messages that are done */}
        {!isUser && !isStreaming && message.content && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
            <FeedbackButtons
              messageId={message._id}
              isTemp={message._id.startsWith('temp-')}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
