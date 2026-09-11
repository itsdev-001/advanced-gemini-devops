import { NextResponse } from 'next/server';
import { ModelInfo } from '@/types/chat';

export const dynamic = 'force-dynamic';

const GEMINI_MODELS: ModelInfo[] = [
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    description: 'Google next-gen flagship model for speed, code generation, and complex DevOps reasoning.',
    recommended: true,
    contextWindow: '1M tokens'
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'State-of-the-art reasoning model for intricate architectural design and deep troubleshooting.',
    contextWindow: '2M tokens'
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'High-speed multimodal intelligence with sub-second response times.',
    contextWindow: '1M tokens'
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Lightweight, ultra-fast model ideal for high-throughput daily DevOps workflows.',
    contextWindow: '1M tokens'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Massive 2M token context window capable of ingesting entire codebases and log repositories.',
    contextWindow: '2M tokens'
  }
];

export async function GET() {
  const defaultModel = process.env.DEFAULT_MODEL || 'gemini-3.6-flash';

  return NextResponse.json({
    status: 'success',
    provider: 'Google Gemini',
    defaultModel,
    data: GEMINI_MODELS
  });
}