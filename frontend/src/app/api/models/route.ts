import { NextResponse } from 'next/server';
import { GeminiModelInfo } from '@/types/chat';

export const dynamic = 'force-dynamic';

export async function GET() {
  const models: GeminiModelInfo[] = [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      description: 'Next-generation multimodal model with ultra-fast inference and high accuracy.',
      recommended: true,
      contextWindow: '1M tokens'
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      description: 'Optimized for high throughput, speed, and real-time streaming workflows.',
      contextWindow: '1M tokens'
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: 'Advanced reasoning, deep technical analysis, and complex code generation.',
      contextWindow: '2M tokens'
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      description: 'Lightweight, cost-efficient model for general task completion.',
      contextWindow: '1M tokens'
    }
  ];

  return NextResponse.json({
    status: 'success',
    data: models
  });
}