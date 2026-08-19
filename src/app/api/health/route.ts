import { NextResponse } from 'next/server';
import { checkOllamaHealth } from '@/lib/ollama';

export async function GET() {
  try {
    const health = await checkOllamaHealth();
    return NextResponse.json(health);
  } catch (error: any) {
    return NextResponse.json(
      {
        online: false,
        models: [],
        hasLlmModel: false,
        hasEmbedModel: false,
        error: error.message || 'Health check failed',
      },
      { status: 500 }
    );
  }
}
