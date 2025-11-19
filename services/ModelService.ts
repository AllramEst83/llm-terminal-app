export interface ModelDefinition {
  id: string;
  displayName: string;
  shortLabel: string;
  description?: string;
  aliases: string[];
  contextLimit: number;
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

const ALIAS_LOOKUP: Record<string, string> = Object.values(CHAT_MODELS).reduce(
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
    const canonicalId = ALIAS_LOOKUP[normalized];
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
}


