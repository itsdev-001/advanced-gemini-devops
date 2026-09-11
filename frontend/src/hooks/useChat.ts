'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatSession, ChatMessage } from '@/types/chat';
import { loadStoredSessions, saveStoredSessions, loadStoredModel, saveStoredModel } from '@/utils/storage';
import { truncateText } from '@/utils/formatters';
import { streamChat, extractErrorMessage } from '@/services/api';

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.6-flash');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize from storage on mount
  useEffect(() => {
    const stored = loadStoredSessions();
    const storedModel = loadStoredModel('gemini-3.6-flash');
    setSessions(stored);
    setSelectedModel(storedModel);
    if (stored.length > 0) {
      setActiveSessionId(stored[0].id);
    }
    setMounted(true);
  }, []);

  // Save sessions to localStorage on change
  useEffect(() => {
    if (mounted) {
      saveStoredSessions(sessions);
    }
  }, [sessions, mounted]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    saveStoredModel(modelId);
    if (activeSessionId) {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, model: modelId } : s))
      );
    }
  };

  const newChat = useCallback(() => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const newSession: ChatSession = {
      id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      model: selectedModel,
      messages: []
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setErrorState(null);
  }, [isStreaming, selectedModel]);

  const selectSession = useCallback((sessionId: string) => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setActiveSessionId(sessionId);
    setErrorState(null);
    const target = sessions.find((s) => s.id === sessionId);
    if (target?.model) {
      setSelectedModel(target.model);
    }
  }, [isStreaming, sessions]);

  const renameSession = useCallback((sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle.trim(), updatedAt: Date.now() } : s))
    );
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(filtered[0]?.id || null);
      }
      return filtered;
    });
  }, [activeSessionId]);

  const togglePinSession = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s))
    );
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  const sendMessage = async ({
    prompt,
    imageBase64,
    imageMimeType,
    imagePreview,
    overrideHistory
  }: {
    prompt: string;
    imageBase64?: string;
    imageMimeType?: string;
    imagePreview?: string;
    overrideHistory?: ChatMessage[];
  }) => {
    if (!prompt.trim() && !imageBase64) return;
    setErrorState(null);

    let currentId = activeSessionId;
    let targetSession = sessions.find((s) => s.id === currentId);

    // Create session if none exists
    if (!currentId || !targetSession) {
      const freshSession: ChatSession = {
        id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        title: truncateText(prompt, 36),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false,
        model: selectedModel,
        messages: []
      };
      setSessions((prev) => [freshSession, ...prev]);
      setActiveSessionId(freshSession.id);
      currentId = freshSession.id;
      targetSession = freshSession;
    }

    const userMessageId = 'msg_user_' + Date.now();
    const assistantMessageId = 'msg_model_' + (Date.now() + 1);

    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: prompt.trim(),
      timestamp: Date.now(),
      imagePreview,
      imageBase64,
      imageMimeType
    };

    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      model: selectedModel,
      isStreaming: true
    };

    const baseMessages = overrideHistory !== undefined ? overrideHistory : targetSession.messages;
    const isFirstUserMessage = baseMessages.length === 0;

    // Update session state with user message and streaming assistant placeholder
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentId) {
          return {
            ...s,
            title: isFirstUserMessage ? truncateText(prompt, 36) : s.title,
            updatedAt: Date.now(),
            messages: [...baseMessages, userMessage, assistantMessage]
          };
        }
        return s;
      })
    );

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    const historyForApi = baseMessages.map((m) => ({
      role: m.role,
      content: m.content
    }));

    await streamChat({
      prompt,
      history: historyForApi,
      model: selectedModel,
      imageBase64,
      imageMimeType,
      signal: abortControllerRef.current.signal,
      onChunk: (chunkText) => {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === currentId) {
              return {
                ...s,
                messages: s.messages.map((m) => {
                  if (m.id === assistantMessageId) {
                    return { ...m, content: m.content + chunkText };
                  }
                  return m;
                })
              };
            }
            return s;
          })
        );
      },
      onError: (err) => {
        const safeErrorMsg = extractErrorMessage(err);
        setErrorState(safeErrorMsg);
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === currentId) {
              return {
                ...s,
                messages: s.messages.map((m) => {
                  if (m.id === assistantMessageId) {
                    return {
                      ...m,
                      isStreaming: false,
                      isError: true,
                      content: m.content || `⚠️ Error: ${safeErrorMsg}`
                    };
                  }
                  return m;
                })
              };
            }
            return s;
          })
        );
        setIsStreaming(false);
      },
      onDone: () => {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === currentId) {
              return {
                ...s,
                messages: s.messages.map((m) => {
                  if (m.id === assistantMessageId) {
                    return { ...m, isStreaming: false };
                  }
                  return m;
                })
              };
            }
            return s;
          })
        );
        setIsStreaming(false);
      }
    });
  };

  // Regenerate assistant response
  const regenerateResponse = useCallback((messageId: string) => {
    if (isStreaming || !activeSession) return;
    const msgIndex = activeSession.messages.findIndex((m) => m.id === messageId);
    if (msgIndex <= 0) return;

    const previousUserMsg = activeSession.messages[msgIndex - 1];
    if (previousUserMsg.role !== 'user') return;

    // Prune history up to the user message
    const historyBeforeUser = activeSession.messages.slice(0, msgIndex - 1);
    
    sendMessage({
      prompt: previousUserMsg.content,
      imageBase64: previousUserMsg.imageBase64,
      imageMimeType: previousUserMsg.imageMimeType,
      imagePreview: previousUserMsg.imagePreview,
      overrideHistory: historyBeforeUser
    });
  }, [isStreaming, activeSession, sendMessage]);

  // Edit user prompt and re-run
  const editUserPrompt = useCallback((messageId: string, newPrompt: string) => {
    if (isStreaming || !activeSession || !newPrompt.trim()) return;
    const msgIndex = activeSession.messages.findIndex((m) => m.id === messageId);
    if (msgIndex < 0) return;

    const targetUserMsg = activeSession.messages[msgIndex];
    // Prune all messages after this user prompt
    const historyBeforePrompt = activeSession.messages.slice(0, msgIndex);

    sendMessage({
      prompt: newPrompt.trim(),
      imageBase64: targetUserMsg.imageBase64,
      imageMimeType: targetUserMsg.imageMimeType,
      imagePreview: targetUserMsg.imagePreview,
      overrideHistory: historyBeforePrompt
    });
  }, [isStreaming, activeSession, sendMessage]);

  // Retry failed request
  const retryFailedRequest = useCallback(() => {
    if (isStreaming || !activeSession || activeSession.messages.length === 0) return;
    const lastMsg = activeSession.messages[activeSession.messages.length - 1];

    if (lastMsg.role === 'model' && lastMsg.isError) {
      regenerateResponse(lastMsg.id);
    } else if (lastMsg.role === 'user') {
      const historyBefore = activeSession.messages.slice(0, -1);
      sendMessage({
        prompt: lastMsg.content,
        imageBase64: lastMsg.imageBase64,
        imageMimeType: lastMsg.imageMimeType,
        imagePreview: lastMsg.imagePreview,
        overrideHistory: historyBefore
      });
    }
  }, [isStreaming, activeSession, regenerateResponse, sendMessage]);

  return {
    sessions,
    activeSessionId,
    activeSession,
    messages,
    selectedModel,
    isStreaming,
    errorState,
    mounted,
    setSelectedModel: handleSelectModel,
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
  };
}