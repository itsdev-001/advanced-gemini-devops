'use client';

import React from 'react';
import { ArrowDown, AlertTriangle } from 'lucide-react';
import { ChatMessage } from '@/types/chat';
import MessageItem from './MessageItem';
import EmptyState from './EmptyState';
import { useAutoScroll } from '@/hooks/useAutoScroll';

interface ChatAreaProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  errorState: string | null;
  onSelectPrompt: (prompt: string) => void;
  onRegenerate: (messageId: string) => void;
  onEditPrompt: (messageId: string, newPrompt: string) => void;
  onRetry: () => void;
}

export default function ChatArea({
  messages,
  isStreaming,
  errorState,
  onSelectPrompt,
  onRegenerate,
  onEditPrompt,
  onRetry
}: ChatAreaProps) {
  const { containerRef, handleScroll, scrollToBottom, userHasScrolledUp } = useAutoScroll([
    messages,
    isStreaming
  ]);

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      {/* Scrollable Message Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 md:px-6 py-4 space-y-3"
      >
        {messages.length === 0 ? (
          <EmptyState onSelectPrompt={onSelectPrompt} />
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                onRegenerate={onRegenerate}
                onEditPrompt={onEditPrompt}
                onRetry={onRetry}
                isStreaming={isStreaming}
              />
            ))}
          </div>
        )}
      </div>

      {/* Global Error Notification if unhandled error occurred */}
      {errorState && (
        <div className="max-w-4xl mx-auto px-4 w-full">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorState}</span>
            </div>
            <button
              onClick={onRetry}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Floating Scroll to Bottom Button */}
      {userHasScrolledUp && messages.length > 0 && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-4 right-6 p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all animate-bounce focus:outline-none focus:ring-2 focus:ring-blue-400 z-10"
          title="Scroll to latest messages"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}