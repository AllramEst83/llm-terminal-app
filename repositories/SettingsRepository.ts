import { Settings, type ThinkingModelSettings, GEMINI_FLASH_MODEL_ID, GEMINI_PRO_MODEL_ID, GEMINI_3_PRO_MODEL_ID } from '../domain/Settings';
import { StorageService } from '../services/StorageService';
import { ThemeService } from '../services/ThemeService';
import { ApiKeyService } from '../services/ApiKeyService';

const FONT_SIZE_STORAGE_KEY = 'terminal_fontSize';
const MODEL_NAME_STORAGE_KEY = 'terminal_modelName';
const THINKING_SETTINGS_STORAGE_KEY = 'terminal_thinkingSettings';
const THINKING_ENABLED_STORAGE_KEY = 'terminal_thinkingEnabled';
const THINKING_BUDGET_STORAGE_KEY = 'terminal_thinkingBudget';
const THINKING_LEVEL_STORAGE_KEY = 'terminal_thinkingLevel';
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
        thinkingSettings[GEMINI_3_PRO_MODEL_ID] = {
          ...thinkingSettings[GEMINI_3_PRO_MODEL_ID],
          level: legacyThinkingLevel,
        };
      }

      if (legacyThinkingEnabled) {
        thinkingSettings[GEMINI_FLASH_MODEL_ID].enabled = true;
        thinkingSettings[GEMINI_PRO_MODEL_ID].enabled = true;
        thinkingSettings[GEMINI_3_PRO_MODEL_ID].enabled = true;
      }
    }
    const audioEnabled = StorageService.get<boolean>(
      AUDIO_ENABLED_STORAGE_KEY,
      true
    );

    return new Settings(
      fontSize,
      themeName,
      apiKey,
      modelName,
      thinkingSettings,
      audioEnabled
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
    const audioEnabledSaved = StorageService.set(AUDIO_ENABLED_STORAGE_KEY, settings.audioEnabled);
    
    if (!fontSizeSaved || !themeSaved || !apiKeySaved || !modelNameSaved || !thinkingSettingsSaved || !audioEnabledSaved) {
      console.warn('Some settings failed to save to localStorage:', {
        fontSize: fontSizeSaved,
        theme: themeSaved,
        apiKey: apiKeySaved,
        modelName: modelNameSaved,
        thinkingSettings: thinkingSettingsSaved,
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
    StorageService.remove(THINKING_SETTINGS_STORAGE_KEY);
    StorageService.remove(THINKING_ENABLED_STORAGE_KEY);
    StorageService.remove(THINKING_BUDGET_STORAGE_KEY);
    StorageService.remove(THINKING_LEVEL_STORAGE_KEY);
    StorageService.remove(AUDIO_ENABLED_STORAGE_KEY);
    return Settings.createDefault();
  }
}

