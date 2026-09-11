import { ModelInfo, ChatMessage } from '@/types/chat';

export interface ModelsResponse {
  models: ModelInfo[];
  defaultModel: string;
}

export function extractErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (!err) return 'Unknown error';
  if (err instanceof Error && typeof err.message === 'string') return err.message;
  if (typeof err === 'object') {
    const record = err as Record<string, any>;
    if (typeof record.error === 'string') return record.error;
    if (typeof record.error?.message === 'string') return record.error.message;
    if (typeof record.message === 'string') return record.message;
    try {
      return JSON.stringify(err);
    } catch {
      return 'Unexpected error';
    }
  }
  return String(err);
}

export async function fetchModelsData(): Promise<ModelsResponse> {
  try {
    const res = await fetch('/api/models');
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch models`);
    const json = await res.json();
    return {
      models: json.data || [],
      defaultModel: json.defaultModel || 'gemini-3.6-flash'
    };
  } catch (error) {
    const safeMsg = extractErrorMessage(error);
    console.warn('[API Service] Failed to load models from server, using fallback:', safeMsg);
    return {
      models: [
        {
          id: 'gemini-3.6-flash',
          name: 'Gemini 3.6 Flash',
          description: 'Google next-gen flagship model for speed, code generation, and complex DevOps reasoning.',
          recommended: true
        },
        {
          id: 'gemini-2.5-pro',
          name: 'Gemini 2.5 Pro',
          description: 'State-of-the-art reasoning model for intricate architectural design and deep troubleshooting.'
        },
        {
          id: 'gemini-2.0-flash',
          name: 'Gemini 2.0 Flash',
          description: 'High-speed multimodal intelligence with sub-second response times.'
        },
        {
          id: 'gemini-1.5-flash',
          name: 'Gemini 1.5 Flash',
          description: 'Lightweight, ultra-fast model ideal for high-throughput daily DevOps workflows.'
        },
        {
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          description: 'Massive 2M token context window capable of ingesting entire codebases and log repositories.'
        }
      ],
      defaultModel: 'gemini-3.6-flash'
    };
  }
}

export async function fetchModels(): Promise<ModelInfo[]> {
  const data = await fetchModelsData();
  return data.models;
}

export interface StreamChatOptions {
  prompt: string;
  history?: { role: string; content: string }[];
  model?: string;
  imageBase64?: string;
  imageMimeType?: string;
  signal?: AbortSignal;
  onChunk: (text: string) => void;
  onError: (error: Error) => void;
  onDone: () => void;
}

export async function streamChat({
  prompt,
  history = [],
  model = 'gemini-3.6-flash',
  imageBase64,
  imageMimeType,
  signal,
  onChunk,
  onError,
  onDone
}: StreamChatOptions): Promise<void> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        history,
        model,
        imageBase64,
        imageMimeType
      }),
      signal
    });

    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      try {
        const errorJson = await response.json();
        errorMessage = extractErrorMessage(errorJson);
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported on this browser/response.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(payload);
          if (parsed && typeof parsed.text === 'string') {
            onChunk(parsed.text);
          }
        } catch {
          // Ignore incomplete JSON chunks
        }
      }
    }

    onDone();
  } catch (err: any) {
    if (err && err.name === 'AbortError') {
      console.log('[API Service] Stream aborted by user');
      onDone();
    } else {
      const safeMsg = extractErrorMessage(err);
      console.error('[API Service] Chat request error:', safeMsg);
      onError(err instanceof Error ? err : new Error(safeMsg));
    }
  }
}