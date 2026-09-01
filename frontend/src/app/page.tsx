'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ChatArea from '@/components/ChatArea';
import InputBox from '@/components/InputBox';
import { useChat } from '@/hooks/useChat';
import { useTheme } from '@/hooks/useTheme';
import { fetchModels } from '@/services/api';
import { GeminiModelInfo } from '@/types/chat';

export default function HomePage() {
  const {
    sessions,
    activeSessionId,
    messages,
    selectedModel,
    isStreaming,
    errorState,
    setSelectedModel,
    newChat,
    selectSession,
    renameSession,
    deleteSession,
    togglePinSession,
    sendMessage,
    stopGeneration,
    regenerateResponse,
    editUserPrompt,
    retryFailedRequest
  } = useChat();

  const { theme, toggleTheme } = useTheme();

  const [models, setModels] = useState<GeminiModelInfo[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load supported models from server on mount
  useEffect(() => {
    async function loadModels() {
      const serverModels = await fetchModels();
      setModels(serverModels);
    }
    loadModels();
  }, []);

  return (
    <div className="flex h-screen w-screen bg-gray-50 dark:bg-[#131314] text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      {/* Collapsible Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={selectSession}
        onNewChat={newChat}
        onDeleteSession={deleteSession}
        onRenameSession={renameSession}
        onTogglePinSession={togglePinSession}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Content View */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#131314] transition-colors">
        <Header
          models={models}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={newChat}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <ChatArea
          messages={messages}
          isStreaming={isStreaming}
          errorState={errorState}
          onSelectPrompt={(prompt) => sendMessage({ prompt })}
          onRegenerate={regenerateResponse}
          onEditPrompt={editUserPrompt}
          onRetry={retryFailedRequest}
        />

        <InputBox
          onSendMessage={sendMessage}
          isStreaming={isStreaming}
          onStopStream={stopGeneration}
        />
      </main>
    </div>
  );
}