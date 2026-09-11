'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { 
  User, 
  Sparkles, 
  Copy, 
  Check, 
  RotateCw, 
  Edit3, 
  AlertCircle,
  Clock,
  X,
  Send
} from 'lucide-react';
import { ChatMessage } from '@/types/chat';
import { formatMessageTime } from '@/utils/formatters';
import CodeBlock from './CodeBlock';

function extractText(node: any): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node.props && node.props.children) return extractText(node.props.children);
  return '';
}

interface MessageItemProps {
  message: ChatMessage;
  onRegenerate?: (messageId: string) => void;
  onEditPrompt?: (messageId: string, newPrompt: string) => void;
  onRetry?: () => void;
  isStreaming?: boolean;
}

export default function MessageItem({
  message,
  onRegenerate,
  onEditPrompt,
  onRetry,
  isStreaming = false
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPromptValue, setEditPromptValue] = useState(message.content);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleSaveEdit = () => {
    if (!editPromptValue.trim()) return;
    onEditPrompt?.(message.id, editPromptValue.trim());
    setIsEditing(false);
  };

  return (
    <div
      className={`group relative flex gap-3 md:gap-4 px-3 md:px-5 py-4 rounded-2xl transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-gray-50/70 dark:bg-[#18191a]/50 border border-gray-200/50 dark:border-[#282a2c]'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
            <User className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold shadow-md shadow-purple-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0 space-y-2 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
        {/* Header: Name + Timestamp + Model */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">
              {isUser ? 'You' : 'Gemini'}
            </span>
            {message.model && !isUser && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200 dark:bg-[#282a2c] text-gray-600 dark:text-gray-400">
                {message.model}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock className="w-3 h-3" />
              {formatMessageTime(message.timestamp)}
            </span>
          </div>

          {/* Action Toolbar */}
          {!isEditing && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              <button
                onClick={handleCopyMessage}
                className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#282a2c] transition-colors"
                title="Copy message"
                aria-label="Copy message"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {isUser && !isStreaming && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#282a2c] transition-colors"
                  title="Edit prompt"
                  aria-label="Edit prompt"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}

              {!isUser && !isStreaming && (
                <button
                  onClick={() => onRegenerate?.(message.id)}
                  className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#282a2c] transition-colors"
                  title="Regenerate response"
                  aria-label="Regenerate response"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Attached image if any */}
        {message.imagePreview && (
          <div className="max-w-xs rounded-xl overflow-hidden border border-gray-200 dark:border-[#333538] shadow-sm">
            <img src={message.imagePreview} alt="User attachment" className="w-full object-cover" />
          </div>
        )}

        {/* Edit Prompt View */}
        {isEditing ? (
          <div className="space-y-2 pt-1">
            <textarea
              value={editPromptValue}
              onChange={(e) => setEditPromptValue(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 dark:border-[#333538] bg-white dark:bg-[#1e1f20] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 resize-y"
              rows={3}
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => {
                  setEditPromptValue(message.content);
                  setIsEditing(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#282a2c]"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save & Submit</span>
              </button>
            </div>
          </div>
        ) : message.isError ? (
          /* Error State with Retry Button */
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{message.content}</div>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
              >
                <RotateCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        ) : (
          /* Normal / Streaming Markdown Content */
          <div className="prose dark:prose-invert max-w-none text-sm break-words leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const textContent = extractText(children).replace(/\n$/, '');

                  if (!inline && (language || textContent.includes('\n'))) {
                    return <CodeBlock language={language} value={textContent}>{children}</CodeBlock>;
                  }
                  return (
                    <code className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-[#282a2c] text-purple-600 dark:text-purple-300 font-mono text-xs" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content || (message.isStreaming ? '▌' : '')}
            </ReactMarkdown>
            {message.isStreaming && message.content && (
              <span className="inline-block w-2 h-4 ml-0.5 bg-blue-500 animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}