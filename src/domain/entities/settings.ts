import type { ThemeName } from './theme';
import { Theme } from './theme';

export type ThinkingLevel = 'low' | 'high';

export interface ThinkingModelSettings {
  enabled: boolean;
  budget?: number;
  level?: ThinkingLevel;
}

export const GEMINI_FLASH_MODEL_ID = 'gemini-3-flash-preview';
export const GEMINI_PRO_MODEL_ID = 'gemini-3-pro-preview';

const BUDGET_MODEL_IDS = new Set<string>([GEMINI_FLASH_MODEL_ID]);

export class Settings {
  constructor(
    public readonly fontSize: number,
    public readonly themeName: ThemeName,
    public readonly apiKey: string,
    public readonly modelName: string,
    public readonly thinkingSettings: Record<string, ThinkingModelSettings>
  ) {
    this.thinkingSettings = Settings.normalizeThinkingSettings(thinkingSettings);
  }

  static readonly DEFAULT_FONT_SIZE = 16;
  static readonly MIN_FONT_SIZE = 8;
  static readonly MAX_FONT_SIZE = 48;
  static readonly DEFAULT_MODEL_NAME = 'gemini-3-flash-preview';
  static readonly DEFAULT_THINKING_BUDGET = 8192;
  static readonly DEFAULT_THINKING_LEVEL: ThinkingLevel = 'high';

  static createDefault(): Settings {
    return new Settings(
      this.DEFAULT_FONT_SIZE,
      Theme.DEFAULT_THEME_NAME,
      '',
      this.DEFAULT_MODEL_NAME,
      this.createDefaultThinkingSettings()
    );
  }

  static isValidFontSize(size: number): boolean {
    return !isNaN(size) && size >= this.MIN_FONT_SIZE && size <= this.MAX_FONT_SIZE;
  }

  withFontSize(fontSize: number): Settings {
    if (!Settings.isValidFontSize(fontSize)) {
      return this;
    }
    return new Settings(
      fontSize,
      this.themeName,
      this.apiKey,
      this.modelName,
      this.thinkingSettings
    );
  }

  withThemeName(themeName: ThemeName): Settings {
    if (!Theme.isValidThemeName(themeName)) {
      return this;
    }
    return new Settings(
      this.fontSize,
      themeName,
      this.apiKey,
      this.modelName,
      this.thinkingSettings
    );
  }

  withApiKey(apiKey: string): Settings {
    return new Settings(
      this.fontSize,
      this.themeName,
      apiKey,
      this.modelName,
      this.thinkingSettings
    );
  }

  withModelName(modelName: string): Settings {
    return new Settings(
      this.fontSize,
      this.themeName,
      this.apiKey,
      modelName,
      this.thinkingSettings
    );
  }

  reset(): Settings {
    return Settings.createDefault();
  }

  static createDefaultThinkingSettings(): Record<string, ThinkingModelSettings> {
    return {
      [GEMINI_FLASH_MODEL_ID]: { enabled: false, budget: this.DEFAULT_THINKING_BUDGET },
      [GEMINI_PRO_MODEL_ID]: { enabled: false, level: this.DEFAULT_THINKING_LEVEL },
    };
  }

  get thinkingEnabled(): boolean {
    return Object.values(this.thinkingSettings).some(setting => setting.enabled);
  }

  getThinkingSettingsSnapshot(): Record<string, ThinkingModelSettings> {
    return Settings.cloneThinkingSettings(this.thinkingSettings);
  }

  withThinkingSettingsMap(thinkingSettings: Record<string, ThinkingModelSettings>): Settings {
    return new Settings(
      this.fontSize,
      this.themeName,
      this.apiKey,
      this.modelName,
      thinkingSettings
    );
  }

  getThinkingSettingsForModel(modelName: string): ThinkingModelSettings {
    const settings = this.thinkingSettings[modelName];
    if (settings) {
      return { ...settings };
    }

    return Settings.createDefaultSettingsForModel(modelName);
  }

  private static normalizeThinkingSettings(
    settings: Record<string, ThinkingModelSettings> | undefined
  ): Record<string, ThinkingModelSettings> {
    const normalized: Record<string, ThinkingModelSettings> = {};
    const source = settings ?? {};

    [GEMINI_FLASH_MODEL_ID, GEMINI_PRO_MODEL_ID].forEach(id => {
      normalized[id] = Settings.createNormalizedModelSettings(id, source[id]);
    });

    return normalized;
  }

  private static createNormalizedModelSettings(
    modelId: string,
    existing?: ThinkingModelSettings
  ): ThinkingModelSettings {
    const base = Settings.createDefaultSettingsForModel(modelId);
    if (!existing) {
      return base;
    }

    return {
      enabled: existing.enabled ?? base.enabled,
      budget: BUDGET_MODEL_IDS.has(modelId)
        ? existing.budget ?? base.budget
        : undefined,
      level: !BUDGET_MODEL_IDS.has(modelId)
        ? existing.level ?? base.level ?? this.DEFAULT_THINKING_LEVEL
        : undefined,
    };
  }

  private static createDefaultSettingsForModel(modelId: string): ThinkingModelSettings {
    if (BUDGET_MODEL_IDS.has(modelId)) {
      return {
        enabled: false,
        budget: this.DEFAULT_THINKING_BUDGET,
      };
    }

    return {
      enabled: false,
      level: this.DEFAULT_THINKING_LEVEL,
    };
  }

  private static cloneThinkingSettings(
    settings: Record<string, ThinkingModelSettings>
  ): Record<string, ThinkingModelSettings> {
    return Object.entries(settings).reduce<Record<string, ThinkingModelSettings>>((acc, [key, value]) => {
      acc[key] = { ...value };
      return acc;
    }, {});
  }
}

