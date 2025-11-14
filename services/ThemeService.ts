import { Theme, type ThemeName, type ThemeColors } from '../domain/Theme';
import { StorageService } from './StorageService';
import { applyThemeToDocument } from '../utils/themeUtils';

const THEME_STORAGE_KEY = 'terminal_themeName';

export class ThemeService {
  static getDefaultThemeName(): ThemeName {
    return Theme.DEFAULT_THEME_NAME;
  }

  static getTheme(name: ThemeName): ThemeColors {
    return Theme.getTheme(name);
  }

  static getDefaultTheme(): ThemeColors {
    return Theme.getDefaultTheme();
  }

  static getAllThemes(): Record<ThemeName, ThemeColors> {
    return Theme.getAllThemes();
  }

  static isValidThemeName(name: string): name is ThemeName {
    return Theme.isValidThemeName(name);
  }

  static getSavedThemeName(): ThemeName {
    try {
      const saved = StorageService.getString(THEME_STORAGE_KEY, '');
      if (saved && Theme.isValidThemeName(saved)) {
        return saved;
      }
    } catch {
      // Fall through to default
    }
    return Theme.DEFAULT_THEME_NAME;
  }

  static saveThemeName(themeName: ThemeName): boolean {
    return StorageService.setString(THEME_STORAGE_KEY, themeName);
  }

  static applyTheme(theme: ThemeColors): void {
    applyThemeToDocument(theme);
  }
}

