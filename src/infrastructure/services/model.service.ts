export interface ModelDefinition {
  id: string;
  displayName: string;
  shortLabel: string;
  description?: string;
  aliases: string[];
  contextLimit: number;
}

export type NanoBananaImageAspectRatio =
  | '1:1'
  | '2:3'
  | '3:2'
  | '3:4'
  | '4:3'
  | '4:5'
  | '5:4'
  | '9:16'
  | '16:9'
  | '21:9';

export type Imagen40ImageAspectRatio =
  | '1:1'
  | '3:4'
  | '4:3'
  | '16:9'
  | '9:16';

export type ImageAspectRatio = NanoBananaImageAspectRatio | Imagen40ImageAspectRatio;

export type ImageGenerationMethod = 'generateContent' | 'generateImages';

export interface ImageModelDefinition {
  id: string;
  displayName: string;
  shortLabel: string;
  description?: string;
  aliases: string[];
  apiModelId: string;
  generationMethod: ImageGenerationMethod;
  supportedAspectRatios: ImageAspectRatio[];
  defaultAspectRatio: ImageAspectRatio;
  inputTokenLimit?: number;
  tokenCountModelId?: string;
  outputMimeType?: string;
}

const CHAT_MODELS: Record<string, ModelDefinition> = {
  'gemini-3-flash-preview': {
    id: 'gemini-3-flash-preview',
    displayName: 'Gemini 3 Flash Preview',
    shortLabel: 'Flash',
    description: 'Fast multimodal model with 1M token context window.',
    aliases: ['flash', '3-flash'],
    contextLimit: 1_000_000,
  },
  'gemini-3-pro-preview': {
    id: 'gemini-3-pro-preview',
    displayName: 'Gemini 3 Pro Preview',
    shortLabel: '3-pro',
    description: 'Higher quality multimodal model with 1.048.576 token context window.',
    aliases: ['3-pro'],
    contextLimit: 1_048_576,
  },
};

const IMAGE_MODELS: Record<string, ImageModelDefinition> = {
  'gemini-3-pro-image-preview': {
    id: 'gemini-3-pro-image-preview',
    displayName: 'Gemini 3 Pro Image Preview',
    shortLabel: '3-pro-image',
    description: 'High quality multimodal image model.',
    aliases: ['3-pro-image', 'gemini-3-pro-image'],
    apiModelId: 'gemini-3-pro-image-preview',
    generationMethod: 'generateContent',
    supportedAspectRatios: [
      '1:1',
      '2:3',
      '3:2',
      '3:4',
      '4:3',
      '4:5',
      '5:4',
      '9:16',
      '16:9',
      '21:9',
    ],
    defaultAspectRatio: '1:1',
    inputTokenLimit: 32_768,
    tokenCountModelId: 'gemini-3-pro-image-preview',
    outputMimeType: 'image/png',
  },
};

const CHAT_ALIAS_LOOKUP: Record<string, string> = Object.values(CHAT_MODELS).reduce(
  (lookup, model) => {
    lookup[model.id.toLowerCase()] = model.id;
    model.aliases.forEach(alias => {
      lookup[alias.toLowerCase()] = model.id;
    });
    return lookup;
  },
  {} as Record<string, string>
);

const IMAGE_ALIAS_LOOKUP: Record<string, string> = Object.values(IMAGE_MODELS).reduce(
  (lookup, model) => {
    lookup[model.id.toLowerCase()] = model.id;
    model.aliases.forEach(alias => {
      lookup[alias.toLowerCase()] = model.id;
    });
    return lookup;
  },
  {} as Record<string, string>
);

function stripOuterQuotes(value: string): string {
  if (value.length < 2) {
    return value;
  }
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1).trim();
  }
  return value;
}

function sanitizeInput(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return stripOuterQuotes(trimmed);
}

function normalizeInput(value?: string): string | undefined {
  const sanitized = sanitizeInput(value);
  return sanitized?.toLowerCase();
}

export class ModelService {
  static getDefaultModel(): ModelDefinition {
    return CHAT_MODELS['gemini-3-flash-preview'];
  }

  static listModels(): ModelDefinition[] {
    return Object.values(CHAT_MODELS);
  }

  static resolveModel(input?: string): ModelDefinition | undefined {
    const sanitized = sanitizeInput(input);
    const normalized = normalizeInput(sanitized);
    if (!normalized) {
      return undefined;
    }
    const canonicalId = CHAT_ALIAS_LOOKUP[normalized];
    if (canonicalId) {
      return CHAT_MODELS[canonicalId];
    }
    return CHAT_MODELS[sanitized ?? ''];
  }

  static getCanonicalModelId(input: string): string {
    const sanitized = sanitizeInput(input) ?? input;
    return this.resolveModel(sanitized)?.id ?? sanitized;
  }

  static getContextLimit(modelName?: string): number | undefined {
    return this.resolveModel(modelName)?.contextLimit;
  }

  static getDisplayName(modelName?: string): string | undefined {
    return this.resolveModel(modelName)?.displayName;
  }

  static getShortLabel(modelName?: string): string {
    return this.resolveModel(modelName)?.shortLabel ?? 'Unknown';
  }

  static listImageModels(): ImageModelDefinition[] {
    return Object.values(IMAGE_MODELS);
  }

  static getDefaultImageModel(): ImageModelDefinition {
    return IMAGE_MODELS['gemini-3-pro-image-preview'];
  }

  static resolveImageModel(input?: string): ImageModelDefinition | undefined {
    const sanitized = sanitizeInput(input);
    const normalized = normalizeInput(sanitized);
    if (!normalized) {
      return undefined;
    }
    const canonicalId = IMAGE_ALIAS_LOOKUP[normalized];
    if (canonicalId) {
      return IMAGE_MODELS[canonicalId];
    }
    return IMAGE_MODELS[sanitized ?? ''];
  }

  static getCanonicalImageModelId(input: string): string {
    const sanitized = sanitizeInput(input) ?? input;
    return this.resolveImageModel(sanitized)?.id ?? sanitized;
  }

  static sanitizeModelInput(input?: string): string | undefined {
    return sanitizeInput(input);
  }

  static getImageModelDisplayName(modelName?: string): string | undefined {
    return this.resolveImageModel(modelName)?.displayName;
  }

  static getImageModelShortLabel(modelName?: string): string {
    return this.resolveImageModel(modelName)?.shortLabel ?? 'Unknown';
  }

  static getImageModelAspectRatios(modelName?: string): ImageAspectRatio[] {
    return this.resolveImageModel(modelName)?.supportedAspectRatios ?? [];
  }

  static getImageModelDefinition(modelName?: string): ImageModelDefinition | undefined {
    return this.resolveImageModel(modelName ?? this.getDefaultImageModel().id);
  }
}

