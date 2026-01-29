import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { Message, Source, MessageImage } from '../../domain/entities/message';
import type { ThinkingModelSettings } from '../../domain/entities/settings';
import { GEMINI_PRO_MODEL_ID } from '../../domain/entities/settings';
import { ModelService } from '../services/model.service';

export interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

function getAiInstance(apiKey: string) {
  if (!apiKey) {
    throw new Error("API_KEY not provided");
  }
  return new GoogleGenAI({ apiKey: apiKey });
}

function formatMessagesForGemini(messages: Message[]) {
  return messages
    .filter(msg => msg.role === 'user' || msg.role === 'model')
    .map(msg => {
      const parts: unknown[] = [];
      
      if (msg.images && msg.images.length > 0) {
        for (const image of msg.images) {
          parts.push({
            inlineData: {
              data: image.base64Data,
              mimeType: image.mimeType,
            },
          });
        }
      }
      else if (msg.imageData && msg.imageMimeType) {
        parts.push({
          inlineData: {
            data: msg.imageData,
            mimeType: msg.imageMimeType,
          },
        });
      }
      
      if (msg.text) {
        parts.push({ text: msg.text });
      }
      
      return {
        role: msg.role,
        parts: parts.length > 0 ? parts : [{ text: msg.text }],
      };
    });
}

function extractUsageMetadata(rawMetadata: unknown): GeminiUsageMetadata | undefined {
  if (!rawMetadata) {
    return undefined;
  }

  const { promptTokenCount, candidatesTokenCount, totalTokenCount } = rawMetadata as Record<string, unknown>;
  if (
    typeof promptTokenCount !== 'number' &&
    typeof candidatesTokenCount !== 'number' &&
    typeof totalTokenCount !== 'number'
  ) {
    return undefined;
  }

  return {
    promptTokenCount: promptTokenCount as number | undefined,
    candidatesTokenCount: candidatesTokenCount as number | undefined,
    totalTokenCount: totalTokenCount as number | undefined,
  };
}

const DEFAULT_THINKING_BUDGET = 8192;
const DEFAULT_THINKING_LEVEL = 'high';
const BUDGET_MODELS = new Set(['gemini-3-flash-preview']);

function buildThinkingConfig(
  modelName: string,
  thinkingSettings: ThinkingModelSettings
) {
  if (!thinkingSettings?.enabled) {
    return undefined;
  }

  const canonicalModelId = ModelService.getCanonicalModelId(modelName);

  if (canonicalModelId === GEMINI_PRO_MODEL_ID) {
    return {
      thinkingConfig: {
        thinkingLevel: thinkingSettings.level ?? DEFAULT_THINKING_LEVEL,
      },
    };
  }

  if (BUDGET_MODELS.has(canonicalModelId)) {
    return {
      thinkingConfig: {
        thinkingBudget: thinkingSettings.budget ?? DEFAULT_THINKING_BUDGET,
      },
    };
  }

  return undefined;
}

export async function sendMessageToGemini(
  currentMessages: Message[],
  newMessage: string,
  apiKey: string,
  modelName: string,
  thinkingSettings: ThinkingModelSettings,
  systemPrompt: string,
  onStream: (chunkText: string, isFirstChunk: boolean) => void,
  onComplete: (sources?: Source[], usageMetadata?: GeminiUsageMetadata) => void,
  imageData?: string,
  imageMimeType?: string,
  images?: MessageImage[]
): Promise<void> {
  try {
    const ai = getAiInstance(apiKey);
    const canonicalModelId = ModelService.getCanonicalModelId(modelName);
    const thinkingOverrides = buildThinkingConfig(
      canonicalModelId,
      thinkingSettings
    );

    const chat = ai.chats.create({
      model: canonicalModelId,
      history: formatMessagesForGemini(currentMessages),
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }],
        ...(thinkingOverrides ?? {}),
      },
    });

    const messageParts: unknown[] = [];
    
    if (images && images.length > 0) {
      for (const image of images) {
        messageParts.push({
          inlineData: {
            data: image.base64Data,
            mimeType: image.mimeType,
          },
        });
      }
    }
    else if (imageData && imageMimeType) {
      messageParts.push({
        inlineData: {
          data: imageData,
          mimeType: imageMimeType,
        },
      });
    }
    
    if (newMessage) {
      messageParts.push({ text: newMessage });
    }
    
    const stream = await chat.sendMessageStream({ 
      message: messageParts.length > 0 ? messageParts : newMessage 
    });

    let isFirst = true;
    const sources: Source[] = [];
    let latestUsageMetadata: GeminiUsageMetadata | undefined;

    let lastChunk: GenerateContentResponse | undefined;

    for await (const chunk of stream) {
      lastChunk = chunk;
      const chunkText = chunk.text;
      if (chunkText) {
        onStream(chunkText, isFirst);
        if (isFirst) isFirst = false;
      }

      const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        for (const groundingChunk of groundingMetadata.groundingChunks) {
          if (groundingChunk.web && !sources.some(s => s.uri === groundingChunk.web.uri)) {
            sources.push({
              title: groundingChunk.web.title || groundingChunk.web.uri,
              uri: groundingChunk.web.uri,
            });
          }
        }
      }

      const chunkUsage = extractUsageMetadata(chunk.usageMetadata);
      if (chunkUsage) {
        latestUsageMetadata = chunkUsage;
      }
    }

    if (!latestUsageMetadata && lastChunk) {
      latestUsageMetadata = extractUsageMetadata(lastChunk.usageMetadata);
    }

    onComplete(sources.length > 0 ? sources : undefined, latestUsageMetadata);
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    let errorMessage: string;

    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      const errorStr = String(error);

      if (
        errorMsg.includes('api key') ||
        errorMsg.includes('permission_denied') ||
        errorMsg.includes('invalid api key') ||
        errorStr.includes('401')
      ) {
        errorMessage =
          "SYSTEM ERROR: Invalid API key or permission denied.\n\nPlease check:\n- Your API key is correct\n- The API key has the necessary permissions\n- You can update it using: /apikey <your_key>";
      } else if (errorMsg.includes('quota') || errorMsg.includes('rate limit') || errorStr.includes('429')) {
        errorMessage = "SYSTEM ERROR: API quota exceeded or rate limit reached.\n\nPlease try again later or check your API quota.";
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('connection')) {
        errorMessage = "SYSTEM ERROR: Network connection failed.\n\nPlease check your internet connection and try again.";
      } else {
        errorMessage = `SYSTEM ERROR: ${error.message || 'Failed to get response from API.'}\n\nCheck the browser console for more details.`;
      }
    } else {
      errorMessage = `SYSTEM ERROR: Unexpected error occurred.\n\nError: ${String(error)}\n\nCheck the browser console for more details.`;
    }

    onStream(errorMessage, true);
    onComplete();
  }
}

