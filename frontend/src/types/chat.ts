export type MessageRole = 'user' | 'model';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  model?: string;
  isStreaming?: boolean;
  isError?: boolean;
  imagePreview?: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  model: string;
  messages: ChatMessage[];
}

export interface GeminiModelInfo {
  id: string;
  name: string;
  description: string;
  recommended?: boolean;
  contextWindow?: string;
}

export interface StreamChunkPayload {
  text: string;
}