import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { Message, Source, MessageImage } from '../domain/Message';
import type { ThinkingLevel } from '../domain/Settings';
import { ModelService } from './ModelService';

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
      const parts: any[] = [];
      
      // Add multiple images if present (new format)
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
      // Fallback to old single image format for backward compatibility
      else if (msg.imageData && msg.imageMimeType) {
        parts.push({
          inlineData: {
            data: msg.imageData,
            mimeType: msg.imageMimeType,
          },
        });
      }
      
      // Add text if present
      if (msg.text) {
        parts.push({ text: msg.text });
      }
      
      return {
        role: msg.role,
        parts: parts.length > 0 ? parts : [{ text: msg.text }],
      };
    });
}

function extractUsageMetadata(rawMetadata: any): GeminiUsageMetadata | undefined {
  if (!rawMetadata) {
    return undefined;
  }

  const { promptTokenCount, candidatesTokenCount, totalTokenCount } = rawMetadata;
  if (
    typeof promptTokenCount !== 'number' &&
    typeof candidatesTokenCount !== 'number' &&
    typeof totalTokenCount !== 'number'
  ) {
    return undefined;
  }

  return {
    promptTokenCount,
    candidatesTokenCount,
    totalTokenCount,
  };
}

const DEFAULT_THINKING_BUDGET = 8192;
const BUDGET_MODELS = new Set(['gemini-2.5-flash', 'gemini-2.5-pro']);

function buildThinkingConfig(
  modelName: string,
  thinkingEnabled: boolean,
  thinkingBudget: number | undefined,
  thinkingLevel: ThinkingLevel
) {
  if (!thinkingEnabled) {
    return undefined;
  }

  const canonicalModelId = ModelService.getCanonicalModelId(modelName);

  if (canonicalModelId === 'gemini-3-pro-preview') {
    return {
      thinkingConfig: {
        thinkingLevel,
      },
    };
  }

  if (BUDGET_MODELS.has(canonicalModelId)) {
    return {
      thinkingConfig: {
        thinkingBudget: thinkingBudget || DEFAULT_THINKING_BUDGET,
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
  thinkingEnabled: boolean,
  thinkingBudget: number | undefined,
  thinkingLevel: ThinkingLevel,
  onStream: (chunkText: string, isFirstChunk: boolean) => void,
  onComplete: (sources?: Source[], usageMetadata?: GeminiUsageMetadata) => void,
  imageData?: string,
  imageMimeType?: string,
  images?: MessageImage[]
): Promise<void> {
  try {
    const ai = getAiInstance(apiKey);
    const thinkingOverrides = buildThinkingConfig(
      modelName,
      thinkingEnabled,
      thinkingBudget,
      thinkingLevel
    );

    const chat = ai.chats.create({
      model: modelName,
      history: formatMessagesForGemini(currentMessages),
      config: {
        systemInstruction:
          'You are a helpful assistant in a retro 1980s computer terminal. Respond like you are from that era with the vocabulary and style of the 1980s, but do not add terminal prompts, cursors (like >█), or command-line symbols to your responses. Keep responses concise. Always use valid Markdown formatting: **bold** (double asterisk, no spaces), *italic* (single asterisk), ***bold and italic*** (triple asterisk, no spaces), code blocks with ```language, lists with proper bullets, etc. You now have access to the "World Wide Web" via Google Search for up-to-date information. If a query requires recent information or the user uses the /search command, use this tool. The user can use commands like /help, /settings, /font, /sound, /clear, and /search, but you should not attempt to execute them; the system handles them.',
        tools: [{ googleSearch: {} }],
        ...(thinkingOverrides ?? {}),
      },
    });

    // Build message parts
    const messageParts: any[] = [];
    
    // Add multiple images first if present (new format)
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
    // Fallback to single image format for backward compatibility
    else if (imageData && imageMimeType) {
      messageParts.push({
        inlineData: {
          data: imageData,
          mimeType: imageMimeType,
        },
      });
    }
    
    // Add text
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

    // Stream the error message back to the UI
    onStream(errorMessage, true);
    onComplete();
  }
}