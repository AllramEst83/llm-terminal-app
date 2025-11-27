import type { Message, Source, MessageImage } from '../../domain/entities/message';
import type { ThinkingModelSettings } from '../../domain/entities/settings';
import { ModelService } from '../services/model.service';

export interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

const EDGE_BASE = '/functions/v1';
const CHAT_ENDPOINT = `${EDGE_BASE}/gemini-chat`;

interface SerializedMessage {
  role: Message['role'];
  text: string;
  images?: MessageImage[];
}

interface ChatStreamEvent {
  type: 'chunk' | 'complete' | 'error';
  text?: string;
  isError?: boolean;
  sources?: Source[];
  usage?: GeminiUsageMetadata;
  warningMessage?: string;
}

function serializeMessages(messages: Message[]): SerializedMessage[] {
  return messages
    .filter(msg => msg.role === 'user' || msg.role === 'model')
    .map(msg => ({
      role: msg.role,
      text: msg.text,
      images: msg.images ?? (msg.imageData && msg.imageMimeType
        ? [{
            base64Data: msg.imageData,
            mimeType: msg.imageMimeType,
            fileName: 'inline-image',
          }]
        : undefined),
    }));
}

function buildPayload(
  currentMessages: Message[],
  newMessage: string,
  modelName: string,
  thinkingSettings: ThinkingModelSettings,
  images?: MessageImage[],
  imageData?: string,
  imageMimeType?: string,
): Record<string, unknown> {
  const canonicalModel = ModelService.getCanonicalModelId(modelName);
  const payloadImages =
    images ??
    (imageData && imageMimeType
      ? [{ base64Data: imageData, mimeType: imageMimeType, fileName: 'inline-image' }]
      : undefined);

  return {
    history: serializeMessages(currentMessages),
    message: newMessage,
    model: canonicalModel,
    thinkingSettings,
    images: payloadImages,
  };
}

async function processStream(
  response: Response,
  onStream: (chunkText: string, isFirstChunk: boolean) => void,
  onComplete: (sources?: Source[], usageMetadata?: GeminiUsageMetadata, warningMessage?: string) => void
) {
  if (!response.body) {
    throw new Error('No response body received from chat endpoint.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let receivedFirstChunk = false;

  const flushBuffer = () => {
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      let event: ChatStreamEvent | null = null;
      try {
        event = JSON.parse(trimmed) as ChatStreamEvent;
      } catch (error) {
        console.warn('Failed to parse chat stream event:', error, trimmed);
      }

      if (!event) {
        continue;
      }

      if (event.type === 'chunk' && event.text) {
        onStream(event.text, !receivedFirstChunk);
        receivedFirstChunk = true;
      } else if (event.type === 'error' && event.text) {
        onStream(event.text, !receivedFirstChunk);
        receivedFirstChunk = true;
      } else if (event.type === 'complete') {
        onComplete(event.sources, event.usage, event.warningMessage);
      }
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    flushBuffer();
  }

  if (buffer.trim().length > 0) {
    flushBuffer();
  }
}

export async function sendMessageToGemini(
  currentMessages: Message[],
  newMessage: string,
  modelName: string,
  thinkingSettings: ThinkingModelSettings,
  onStream: (chunkText: string, isFirstChunk: boolean) => void,
  onComplete: (sources?: Source[], usageMetadata?: GeminiUsageMetadata, warningMessage?: string) => void,
  imageData?: string,
  imageMimeType?: string,
  images?: MessageImage[]
): Promise<void> {
  try {
    const payload = buildPayload(currentMessages, newMessage, modelName, thinkingSettings, images, imageData, imageMimeType);
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Chat endpoint returned ${response.status}`);
    }

    if (response.headers.get('content-type')?.includes('application/json')) {
      const result = (await response.json()) as ChatStreamEvent;
      if (result.type === 'error' || !result.type) {
        throw new Error(result.text ?? 'Chat request failed.');
      }
      if (result.text) {
        onStream(result.text, true);
      }
      onComplete(result.sources, result.usage, result.warningMessage);
      return;
    }

    await processStream(response, onStream, onComplete);
  } catch (error) {
    console.error('Error sending message:', error);
    const errorMessage =
      error instanceof Error
        ? `SYSTEM ERROR: ${error.message}`
        : 'SYSTEM ERROR: Failed to communicate with chat endpoint.';
    onStream(errorMessage, true);
    onComplete();
  }
}
