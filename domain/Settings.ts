import type { ThemeName } from './Theme';
import { Theme } from './Theme';

export class Settings {
  constructor(
    public readonly fontSize: number,
    public readonly themeName: ThemeName,
    public readonly apiKey: string,
    public readonly modelName: string,
    public readonly thinkingEnabled: boolean,
    public readonly thinkingBudget?: number
  ) {}

  static readonly DEFAULT_FONT_SIZE = 16;
  static readonly MIN_FONT_SIZE = 8;
  static readonly MAX_FONT_SIZE = 48;
  static readonly DEFAULT_MODEL_NAME = 'gemini-2.5-flash';
  static readonly DEFAULT_THINKING_BUDGET = 8192;

  static createDefault(): Settings {
    return new Settings(
      this.DEFAULT_FONT_SIZE,
      Theme.DEFAULT_THEME_NAME,
      '',
      this.DEFAULT_MODEL_NAME,
      false,
      undefined
    );
  }

  static isValidFontSize(size: number): boolean {
    return !isNaN(size) && size >= this.MIN_FONT_SIZE && size <= this.MAX_FONT_SIZE;
  }

  withFontSize(fontSize: number): Settings {
    if (!Settings.isValidFontSize(fontSize)) {
      return this;
    }
    return new Settings(fontSize, this.themeName, this.apiKey, this.modelName, this.thinkingEnabled, this.thinkingBudget);
  }

  withThemeName(themeName: ThemeName): Settings {
    if (!Theme.isValidThemeName(themeName)) {
      return this;
    }
    return new Settings(this.fontSize, themeName, this.apiKey, this.modelName, this.thinkingEnabled, this.thinkingBudget);
  }

  withApiKey(apiKey: string): Settings {
    return new Settings(this.fontSize, this.themeName, apiKey, this.modelName, this.thinkingEnabled, this.thinkingBudget);
  }

  withModelName(modelName: string): Settings {
    return new Settings(this.fontSize, this.themeName, this.apiKey, modelName, this.thinkingEnabled, this.thinkingBudget);
  }

  withThinkingEnabled(thinkingEnabled: boolean): Settings {
    return new Settings(this.fontSize, this.themeName, this.apiKey, this.modelName, thinkingEnabled, this.thinkingBudget);
  }

  withThinkingBudget(thinkingBudget: number | undefined): Settings {
    return new Settings(this.fontSize, this.themeName, this.apiKey, this.modelName, this.thinkingEnabled, thinkingBudget);
  }

  reset(): Settings {
    return Settings.createDefault();
  }
}

