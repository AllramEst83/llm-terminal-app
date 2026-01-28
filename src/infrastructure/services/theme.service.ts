import { Theme, type ThemeName, type ThemeColors } from '../../domain/entities/theme';
import { StorageService } from '../storage/storage.service';
import { applyThemeToDocument } from '../utils/theme.utils';

const THEME_STORAGE_KEY = 'terminal_themeName';
const THEME_STORAGE_PREFIX = 'terminal_tab';

function buildThemeStorageKey(scopeId?: string): string {
  if (!scopeId) {
    return THEME_STORAGE_KEY;
  }
  return `${THEME_STORAGE_PREFIX}:${scopeId}:${THEME_STORAGE_KEY}`;
}

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

  static getSavedThemeName(scopeId?: string, allowLegacyFallback: boolean = false): ThemeName {
    try {
      const scopedKey = buildThemeStorageKey(scopeId);
      const saved = StorageService.getStringOptional(scopedKey);
      if (saved && Theme.isValidThemeName(saved)) {
        return saved;
      }

      if (allowLegacyFallback && scopeId) {
        const legacySaved = StorageService.getStringOptional(THEME_STORAGE_KEY);
        if (legacySaved && Theme.isValidThemeName(legacySaved)) {
          return legacySaved;
        }
      }

      if (!scopeId) {
        const fallback = StorageService.getStringOptional(THEME_STORAGE_KEY);
        if (fallback && Theme.isValidThemeName(fallback)) {
          return fallback;
        }
      }
    } catch {
      // Fall through to default
    }
    return Theme.DEFAULT_THEME_NAME;
  }

  static saveThemeName(themeName: ThemeName, scopeId?: string): boolean {
    return StorageService.setString(buildThemeStorageKey(scopeId), themeName);
  }

  static removeSavedThemeName(scopeId?: string): void {
    StorageService.remove(buildThemeStorageKey(scopeId));
  }

  static applyTheme(theme: ThemeColors): void {
    applyThemeToDocument(theme);
  }
}

