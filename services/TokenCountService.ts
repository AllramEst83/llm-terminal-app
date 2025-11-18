import type { GeminiUsageMetadata } from "./geminiService";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  imageTokens: number;
}

export interface ModelTokenUsage {
  'gemini-2.5-flash': TokenUsage;
  'gemini-2.5-pro': TokenUsage;
}

const SESSION_STORAGE_KEY = 'token_usage';

function createEmptyUsage(): TokenUsage {
  return { inputTokens: 0, outputTokens: 0, imageTokens: 0 };
}

export class TokenCountService {
  // Model token limits
  static readonly MODEL_LIMITS = {
    'gemini-2.5-flash': 1_000_000,
    'gemini-2.5-pro': 2_000_000,
  };
  static readonly TOKEN_WARNING_BUFFER = 50_000;
  static readonly NANO_BANANA_INPUT_LIMIT = 32_768;

  // Initialize session storage with empty counts
  static initializeSessionStorage(): void {
    const initialUsage: ModelTokenUsage = {
      'gemini-2.5-flash': createEmptyUsage(),
      'gemini-2.5-pro': createEmptyUsage(),
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(initialUsage));
  }

  // Get current token usage from session storage
  static getTokenUsage(): ModelTokenUsage {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) {
        this.initializeSessionStorage();
        return this.getTokenUsage();
      }
      const parsed = JSON.parse(stored) as ModelTokenUsage;
      // Ensure newer fields exist even if the storage was created before update
      Object.keys(parsed).forEach(key => {
        const usage = parsed[key as keyof ModelTokenUsage] as TokenUsage;
        parsed[key as keyof ModelTokenUsage] = {
          inputTokens: usage?.inputTokens ?? 0,
          outputTokens: usage?.outputTokens ?? 0,
          imageTokens: usage?.imageTokens ?? 0,
        };
      });
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    } catch (error) {
      console.error('Error reading token usage from session storage:', error);
      this.initializeSessionStorage();
      return this.getTokenUsage();
    }
  }

  // Update token usage for a specific model
  // inputTokens: total conversation tokens (replaces existing value)
  // outputTokens: new response tokens (adds to existing cumulative total)
  // imageTokensDelta: new image tokens to add (cumulative)
  static updateTokenUsage(
    modelName: string,
    inputTokens?: number,
    outputTokens?: number,
    imageTokensDelta?: number
  ): void {
    const usage = this.getTokenUsage();
    const normalizedModel = this.normalizeModelName(modelName);

    if (normalizedModel in usage) {
      const modelUsage = usage[normalizedModel as keyof ModelTokenUsage];

      if (typeof inputTokens === 'number') {
        modelUsage.inputTokens = inputTokens;
      }

      if (typeof outputTokens === 'number') {
        modelUsage.outputTokens += outputTokens;
      }

      if (typeof imageTokensDelta === 'number') {
        modelUsage.imageTokens += imageTokensDelta;
      }

      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(usage));
    }
  }

  static updateTokenUsageFromMetadata(
    modelName: string,
    usageMetadata?: GeminiUsageMetadata
  ): void {
    if (!usageMetadata) {
      return;
    }

    const inputTokens =
      typeof usageMetadata.promptTokenCount === 'number'
        ? usageMetadata.promptTokenCount
        : undefined;
    const outputTokens =
      typeof usageMetadata.candidatesTokenCount === 'number'
        ? usageMetadata.candidatesTokenCount
        : undefined;

    this.updateTokenUsage(modelName, inputTokens, outputTokens);
  }

  static addImageTokens(modelName: string, tokenCount?: number): void {
    if (typeof tokenCount !== 'number' || tokenCount <= 0) {
      return;
    }

    this.updateTokenUsage(modelName, undefined, undefined, tokenCount);
  }

  // Get token usage for the current model
  static getModelTokenUsage(modelName: string): TokenUsage {
    const usage = this.getTokenUsage();
    const normalizedModel = this.normalizeModelName(modelName);
    return usage[normalizedModel as keyof ModelTokenUsage] || createEmptyUsage();
  }

  static async countTokensViaEndpoint(
    text: string,
    apiKey: string,
    modelName: string
  ): Promise<number> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:countTokens`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text,
            },
          ],
        },
      ],
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `HTTP ERROR! STATUS: ${response.status}, DETAIL: ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      return data.totalTokens || 0;
    } catch (error) {
      console.error('Error counting Nano Banana tokens:', error);
      throw error;
    }
  }

  // Format token usage for display
  static formatTokenUsage(usage: ModelTokenUsage): string {
    const flashUsage = usage['gemini-2.5-flash'];
    const proUsage = usage['gemini-2.5-pro'];
    const flashLimit = this.MODEL_LIMITS['gemini-2.5-flash'];
    const proLimit = this.MODEL_LIMITS['gemini-2.5-pro'];

    const flashTotal = flashUsage.inputTokens + flashUsage.outputTokens + flashUsage.imageTokens;
    const proTotal = proUsage.inputTokens + proUsage.outputTokens;

    const flashPercent = ((flashUsage.inputTokens / flashLimit) * 100).toFixed(1);
    const proPercent = ((proUsage.inputTokens / proLimit) * 100).toFixed(1);

    return `## TOKEN USAGE (CURRENT SESSION)

### Gemini 2.5 Flash
- **Input Tokens:** ${flashUsage.inputTokens.toLocaleString()} / ${flashLimit.toLocaleString()} (${flashPercent}%)
- **Output Tokens:** ${flashUsage.outputTokens.toLocaleString()}
- **Image Tokens:** ${flashUsage.imageTokens.toLocaleString()}
- **Total Tokens:** ${flashTotal.toLocaleString()}

### Gemini 2.5 Pro
- **Input Tokens:** ${proUsage.inputTokens.toLocaleString()} / ${proLimit.toLocaleString()} (${proPercent}%)
- **Output Tokens:** ${proUsage.outputTokens.toLocaleString()}
- **Total Tokens:** ${proTotal.toLocaleString()}

---
**Note:** Input tokens represent the conversation context sent to the model. Image tokens come from the separate Gemini 2.5 Flash Image pipeline (Nano Banana) and do **not** consume the flash chat context window. Use \`/clear\` to reset the context and token counts.`;
  }

  // Normalize model name to standard format
  private static normalizeModelName(modelName: string): string {
    if (modelName.includes('flash')) {
      return 'gemini-2.5-flash';
    } else if (modelName.includes('pro')) {
      return 'gemini-2.5-pro';
    }
    return modelName;
  }

  static getModelLimit(modelName: string): number {
    const normalized = this.normalizeModelName(modelName);
    return this.MODEL_LIMITS[normalized as keyof typeof this.MODEL_LIMITS] ?? 0;
  }

  static getModelDisplayName(modelName: string): string {
    const normalized = this.normalizeModelName(modelName);
    if (normalized === 'gemini-2.5-flash') {
      return 'Gemini 2.5 Flash';
    }
    if (normalized === 'gemini-2.5-pro') {
      return 'Gemini 2.5 Pro';
    }
    return modelName;
  }

  static isApproachingModelLimit(
    modelName: string,
    promptTokens?: number,
    buffer: number = this.TOKEN_WARNING_BUFFER
  ): boolean {
    if (typeof promptTokens !== 'number' || promptTokens <= 0) {
      return false;
    }
    const limit = this.getModelLimit(modelName);
    if (!limit) {
      return false;
    }
    return promptTokens >= Math.max(limit - buffer, 0);
  }

  // Clear token usage (for /clear command)
  static clearTokenUsage(): void {
    this.initializeSessionStorage();
  }
}

