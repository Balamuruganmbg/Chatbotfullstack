import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, PanelLeft, FileSearch } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChat } from '../../hooks/useChat';

const WelcomeScreen = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center h-full gap-8 px-4"
  >
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/15 border border-primary/20">
        <Bot className="w-10 h-10 text-primary" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">How can I help you today?</h2>
        <p className="text-muted-foreground mt-2 text-sm max-w-md">
          Ask me anything — I can help with writing, analysis, coding, math, and much more.
        </p>
      </div>
    </div>

    {/* Suggestion chips */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
      {[
        { icon: '✍️', text: 'Help me write a cover letter' },
        { icon: '🔍', text: 'Explain quantum computing simply' },
        { icon: '💻', text: 'Debug my JavaScript code' },
        { icon: '🧮', text: 'Solve this math problem' },
      ].map((item) => (
        <button
          key={item.text}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-accent/50 transition-all text-sm text-left group"
        >
          <span className="text-lg">{item.icon}</span>
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
            {item.text}
          </span>
        </button>
      ))}
    </div>
  </motion.div>
);

const MessagesSkeleton = () => (
  <div className="space-y-6 p-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'justify-end'}`}>
        {i % 2 === 0 && <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />}
        <div className="space-y-2 flex-1 max-w-[60%]">
          <div className="skeleton h-4 rounded w-full" />
          <div className="skeleton h-4 rounded w-4/5" />
          {i === 1 && <div className="skeleton h-4 rounded w-3/5" />}
        </div>
      </div>
    ))}
  </div>
);

// Pill shown above input while document context is active during streaming
const DocumentContextBanner = ({ docNames }: { docNames: string[] }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 6 }}
    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary mb-2"
  >
    <FileSearch className="w-3.5 h-3.5 flex-shrink-0" />
    <span>
      Analysing document{docNames.length > 1 ? 's' : ''}:{' '}
      <span className="font-medium">{docNames.join(', ')}</span>
    </span>
  </motion.div>
);

export function ChatContainer() {
  const {
    messages,
    isLoadingMessages,
    activeChatId,
    sidebarOpen,
    toggleSidebar,
    activeDocumentContext,
    isStreaming,
  } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 flex-shrink-0">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {activeChatId ? 'Chat' : 'New Chat'}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingMessages ? (
          <MessagesSkeleton />
        ) : messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-2">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <ChatMessage key={message._id} message={message} />
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence>
            {isStreaming && activeDocumentContext.active && (
              <DocumentContextBanner docNames={activeDocumentContext.docNames} />
            )}
          </AnimatePresence>
          <ChatInput />
        </div>
      </div>
    </div>
  );
}
