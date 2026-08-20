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
  'gemini-3.7-flash': {
    id: 'gemini-3.7-flash',
    displayName: 'Gemini 3.7 Flash',
    shortLabel: '3.7-flash',
    description: 'Latest Flash model with enhanced speed and multimodal capabilities.',
    aliases: ['3.7-flash', 'gemini-3.7-flash', 'flash-3.7', '3.7'],
    contextLimit: 1_048_576,
  },
  'gemini-3.6-flash': {
    id: 'gemini-3.6-flash',
    displayName: 'Gemini 3.6 Flash',
    shortLabel: '3.6-flash',
    description: 'Latest Flash model balancing speed, multimodal capabilities, and frontier performance.',
    aliases: ['3.6-flash', 'gemini-3.6-flash', 'flash-3.6', '3.6', 'flash'],
    contextLimit: 1_048_576,
  },
  'gemini-3.5-flash': {
    id: 'gemini-3.5-flash',
    displayName: 'Gemini 3.5 Flash',
    shortLabel: '3.5-flash',
    description: 'Frontier performance optimized for agentic and coding tasks.',
    aliases: ['3.5-flash', 'gemini-3.5-flash', 'flash-3.5', '3.5'],
    contextLimit: 1_048_576,
  },
  'gemini-3.5-flash-lite': {
    id: 'gemini-3.5-flash-lite',
    displayName: 'Gemini 3.5 Flash-Lite',
    shortLabel: '3.5-lite',
    description: 'Fastest, most cost-effective model for high-throughput execution.',
    aliases: ['3.5-lite', 'gemini-3.5-flash-lite', 'flash-lite-3.5', '3.5-flash-lite'],
    contextLimit: 1_048_576,
  },
  'gemini-3.1-pro-preview': {
    id: 'gemini-3.1-pro-preview',
    displayName: 'Gemini 3.1 Pro Preview',
    shortLabel: '3.1-pro',
    description: 'Advanced reasoning, complex problem solving, and coding model.',
    aliases: ['3.1-pro', '3-pro', 'pro', 'gemini-3.1-pro-preview', 'gemini-3.1-pro'],
    contextLimit: 1_048_576,
  },
};

const IMAGE_MODELS: Record<string, ImageModelDefinition> = {
  'gemini-3.1-flash-image': {
    id: 'gemini-3.1-flash-image',
    displayName: 'Gemini 3.1 Flash Image (Nano Banana 2)',
    shortLabel: '3.1-flash-image',
    description: 'High-efficiency Nano Banana 2 image model for fast generation and editing.',
    aliases: ['3.1-flash-image', 'flash-image', 'gemini-3.1-flash-image', 'nano-banana-2'],
    apiModelId: 'gemini-3.1-flash-image',
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
    inputTokenLimit: 131_072,
    tokenCountModelId: 'gemini-3.1-flash-image',
    outputMimeType: 'image/png',
  },
  'gemini-3.1-flash-lite-image': {
    id: 'gemini-3.1-flash-lite-image',
    displayName: 'Gemini 3.1 Flash-Lite Image (Nano Banana 2)',
    shortLabel: '3.1-lite-image',
    description: 'Ultra-low latency, cost-effective Nano Banana 2 model for real-time visual generation.',
    aliases: ['3.1-lite-image', 'flash-lite-image', 'gemini-3.1-flash-lite-image', 'nano-banana-2-lite'],
    apiModelId: 'gemini-3.1-flash-lite-image',
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
    inputTokenLimit: 131_072,
    tokenCountModelId: 'gemini-3.1-flash-lite-image',
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
  let trimmed = value.trim();
  let changed = true;

  while (changed && trimmed.length > 1) {
    changed = false;
    const withoutSlashes = trimmed.replace(/^\\+/, '').replace(/\\+$/, '').trim();
    if (withoutSlashes !== trimmed) {
      trimmed = withoutSlashes;
      changed = true;
    }

    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      trimmed = trimmed.slice(1, -1).trim();
      changed = true;
    }
  }

  return trimmed;
}

function sanitizeInput(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const unescaped = trimmed.replace(/\\(["'])/g, '$1');
  return stripOuterQuotes(unescaped);
}

function normalizeInput(value?: string): string | undefined {
  const sanitized = sanitizeInput(value);
  return sanitized?.toLowerCase();
}

export class ModelService {
  static getDefaultModel(): ModelDefinition {
    return CHAT_MODELS['gemini-3.7-flash'] ?? CHAT_MODELS['gemini-3.6-flash'];
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
    return IMAGE_MODELS['gemini-3.1-flash-image'];
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

