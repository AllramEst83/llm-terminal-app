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
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    shortLabel: 'Flash',
    description: 'Fast multimodal model with 1M token context window.',
    aliases: ['flash'],
    contextLimit: 1_000_000,
  },
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    shortLabel: '2.5-pro',
    description: 'Higher quality multimodal model with 2M token context window.',
    aliases: ['2.5-pro'],
    contextLimit: 2_000_000,
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

/*
imagen-4.0-ultra-generate-001
imagen-4.0-fast-generate-001
*/
const IMAGE_MODELS: Record<string, ImageModelDefinition> = {
  'nano-banana': {
    id: 'nano-banana',
    displayName: 'Gemini 2.5 Flash Image (Nano Banana)',
    shortLabel: 'Nano',
    description: 'Fast multimodal image model best for quick concept art.',
    aliases: ['nano', 'banana', 'gemini-2.5-flash-image'],
    apiModelId: 'gemini-2.5-flash-image',
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
    tokenCountModelId: 'gemini-2.5-flash-image',
  },
  'imagen-4.0': {
    id: 'imagen-4.0',
    displayName: 'Imagen 4.0',
    shortLabel: 'Imagen',
    description: 'High fidelity still-image model with 480-token prompt limit.',
    aliases: ['imagen', 'imagen4', 'imagen-4'],
    apiModelId: 'imagen-4.0-generate-001',
    generationMethod: 'generateImages',
    supportedAspectRatios: ['1:1', '3:4', '4:3', '16:9', '9:16'],
    defaultAspectRatio: '1:1',
    inputTokenLimit: 480,
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

function normalizeInput(value?: string): string | undefined {
  return value?.trim().toLowerCase();
}

export class ModelService {
  static getDefaultModel(): ModelDefinition {
    return CHAT_MODELS['gemini-2.5-flash'];
  }

  static listModels(): ModelDefinition[] {
    return Object.values(CHAT_MODELS);
  }

  static resolveModel(input?: string): ModelDefinition | undefined {
    const normalized = normalizeInput(input);
    if (!normalized) {
      return undefined;
    }
    const canonicalId = CHAT_ALIAS_LOOKUP[normalized];
    if (canonicalId) {
      return CHAT_MODELS[canonicalId];
    }
    return CHAT_MODELS[input ?? ''];
  }

  static getCanonicalModelId(input: string): string {
    return this.resolveModel(input)?.id ?? input;
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
    return IMAGE_MODELS['nano-banana'];
  }

  static resolveImageModel(input?: string): ImageModelDefinition | undefined {
    const normalized = normalizeInput(input);
    if (!normalized) {
      return undefined;
    }
    const canonicalId = IMAGE_ALIAS_LOOKUP[normalized];
    if (canonicalId) {
      return IMAGE_MODELS[canonicalId];
    }
    return IMAGE_MODELS[input ?? ''];
  }

  static getCanonicalImageModelId(input: string): string {
    return this.resolveImageModel(input)?.id ?? input;
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


