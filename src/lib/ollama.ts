/**
 * Local Ollama Client for NyaySetu
 * Handles embeddings (nomic-embed-text) and LLM completions (llama3.2)
 * strictly via local HTTP on-device daemon.
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_LLM_MODEL = process.env.OLLAMA_LLM_MODEL || 'llama3.2';
const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
const DEFAULT_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS || '300000', 10);

export interface OllamaHealthStatus {
  online: boolean;
  models: string[];
  hasLlmModel: boolean;
  hasEmbedModel: boolean;
  error?: string;
}

/**
 * Fetch with custom AbortSignal timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Ollama request timed out after ${timeoutMs / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Check connectivity to local Ollama service and verify required models
 */
export async function checkOllamaHealth(): Promise<OllamaHealthStatus> {
  try {
    const res = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/tags`, { method: 'GET' }, 5000);
    if (!res.ok) {
      return {
        online: false,
        models: [],
        hasLlmModel: false,
        hasEmbedModel: false,
        error: `Ollama returned status ${res.status}`,
      };
    }

    const data = await res.json();
    const modelNames: string[] = (data.models || []).map((m: any) => m.name || m.model);

    const hasLlmModel = modelNames.some((m) => m.includes(OLLAMA_LLM_MODEL));
    const hasEmbedModel = modelNames.some((m) => m.includes(OLLAMA_EMBED_MODEL));

    return {
      online: true,
      models: modelNames,
      hasLlmModel,
      hasEmbedModel,
    };
  } catch (err: any) {
    return {
      online: false,
      models: [],
      hasLlmModel: false,
      hasEmbedModel: false,
      error: err.message || 'Could not connect to Ollama at ' + OLLAMA_BASE_URL,
    };
  }
}

/**
 * Generate vector embedding using nomic-embed-text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Truncate text if excessively long to fit embedding context window
    const cleanText = text.replace(/\s+/g, ' ').trim().slice(0, 4000);
    
    const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_EMBED_MODEL,
        prompt: cleanText,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama Embeddings API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Ollama Embeddings API returned invalid embedding vector format');
    }

    return data.embedding;
  } catch (error: any) {
    console.error('[Ollama Embeddings Error]:', error);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

/**
 * Generate LLM response using llama3.2
 */
export async function generateCompletion(
  prompt: string,
  systemPrompt?: string,
  temperature = 0.1,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<string> {
  try {
    const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_LLM_MODEL,
        prompt,
        system: systemPrompt,
        stream: false,
        options: {
          temperature,
          top_p: 0.9,
        },
      }),
    }, timeoutMs);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama LLM API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.response ? data.response.trim() : '';
  } catch (error: any) {
    console.error('[Ollama Completion Error]:', error);
    throw new Error(`LLM completion failed: ${error.message}`);
  }
}
