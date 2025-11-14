import { Settings } from '../domain/Settings';
import { StorageService } from '../services/StorageService';
import { ThemeService } from '../services/ThemeService';
import { ApiKeyService } from '../services/ApiKeyService';

const FONT_SIZE_STORAGE_KEY = 'terminal_fontSize';

export class SettingsRepository {
  static async load(): Promise<Settings> {
    const fontSize = StorageService.get<number>(
      FONT_SIZE_STORAGE_KEY,
      Settings.DEFAULT_FONT_SIZE
    );
    const themeName = ThemeService.getSavedThemeName();
    const apiKey = await ApiKeyService.getApiKey();

    return new Settings(fontSize, themeName, apiKey);
  }

  static async save(settings: Settings): Promise<void> {
    const fontSizeSaved = StorageService.set(FONT_SIZE_STORAGE_KEY, settings.fontSize);
    const themeSaved = ThemeService.saveThemeName(settings.themeName);
    const apiKeySaved = ApiKeyService.setApiKey(settings.apiKey);
    
    if (!fontSizeSaved || !themeSaved || !apiKeySaved) {
      console.warn('Some settings failed to save to localStorage:', {
        fontSize: fontSizeSaved,
        theme: themeSaved,
        apiKey: apiKeySaved
      });
    } else {
      console.debug('Settings saved successfully to localStorage');
    }
  }

  static async reset(): Promise<Settings> {
    StorageService.remove(FONT_SIZE_STORAGE_KEY);
    ThemeService.saveThemeName(ThemeService.getDefaultThemeName());
    ApiKeyService.removeApiKey();
    return Settings.createDefault();
  }
}

