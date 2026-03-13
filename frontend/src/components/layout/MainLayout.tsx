import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../hooks/useChat';

interface MainLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

export function MainLayout({ sidebar, main }: MainLayoutProps) {
  const { sidebarOpen } = useChat();

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex-shrink-0 w-[260px] h-full border-r border-sidebar-border bg-sidebar overflow-hidden"
          >
            {sidebar}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">{main}</main>
    </div>
  );
}
