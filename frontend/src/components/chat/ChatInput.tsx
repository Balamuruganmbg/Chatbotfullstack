import { useState, useRef, KeyboardEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square, Paperclip, Loader2, X } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { useQueryClient } from '@tanstack/react-query';
import { useChat } from '../../hooks/useChat';
import { useChatStore } from '../../store/chatStore';
import { documentService } from '../../services/document.service';
import { useToast } from '../../hooks/useToast';
import { formatFileSize, getFileIcon } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { v4 as uuidv4 } from 'uuid';

const ACCEPTED_MIME = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export function ChatInput() {
  const [input, setInput] = useState('');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { activeChatId, isStreaming, isSendingMessage, sendMessage } = useChat();
  const addMessage = useChatStore((s) => s.addMessage);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const isDisabled = isStreaming || isSendingMessage;
  const canSend = input.trim().length > 0 && !isDisabled;

  // ─── Text send ──────────────────────────────────────────────────────────────

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isDisabled) return;
    setInput('');
    await sendMessage(content, activeChatId || undefined);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── File upload ─────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate type
      if (!ACCEPTED_MIME.includes(file.type)) {
        showToast({
          title: 'Unsupported file type',
          description: 'Only PDF, TXT, and DOCX files are allowed.',
          variant: 'destructive',
        });
        return;
      }

      // Validate size
      if (file.size > MAX_FILE_BYTES) {
        showToast({
          title: 'File too large',
          description: 'Maximum file size is 10 MB.',
          variant: 'destructive',
        });
        return;
      }

      setUploadingFile(file);
      setIsUploading(true);

      try {
        const doc = await documentService.uploadDocument(file);

        // Inject a synthetic file-message bubble into the conversation
        addMessage({
          _id: `file-${uuidv4()}`,
          chatId: activeChatId || '',
          role: 'user',
          content: '',
          createdAt: new Date().toISOString(),
          fileAttachment: {
            name: doc.originalName,
            size: doc.fileSize,
            mimeType: doc.mimeType,
            documentId: doc._id,
          },
        });

        // Refresh the document list in the sidebar
        queryClient.invalidateQueries({ queryKey: ['documents'] });

        showToast({
          title: 'File uploaded',
          description: `${doc.originalName} is ready — ask questions about it.`,
          variant: 'success',
        });
      } catch (err: any) {
        showToast({
          title: 'Upload failed',
          description: err.response?.data?.message || err.message || 'Could not upload file.',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
        setUploadingFile(null);
        // Reset file input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [activeChatId, addMessage, queryClient, showToast]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const cancelUpload = () => {
    setUploadingFile(null);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="relative">
      {/* Uploading file preview pill */}
      <AnimatePresence>
        {uploadingFile && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg bg-card border border-border/60 text-xs"
          >
            <span className="text-base leading-none">{getFileIcon(uploadingFile.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-medium truncate">{uploadingFile.name}</p>
              <p className="text-muted-foreground">{formatFileSize(uploadingFile.size)}</p>
            </div>
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin flex-shrink-0" />
            ) : (
              <button
                onClick={cancelUpload}
                className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.docx,.doc"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <motion.div
        className={cn(
          'flex items-end gap-2 rounded-xl border bg-card px-3 py-2 transition-colors',
          isDisabled ? 'border-border/30' : 'border-border/70 focus-within:border-primary/50'
        )}
        animate={{ scale: isDisabled ? 0.995 : 1 }}
      >
        {/* Paperclip — now functional */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isDisabled}
          className={cn(
            'p-1.5 transition-colors mb-0.5 flex-shrink-0 rounded-md',
            isUploading
              ? 'text-primary cursor-not-allowed'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
          title="Attach a PDF, TXT or DOCX file"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </button>

        {/* Textarea */}
        <TextareaAutosize
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'Waiting for response...' : 'Message ChatBot AI...'}
          disabled={isDisabled}
          minRows={1}
          maxRows={8}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none py-1.5 leading-relaxed disabled:opacity-50"
        />

        {/* Send / Stop */}
        <div className="flex-shrink-0 mb-0.5">
          {isDisabled ? (
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
              title="Stop generation"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                canSend
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
        Press <kbd className="font-mono">Enter</kbd> to send ·{' '}
        <kbd className="font-mono">Shift+Enter</kbd> for new line ·{' '}
        <kbd className="font-mono">📎</kbd> to attach PDF / TXT / DOCX
      </p>
    </div>
  );
}
