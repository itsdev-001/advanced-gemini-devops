import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        {
          error: 'GEMINI_API_KEY is not configured on the server. Please set your valid Google AI Studio key in .env.local to enable live responses.'
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { prompt, history = [], model: selectedModel = 'gemini-2.5-flash', imageBase64, imageMimeType } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: selectedModel });

    // Format chat history for Google Generative AI SDK
    const contents = [];
    
    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role && msg.content) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        }
      }
    }

    // Prepare current turn parts
    const currentParts: any[] = [];
    if (imageBase64 && imageMimeType) {
      currentParts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType
        }
      });
    }
    currentParts.push({ text: prompt.trim() });

    contents.push({
      role: 'user',
      parts: currentParts
    });

    const streamingResult = await model.generateContentStream({ contents });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamingResult.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (streamErr: any) {
          console.error('[API Stream Error]', streamErr);
          const errorMsg = `\n\n*API Error: ${streamErr.message || 'Stream interrupted'}*`;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: errorMsg })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });

  } catch (error: any) {
    console.error('[API Handler Error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat request' },
      { status: 500 }
    );
  }
}