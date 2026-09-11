import { ChatSession } from '../types/chat';

const SESSIONS_STORAGE_KEY = 'gemini_devops_sessions_v1';
const THEME_STORAGE_KEY = 'gemini_devops_theme_v1';
const MODEL_STORAGE_KEY = 'gemini_devops_model_v1';

export function loadStoredSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((s: ChatSession) => ({
      ...s,
      model: s.model === 'gemini-1.5-pro' || s.model === 'gemini-2.5-flash' || !s.model ? 'gemini-3.6-flash' : s.model
    }));
  } catch (error) {
    console.error('[Storage] Failed to load chat sessions:', error);
    return [];
  }
}

export function saveStoredSessions(sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('[Storage] Failed to save chat sessions:', error);
  }
}

export function loadStoredTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  try {
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    return theme === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function saveStoredTheme(theme: 'dark' | 'light'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('[Storage] Failed to save theme:', error);
  }
}

export function loadStoredModel(defaultModel: string = 'gemini-3.6-flash'): string {
  if (typeof window === 'undefined') return defaultModel;
  try {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY);
    // Automatically migrate legacy models (gemini-2.5-flash, gemini-1.5-pro) to gemini-3.6-flash
    if (!stored || stored === 'gemini-1.5-pro' || stored === 'gemini-2.5-flash' || stored.startsWith('openrouter/')) {
      localStorage.setItem(MODEL_STORAGE_KEY, defaultModel);
      return defaultModel;
    }
    return stored;
  } catch {
    return defaultModel;
  }
}

export function saveStoredModel(modelId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  } catch (error) {
    console.error('[Storage] Failed to save model choice:', error);
  }
}