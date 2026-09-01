import { GeminiModelInfo, ChatMessage } from '@/types/chat';

export async function fetchModels(): Promise<GeminiModelInfo[]> {
  try {
    const res = await fetch('/api/models');
    if (!res.ok) throw new Error('Failed to fetch models');
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.warn('[API Service] Failed to load models from server, using fallback:', error);
    return [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast, high-efficiency model', recommended: true },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Ultra-low latency general purpose' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Complex reasoning and code generation' }
    ];
  }
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
  model = 'gemini-2.5-flash',
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
        if (errorJson.error) errorMessage = errorJson.error;
      } catch {
        // use fallback statusText
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
          if (parsed.text) {
            onChunk(parsed.text);
          }
        } catch {
          // Ignore incomplete JSON chunks
        }
      }
    }

    onDone();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('[API Service] Stream aborted by user');
      onDone();
    } else {
      console.error('[API Service] Chat request error:', err);
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}