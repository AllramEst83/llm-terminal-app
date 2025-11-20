import type { ThemeName } from './Theme';
import { Theme } from './Theme';
import { ModelService } from '../services/ModelService';

export type ThinkingLevel = 'low' | 'high';

export class Settings {
  constructor(
    public readonly fontSize: number,
    public readonly themeName: ThemeName,
    public readonly apiKey: string,
    public readonly modelName: string,
    public readonly thinkingEnabled: boolean,
    public readonly thinkingBudget: number | undefined,
    public readonly thinkingLevel: ThinkingLevel,
    public readonly audioEnabled: boolean = true
  ) {}

  static readonly DEFAULT_FONT_SIZE = 16;
  static readonly MIN_FONT_SIZE = 8;
  static readonly MAX_FONT_SIZE = 48;
  static readonly DEFAULT_MODEL_NAME = ModelService.getDefaultModel().id;
  static readonly DEFAULT_THINKING_BUDGET = 8192;
  static readonly DEFAULT_THINKING_LEVEL: ThinkingLevel = 'high';

  static createDefault(): Settings {
    return new Settings(
      this.DEFAULT_FONT_SIZE,
      Theme.DEFAULT_THEME_NAME,
      '',
      this.DEFAULT_MODEL_NAME,
      false,
      undefined,
      this.DEFAULT_THINKING_LEVEL,
      true
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
      this.thinkingEnabled,
      this.thinkingBudget,
      this.thinkingLevel,
      this.audioEnabled
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
      this.thinkingEnabled,
      this.thinkingBudget,
      this.thinkingLevel,
      this.audioEnabled
    );
  }

  withApiKey(apiKey: string): Settings {
    return new Settings(
      this.fontSize,
      this.themeName,
      apiKey,
      this.modelName,
      this.thinkingEnabled,
      this.thinkingBudget,
      this.thinkingLevel,
      this.audioEnabled
    );
  }

  withModelName(modelName: string): Settings {
    return new Settings(
      this.fontSize,
      this.themeName,
      this.apiKey,
      modelName,
      this.thinkingEnabled,
      this.thinkingBudget,
      this.thinkingLevel,
      this.audioEnabled
    );
  }

  withThinkingEnabled(thinkingEnabled: boolean): Settings {
    return new Settings(
      this.fontSize,
      this.themeName,
      this.apiKey,
      this.modelName,
      thinkingEnabled,
      this.thinkingBudget,
      this.thinkingLevel,
      this.audioEnabled
    );
  }

  withThinkingBudget(thinkingBudget: number | undefined): Settings {
    return new Settings(
      this.fontSize,
      this.themeName,
      this.apiKey,
      this.modelName,
      this.thinkingEnabled,
      thinkingBudget,
      this.thinkingLevel,
      this.audioEnabled
    );
  }

  withThinkingLevel(thinkingLevel: ThinkingLevel): Settings {
    return new Settings(
      this.fontSize,
      this.themeName,
      this.apiKey,
      this.modelName,
      this.thinkingEnabled,
      this.thinkingBudget,
      thinkingLevel,
      this.audioEnabled
    );
  }

  withAudioEnabled(audioEnabled: boolean): Settings {
    return new Settings(
      this.fontSize,
      this.themeName,
      this.apiKey,
      this.modelName,
      this.thinkingEnabled,
      this.thinkingBudget,
      this.thinkingLevel,
      audioEnabled
    );
  }

  reset(): Settings {
    return Settings.createDefault();
  }
}

