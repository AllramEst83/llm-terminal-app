import type { ThemeName } from './Theme';
import { Theme } from './Theme';

export class Settings {
  constructor(
    public readonly fontSize: number,
    public readonly themeName: ThemeName,
    public readonly apiKey: string
  ) {}

  static readonly DEFAULT_FONT_SIZE = 16;
  static readonly MIN_FONT_SIZE = 8;
  static readonly MAX_FONT_SIZE = 48;

  static createDefault(): Settings {
    return new Settings(
      this.DEFAULT_FONT_SIZE,
      Theme.DEFAULT_THEME_NAME,
      ''
    );
  }

  static isValidFontSize(size: number): boolean {
    return !isNaN(size) && size >= this.MIN_FONT_SIZE && size <= this.MAX_FONT_SIZE;
  }

  withFontSize(fontSize: number): Settings {
    if (!Settings.isValidFontSize(fontSize)) {
      return this;
    }
    return new Settings(fontSize, this.themeName, this.apiKey);
  }

  withThemeName(themeName: ThemeName): Settings {
    if (!Theme.isValidThemeName(themeName)) {
      return this;
    }
    return new Settings(this.fontSize, themeName, this.apiKey);
  }

  withApiKey(apiKey: string): Settings {
    return new Settings(this.fontSize, this.themeName, apiKey);
  }

  reset(): Settings {
    return Settings.createDefault();
  }
}

