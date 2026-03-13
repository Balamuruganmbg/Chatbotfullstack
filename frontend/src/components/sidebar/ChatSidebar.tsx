import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  Trash2,
  LogOut,
  Bot,
  FileText,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { DocumentUploader } from '../documents/DocumentUploader';
import { truncateText, formatRelativeTime } from '../../lib/utils';

export function ChatSidebar() {
  const {
    chats,
    activeChatId,
    isLoadingHistory,
    loadChat,
    deleteChat,
    startNewChat,
  } = useChat();
  const { logout, user } = useAuth();
  const [docsOpen, setDocsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setDeletingId(chatId);
    await deleteChat(chatId);
    setDeletingId(null);
  };

  return (
    <div className="h-full flex flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground text-sm">ChatBot AI</span>
        </div>

        <button
          onClick={startNewChat}
          className="w-full flex items-center gap-2 py-2 px-3 rounded-lg bg-primary/15 border border-primary/20 text-primary hover:bg-primary/25 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New conversation
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        <p className="text-xs font-medium text-muted-foreground px-2 py-1.5 uppercase tracking-wider">
          Conversations
        </p>

        {isLoadingHistory ? (
          <div className="space-y-2 px-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-9 rounded-lg" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No conversations yet</p>
          </div>
        ) : (
          <AnimatePresence>
            {chats.map((chat) => (
              <motion.div
                key={chat._id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  onClick={() => loadChat(chat._id)}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                    activeChatId === chat._id
                      ? 'bg-accent text-foreground'
                      : 'text-sidebar-foreground hover:bg-accent/50'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {truncateText(chat.title, 28)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatRelativeTime(chat.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, chat._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 hover:text-destructive transition-all flex-shrink-0"
                    title="Delete conversation"
                  >
                    {deletingId === chat._id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Documents section */}
      <div className="px-2 pb-2 border-t border-sidebar-border">
        <button
          onClick={() => setDocsOpen(!docsOpen)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-accent/50 transition-colors mt-2 text-sm"
        >
          <FileText className="w-4 h-4 flex-shrink-0 opacity-60" />
          <span className="flex-1 text-left text-xs font-medium">Documents</span>
          {docsOpen ? (
            <ChevronDown className="w-3 h-3 opacity-50" />
          ) : (
            <ChevronRight className="w-3 h-3 opacity-50" />
          )}
        </button>

        <AnimatePresence>
          {docsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <DocumentUploader />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary uppercase">
              {user?.email?.[0] || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user?.email}</p>
            <p className="text-[10px] text-muted-foreground">Free plan</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-colors"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
