import { Settings, type ThinkingModelSettings, GEMINI_FLASH_MODEL_ID, GEMINI_PRO_MODEL_ID } from '../../domain/entities/settings';
import { StorageService } from '../storage/storage.service';
import { ThemeService } from '../services/theme.service';
import { ApiKeyService } from '../services/api-key.service';
import { ModelService } from '../services/model.service';

const FONT_SIZE_STORAGE_KEY = 'terminal_fontSize';
const MODEL_NAME_STORAGE_KEY = 'terminal_modelName';
const THINKING_SETTINGS_STORAGE_KEY = 'terminal_thinkingSettings';
const THINKING_ENABLED_STORAGE_KEY = 'terminal_thinkingEnabled';
const THINKING_BUDGET_STORAGE_KEY = 'terminal_thinkingBudget';
const THINKING_LEVEL_STORAGE_KEY = 'terminal_thinkingLevel';

export class SettingsRepository {
  static async load(): Promise<Settings> {
    const fontSize = StorageService.get<number>(
      FONT_SIZE_STORAGE_KEY,
      Settings.DEFAULT_FONT_SIZE
    );
    const themeName = ThemeService.getSavedThemeName();
    const apiKey = await ApiKeyService.getApiKey();
    const defaultModelName = ModelService.getDefaultModel().id;
    const modelName = StorageService.get<string>(
      MODEL_NAME_STORAGE_KEY,
      defaultModelName
    );
    const storedThinkingSettings = StorageService.get<Record<string, ThinkingModelSettings> | null>(
      THINKING_SETTINGS_STORAGE_KEY,
      null
    );
    let thinkingSettings: Record<string, ThinkingModelSettings>;

    if (storedThinkingSettings) {
      thinkingSettings = storedThinkingSettings;
    } else {
      const legacyThinkingEnabled = StorageService.get<boolean>(
        THINKING_ENABLED_STORAGE_KEY,
        false
      );
      const legacyThinkingBudget = StorageService.get<number | undefined>(
        THINKING_BUDGET_STORAGE_KEY,
        undefined
      );
      const legacyThinkingLevel = StorageService.get(
        THINKING_LEVEL_STORAGE_KEY,
        Settings.DEFAULT_THINKING_LEVEL
      );

      thinkingSettings = Settings.createDefaultThinkingSettings();

      if (legacyThinkingBudget !== undefined) {
        thinkingSettings[GEMINI_FLASH_MODEL_ID] = {
          ...thinkingSettings[GEMINI_FLASH_MODEL_ID],
          budget: legacyThinkingBudget,
        };
        thinkingSettings[GEMINI_PRO_MODEL_ID] = {
          ...thinkingSettings[GEMINI_PRO_MODEL_ID],
          budget: legacyThinkingBudget,
        };
      }

      if (legacyThinkingLevel) {
        thinkingSettings[GEMINI_PRO_MODEL_ID] = {
          ...thinkingSettings[GEMINI_PRO_MODEL_ID],
          level: legacyThinkingLevel,
        };
      }

      if (legacyThinkingEnabled) {
        thinkingSettings[GEMINI_FLASH_MODEL_ID].enabled = true;
        thinkingSettings[GEMINI_PRO_MODEL_ID].enabled = true;
      }
    }
    return new Settings(
      fontSize,
      themeName,
      apiKey,
      modelName,
      thinkingSettings
    );
  }

  static async save(settings: Settings): Promise<void> {
    const fontSizeSaved = StorageService.set(FONT_SIZE_STORAGE_KEY, settings.fontSize);
    const themeSaved = ThemeService.saveThemeName(settings.themeName);
    const apiKeySaved = ApiKeyService.setApiKey(settings.apiKey);
    const modelNameSaved = StorageService.set(MODEL_NAME_STORAGE_KEY, settings.modelName);
    const thinkingSettingsSaved = StorageService.set(
      THINKING_SETTINGS_STORAGE_KEY,
      settings.getThinkingSettingsSnapshot()
    );
    StorageService.remove(THINKING_ENABLED_STORAGE_KEY);
    StorageService.remove(THINKING_BUDGET_STORAGE_KEY);
    StorageService.remove(THINKING_LEVEL_STORAGE_KEY);
    
    if (!fontSizeSaved || !themeSaved || !apiKeySaved || !modelNameSaved || !thinkingSettingsSaved) {
      console.warn('Some settings failed to save to localStorage:', {
        fontSize: fontSizeSaved,
        theme: themeSaved,
        apiKey: apiKeySaved,
        modelName: modelNameSaved,
        thinkingSettings: thinkingSettingsSaved
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
    StorageService.remove(THINKING_SETTINGS_STORAGE_KEY);
    StorageService.remove(THINKING_ENABLED_STORAGE_KEY);
    StorageService.remove(THINKING_BUDGET_STORAGE_KEY);
    StorageService.remove(THINKING_LEVEL_STORAGE_KEY);
    return Settings.createDefault();
  }
}

