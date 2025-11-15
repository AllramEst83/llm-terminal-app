import { Settings } from '../domain/Settings';
import { StorageService } from '../services/StorageService';
import { ThemeService } from '../services/ThemeService';
import { ApiKeyService } from '../services/ApiKeyService';

const FONT_SIZE_STORAGE_KEY = 'terminal_fontSize';
const MODEL_NAME_STORAGE_KEY = 'terminal_modelName';
const THINKING_ENABLED_STORAGE_KEY = 'terminal_thinkingEnabled';
const THINKING_BUDGET_STORAGE_KEY = 'terminal_thinkingBudget';
const AUDIO_ENABLED_STORAGE_KEY = 'terminal_audioEnabled';

export class SettingsRepository {
  static async load(): Promise<Settings> {
    const fontSize = StorageService.get<number>(
      FONT_SIZE_STORAGE_KEY,
      Settings.DEFAULT_FONT_SIZE
    );
    const themeName = ThemeService.getSavedThemeName();
    const apiKey = await ApiKeyService.getApiKey();
    const modelName = StorageService.get<string>(
      MODEL_NAME_STORAGE_KEY,
      Settings.DEFAULT_MODEL_NAME
    );
    const thinkingEnabled = StorageService.get<boolean>(
      THINKING_ENABLED_STORAGE_KEY,
      false
    );
    const thinkingBudget = StorageService.get<number | undefined>(
      THINKING_BUDGET_STORAGE_KEY,
      undefined
    );
    const audioEnabled = StorageService.get<boolean>(
      AUDIO_ENABLED_STORAGE_KEY,
      true
    );

    return new Settings(fontSize, themeName, apiKey, modelName, thinkingEnabled, thinkingBudget, audioEnabled);
  }

  static async save(settings: Settings): Promise<void> {
    const fontSizeSaved = StorageService.set(FONT_SIZE_STORAGE_KEY, settings.fontSize);
    const themeSaved = ThemeService.saveThemeName(settings.themeName);
    const apiKeySaved = ApiKeyService.setApiKey(settings.apiKey);
    const modelNameSaved = StorageService.set(MODEL_NAME_STORAGE_KEY, settings.modelName);
    const thinkingEnabledSaved = StorageService.set(THINKING_ENABLED_STORAGE_KEY, settings.thinkingEnabled);
    const thinkingBudgetSaved = settings.thinkingBudget !== undefined
      ? StorageService.set(THINKING_BUDGET_STORAGE_KEY, settings.thinkingBudget)
      : (StorageService.remove(THINKING_BUDGET_STORAGE_KEY), true);
    const audioEnabledSaved = StorageService.set(AUDIO_ENABLED_STORAGE_KEY, settings.audioEnabled);
    
    if (!fontSizeSaved || !themeSaved || !apiKeySaved || !modelNameSaved || !thinkingEnabledSaved || !thinkingBudgetSaved || !audioEnabledSaved) {
      console.warn('Some settings failed to save to localStorage:', {
        fontSize: fontSizeSaved,
        theme: themeSaved,
        apiKey: apiKeySaved,
        modelName: modelNameSaved,
        thinkingEnabled: thinkingEnabledSaved,
        thinkingBudget: thinkingBudgetSaved,
        audioEnabled: audioEnabledSaved
      });
    } else {
      console.debug('Settings saved successfully to localStorage');
    }
  }

  static async reset(): Promise<Settings> {
    StorageService.remove(FONT_SIZE_STORAGE_KEY);
    ThemeService.saveThemeName(ThemeService.getDefaultThemeName());
    ApiKeyService.removeApiKey();
    StorageService.remove(MODEL_NAME_STORAGE_KEY);
    StorageService.remove(THINKING_ENABLED_STORAGE_KEY);
    StorageService.remove(THINKING_BUDGET_STORAGE_KEY);
    StorageService.remove(AUDIO_ENABLED_STORAGE_KEY);
    return Settings.createDefault();
  }
}

