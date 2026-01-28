import type { GeminiUsageMetadata } from "../api/gemini.service";
import { ModelService } from "./model.service";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  imageTokens: number;
}

export type ModelTokenUsage = Record<string, TokenUsage>;

export interface SessionTokenUsage {
  chat: ModelTokenUsage;
  image: ModelTokenUsage;
}

type UsageCategory = keyof SessionTokenUsage;

const SESSION_STORAGE_KEY_PREFIX = 'token_usage';

function buildSessionKey(sessionId?: string): string {
  if (!sessionId) {
    return SESSION_STORAGE_KEY_PREFIX;
  }
  return `${SESSION_STORAGE_KEY_PREFIX}:${sessionId}`;
}

function createEmptyUsage(): TokenUsage {
  return { inputTokens: 0, outputTokens: 0, imageTokens: 0 };
}

function createInitialCategoryUsage(models: { id: string }[]): ModelTokenUsage {
  return models.reduce((usage, model) => {
    usage[model.id] = createEmptyUsage();
    return usage;
  }, {} as ModelTokenUsage);
}

function createInitialSessionUsage(): SessionTokenUsage {
  return {
    chat: createInitialCategoryUsage(ModelService.listModels()),
    image: createInitialCategoryUsage(ModelService.listImageModels()),
  };
}

export class TokenCountService {
  static readonly TOKEN_WARNING_BUFFER = 50_000;

  static initializeSessionStorage(sessionId?: string): void {
    const initialUsage = createInitialSessionUsage();
    sessionStorage.setItem(buildSessionKey(sessionId), JSON.stringify(initialUsage));
  }

  static getTokenUsage(sessionId?: string): SessionTokenUsage {
    try {
      const stored = sessionStorage.getItem(buildSessionKey(sessionId));
      if (!stored) {
        this.initializeSessionStorage(sessionId);
        return this.getTokenUsage(sessionId);
      }
      const parsed = JSON.parse(stored);
      const sessionUsage = this.normalizeSessionUsage(parsed);
      sessionStorage.setItem(buildSessionKey(sessionId), JSON.stringify(sessionUsage));
      return sessionUsage;
    } catch (error) {
      console.error('Error reading token usage from session storage:', error);
      this.initializeSessionStorage(sessionId);
      return this.getTokenUsage(sessionId);
    }
  }

  private static normalizeSessionUsage(raw: unknown): SessionTokenUsage {
    const ensureCategory = (
      categoryUsage: Record<string, Partial<TokenUsage>> | undefined,
      models: { id: string }[]
    ): ModelTokenUsage => {
      const normalized: ModelTokenUsage =
        categoryUsage && typeof categoryUsage === 'object'
          ? Object.keys(categoryUsage).reduce((acc, key) => {
              const usage = categoryUsage[key] as Partial<TokenUsage> | undefined;
              acc[key] = {
                inputTokens: usage?.inputTokens ?? 0,
                outputTokens: usage?.outputTokens ?? 0,
                imageTokens: usage?.imageTokens ?? 0,
              };
              return acc;
            }, {} as ModelTokenUsage)
          : {};

      models.forEach(model => {
        if (!normalized[model.id]) {
          normalized[model.id] = createEmptyUsage();
        }
      });

      return normalized;
    };

    const rawRecord = raw as Record<string, unknown>;
    if (rawRecord?.chat && rawRecord?.image) {
      return {
        chat: ensureCategory(rawRecord.chat as Record<string, Partial<TokenUsage>>, ModelService.listModels()),
        image: ensureCategory(rawRecord.image as Record<string, Partial<TokenUsage>>, ModelService.listImageModels()),
      };
    }

    const legacyChatUsage =
      raw && typeof raw === 'object'
        ? (raw as Record<string, Partial<TokenUsage>>)
        : undefined;

    return {
      chat: ensureCategory(legacyChatUsage, ModelService.listModels()),
      image: ensureCategory(undefined, ModelService.listImageModels()),
    };
  }

  static updateTokenUsage(
    modelName: string,
    inputTokens?: number,
    outputTokens?: number,
    imageTokensDelta?: number,
    sessionId?: string
  ): void {
    this.updateModelUsage('chat', modelName, inputTokens, outputTokens, imageTokensDelta, sessionId);
  }

  static updateTokenUsageFromMetadata(
    modelName: string,
    usageMetadata?: GeminiUsageMetadata,
    sessionId?: string
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

    this.updateModelUsage('chat', modelName, inputTokens, outputTokens, undefined, sessionId);
  }

  static updateImageModelUsageFromMetadata(
    modelName: string,
    usageMetadata?: GeminiUsageMetadata,
    sessionId?: string
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
    const totalTokens =
      typeof usageMetadata.totalTokenCount === 'number'
        ? usageMetadata.totalTokenCount
        : undefined;

    this.updateModelUsage('image', modelName, inputTokens, outputTokens, totalTokens, sessionId);
  }

  static addImageTokens(modelName: string, tokenCount?: number, sessionId?: string): void {
    if (typeof tokenCount !== 'number' || tokenCount <= 0) {
      return;
    }

    this.updateModelUsage('image', modelName, undefined, undefined, tokenCount, sessionId);
  }

  static getModelTokenUsage(modelName: string, sessionId?: string): TokenUsage {
    const usage = this.getTokenUsage(sessionId);
    const canonicalModel = ModelService.getCanonicalModelId(modelName);
    return usage.chat[canonicalModel] || createEmptyUsage();
  }

  static getImageModelTokenUsage(modelName: string, sessionId?: string): TokenUsage {
    const usage = this.getTokenUsage(sessionId);
    const canonicalModel = ModelService.getCanonicalImageModelId(modelName);
    return usage.image[canonicalModel] || createEmptyUsage();
  }

  private static updateModelUsage(
    category: UsageCategory,
    modelName: string,
    inputTokens?: number,
    outputTokens?: number,
    imageTokensDelta?: number,
    sessionId?: string
  ): void {
    const usage = this.getTokenUsage(sessionId);
    const canonicalModel =
      category === 'chat'
        ? ModelService.getCanonicalModelId(modelName)
        : ModelService.getCanonicalImageModelId(modelName);

    if (!usage[category][canonicalModel]) {
      usage[category][canonicalModel] = createEmptyUsage();
    }

    const modelUsage = usage[category][canonicalModel];
    const shouldReplaceInput = category === 'chat';

    if (typeof inputTokens === 'number') {
      modelUsage.inputTokens = shouldReplaceInput
        ? inputTokens
        : modelUsage.inputTokens + inputTokens;
    }

    if (typeof outputTokens === 'number') {
      modelUsage.outputTokens += outputTokens;
    }

    if (typeof imageTokensDelta === 'number') {
      modelUsage.imageTokens += imageTokensDelta;
    }

    sessionStorage.setItem(buildSessionKey(sessionId), JSON.stringify(usage));
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
      console.error('Error counting tokens:', error);
      throw error;
    }
  }

  static formatTokenUsage(usage: SessionTokenUsage): string {
    const chatSection = this.buildChatUsageSection(usage.chat);
    const imageSection = this.buildImageUsageSection(usage.image);

    return `## TOKEN USAGE (CURRENT SESSION)

${chatSection}

${imageSection}

---
**Note:** Input tokens represent the conversation context sent to chat models. Image model usage is tracked separately and does **not** consume the chat context window. Use \`/clear\` to reset the session token counts.`;
  }

  private static buildChatUsageSection(chatUsage: ModelTokenUsage): string {
    const knownModels = ModelService.listModels().map(model => ({
      id: model.id,
      displayName: model.displayName,
      contextLimit: model.contextLimit,
    }));

    const knownIds = new Set(knownModels.map(model => model.id));
    const customModels = Object.keys(chatUsage)
      .filter(id => !knownIds.has(id))
      .map(id => ({
        id,
        displayName: ModelService.getDisplayName(id) ?? id,
        contextLimit: ModelService.getContextLimit(id),
      }));

    const combinedModels = [...knownModels, ...customModels];

    if (combinedModels.length === 0) {
      return '### Chat Models\n- No chat usage recorded this session.';
    }

    const sections = combinedModels.map(model => {
      const modelUsage = chatUsage[model.id] ?? createEmptyUsage();
      const totalTokens = modelUsage.inputTokens + modelUsage.outputTokens;
      const limit = model.contextLimit;
      const percent = limit
        ? ((modelUsage.inputTokens / limit) * 100).toFixed(1)
        : 'N/A';

      return `### ${model.displayName}
- **Input Tokens:** ${modelUsage.inputTokens.toLocaleString()}${limit ? ` / ${limit.toLocaleString()} (${percent}%)` : ''}
- **Output Tokens:** ${modelUsage.outputTokens.toLocaleString()}
- **Total Tokens:** ${totalTokens.toLocaleString()}`;
    });

    return `### Chat Models\n\n${sections.join('\n\n')}`;
  }

  private static buildImageUsageSection(imageUsage: ModelTokenUsage): string {
    const imageModels = ModelService.listImageModels().map(model => ({
      id: model.id,
      displayName: model.displayName,
      inputLimit: model.inputTokenLimit,
    }));

    const knownIds = new Set(imageModels.map(model => model.id));
    const customModels = Object.keys(imageUsage)
      .filter(id => !knownIds.has(id))
      .map(id => ({
        id,
        displayName: ModelService.getImageModelDisplayName(id) ?? id,
        inputLimit: ModelService.getImageModelDefinition(id)?.inputTokenLimit,
      }));

    const combinedModels = [...imageModels, ...customModels];

    if (combinedModels.length === 0) {
      return '### Image Models\n- Image generation is not enabled.';
    }

    const sections = combinedModels.map(model => {
      const modelUsage = imageUsage[model.id] ?? createEmptyUsage();
      const totalTokens =
        modelUsage.imageTokens > 0
          ? modelUsage.imageTokens
          : modelUsage.inputTokens + modelUsage.outputTokens;
      const limit = model.inputLimit;

      return `### ${model.displayName}
- **Prompt Tokens:** ${modelUsage.inputTokens.toLocaleString()}${limit ? ` / ${limit.toLocaleString()}` : ''}
- **Response Tokens:** ${modelUsage.outputTokens.toLocaleString()}
- **Total Tokens:** ${totalTokens.toLocaleString()}`;
    });

    return `### Image Models\n\n${sections.join('\n\n')}`;
  }

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

  static clearTokenUsage(sessionId?: string): void {
    this.initializeSessionStorage(sessionId);
  }

  static removeSessionUsage(sessionId?: string): void {
    sessionStorage.removeItem(buildSessionKey(sessionId));
  }
}

