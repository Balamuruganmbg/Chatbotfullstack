import { useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { ChatContainer } from '../../components/chat/ChatContainer';
import { ChatSidebar } from '../../components/sidebar/ChatSidebar';
import { useChat } from '../../hooks/useChat';

export function ChatPage() {
  const { loadHistory } = useChat();

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <MainLayout
      sidebar={<ChatSidebar />}
      main={<ChatContainer />}
    />
  );
}
