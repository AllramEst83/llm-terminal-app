import type { GeminiUsageMetadata } from "./geminiService";
import { ModelService } from "./ModelService";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  imageTokens: number;
}

export type ModelTokenUsage = Record<string, TokenUsage>;

const SESSION_STORAGE_KEY = 'token_usage';

function createEmptyUsage(): TokenUsage {
  return { inputTokens: 0, outputTokens: 0, imageTokens: 0 };
}

function createInitialUsage(): ModelTokenUsage {
  return ModelService.listModels().reduce((usage, model) => {
    usage[model.id] = createEmptyUsage();
    return usage;
  }, {} as ModelTokenUsage);
}

export class TokenCountService {
  static readonly TOKEN_WARNING_BUFFER = 50_000;
  static readonly NANO_BANANA_INPUT_LIMIT = 32_768;

  // Initialize session storage with empty counts
  static initializeSessionStorage(): void {
    const initialUsage = createInitialUsage();
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
      ModelService.listModels().forEach(model => {
        if (!parsed[model.id]) {
          parsed[model.id] = createEmptyUsage();
        } else {
          const usage = parsed[model.id];
          parsed[model.id] = {
            inputTokens: usage?.inputTokens ?? 0,
            outputTokens: usage?.outputTokens ?? 0,
            imageTokens: usage?.imageTokens ?? 0,
          };
        }
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
    const canonicalModel = ModelService.getCanonicalModelId(modelName);

    if (!usage[canonicalModel]) {
      usage[canonicalModel] = createEmptyUsage();
    }

    const modelUsage = usage[canonicalModel];

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
    const canonicalModel = ModelService.getCanonicalModelId(modelName);
    return usage[canonicalModel] || createEmptyUsage();
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
    const knownModels = ModelService.listModels().map(model => ({
      id: model.id,
      displayName: model.displayName,
      contextLimit: model.contextLimit,
    }));

    const knownIds = new Set(knownModels.map(model => model.id));
    const customModels = Object.keys(usage)
      .filter(id => !knownIds.has(id))
      .map(id => ({
        id,
        displayName: ModelService.getDisplayName(id) ?? id,
        contextLimit: ModelService.getContextLimit(id),
      }));

    const combinedModels = [...knownModels, ...customModels];

    const modelSections = combinedModels.map(model => {
      const modelUsage = usage[model.id] ?? createEmptyUsage();
      const totalTokens = modelUsage.inputTokens + modelUsage.outputTokens + modelUsage.imageTokens;
      const limit = model.contextLimit;
      const percent = limit
        ? ((modelUsage.inputTokens / limit) * 100).toFixed(1)
        : 'N/A';

      return `### ${model.displayName}
- **Input Tokens:** ${modelUsage.inputTokens.toLocaleString()}${limit ? ` / ${limit.toLocaleString()} (${percent}%)` : ''}
- **Output Tokens:** ${modelUsage.outputTokens.toLocaleString()}
- **Image Tokens:** ${modelUsage.imageTokens.toLocaleString()}
- **Total Tokens:** ${totalTokens.toLocaleString()}`;
    });

    return `## TOKEN USAGE (CURRENT SESSION)

${modelSections.join('\n\n')}

---
**Note:** Input tokens represent the conversation context sent to the model. Image tokens track usage from image generation pipelines (e.g., Nano Banana) and do **not** consume the chat context window. Use \`/clear\` to reset the context and token counts.`;
  }

  // Normalize model name to standard format
  static getModelLimit(modelName: string): number {
    return ModelService.getContextLimit(modelName) ?? 0;
  }

  static getModelDisplayName(modelName: string): string {
    return ModelService.getDisplayName(modelName) ?? modelName;
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

