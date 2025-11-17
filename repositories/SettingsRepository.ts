import { Settings } from '../domain/Settings';
import { StorageService } from '../services/StorageService';
import { ThemeService } from '../services/ThemeService';
import { ApiKeyService } from '../services/ApiKeyService';
import { AuthService } from '../services/AuthService';
import { UserRepository } from './UserRepository';

const FONT_SIZE_STORAGE_KEY = 'terminal_fontSize';
const MODEL_NAME_STORAGE_KEY = 'terminal_modelName';
const THINKING_ENABLED_STORAGE_KEY = 'terminal_thinkingEnabled';
const THINKING_BUDGET_STORAGE_KEY = 'terminal_thinkingBudget';
const AUDIO_ENABLED_STORAGE_KEY = 'terminal_audioEnabled';

export class SettingsRepository {
  static async load(): Promise<Settings> {
    // Check if user is authenticated
    const session = await AuthService.getSession();
    
    // First, try to load from local storage (master)
    let fontSize = StorageService.get<number>(
      FONT_SIZE_STORAGE_KEY,
      null
    );
    const themeName = ThemeService.getSavedThemeName();
    let apiKey = await ApiKeyService.getApiKey();
    let modelName = StorageService.get<string>(
      MODEL_NAME_STORAGE_KEY,
      null
    );
    let thinkingEnabled = StorageService.get<boolean>(
      THINKING_ENABLED_STORAGE_KEY,
      null
    );
    let thinkingBudget = StorageService.get<number | undefined>(
      THINKING_BUDGET_STORAGE_KEY,
      null
    );
    let audioEnabled = StorageService.get<boolean>(
      AUDIO_ENABLED_STORAGE_KEY,
      null
    );

    // If no local storage data and user is authenticated, fetch from database
    if (session && (fontSize === null || modelName === null)) {
      console.log('[SettingsRepository] Loading settings from database for user', session.user.id);
      const userSettings = await UserRepository.loadUserSettings(session.user.id);
      
      if (userSettings) {
        // Use database settings if local storage is empty
        if (fontSize === null) fontSize = userSettings.settings.fontSize;
        if (modelName === null) modelName = userSettings.settings.modelName;
        if (thinkingEnabled === null) thinkingEnabled = userSettings.settings.thinkingEnabled;
        if (thinkingBudget === null) thinkingBudget = userSettings.settings.thinkingBudget;
        if (audioEnabled === null) audioEnabled = userSettings.settings.audioEnabled;
        
        // Load API key from database (never stored in local storage)
        if (!apiKey || apiKey === '') {
          apiKey = userSettings.apiKey;
        }
        
        // Save to local storage to make it the master
        if (fontSize !== null) StorageService.set(FONT_SIZE_STORAGE_KEY, fontSize);
        if (modelName !== null) StorageService.set(MODEL_NAME_STORAGE_KEY, modelName);
        if (thinkingEnabled !== null) StorageService.set(THINKING_ENABLED_STORAGE_KEY, thinkingEnabled);
        if (thinkingBudget !== null) StorageService.set(THINKING_BUDGET_STORAGE_KEY, thinkingBudget);
        if (audioEnabled !== null) StorageService.set(AUDIO_ENABLED_STORAGE_KEY, audioEnabled);
      }
    }

    // Apply defaults if still null
    if (fontSize === null) fontSize = Settings.DEFAULT_FONT_SIZE;
    if (modelName === null) modelName = Settings.DEFAULT_MODEL_NAME;
    if (thinkingEnabled === null) thinkingEnabled = false;
    if (audioEnabled === null) audioEnabled = true;

    return new Settings(fontSize, themeName, apiKey, modelName, thinkingEnabled, thinkingBudget, audioEnabled);
  }

  static async save(settings: Settings): Promise<void> {
    // Save to local storage (master)
    const fontSizeSaved = StorageService.set(FONT_SIZE_STORAGE_KEY, settings.fontSize);
    const themeSaved = ThemeService.saveThemeName(settings.themeName);
    const modelNameSaved = StorageService.set(MODEL_NAME_STORAGE_KEY, settings.modelName);
    const thinkingEnabledSaved = StorageService.set(THINKING_ENABLED_STORAGE_KEY, settings.thinkingEnabled);
    const thinkingBudgetSaved = settings.thinkingBudget !== undefined
      ? StorageService.set(THINKING_BUDGET_STORAGE_KEY, settings.thinkingBudget)
      : (StorageService.remove(THINKING_BUDGET_STORAGE_KEY), true);
    const audioEnabledSaved = StorageService.set(AUDIO_ENABLED_STORAGE_KEY, settings.audioEnabled);
    
    if (!fontSizeSaved || !themeSaved || !modelNameSaved || !thinkingEnabledSaved || !thinkingBudgetSaved || !audioEnabledSaved) {
      console.warn('Some settings failed to save to localStorage:', {
        fontSize: fontSizeSaved,
        theme: themeSaved,
        modelName: modelNameSaved,
        thinkingEnabled: thinkingEnabledSaved,
        thinkingBudget: thinkingBudgetSaved,
        audioEnabled: audioEnabledSaved
      });
    } else {
      console.debug('Settings saved successfully to localStorage');
    }

    // If user is authenticated, sync to database
    const session = await AuthService.getSession();
    if (session) {
      console.log('[SettingsRepository] Syncing settings to database for user', session.user.id);
      try {
        await UserRepository.saveUserSettings(session.user.id, settings, settings.apiKey);
        console.log('[SettingsRepository] Settings synced to database successfully');
      } catch (error) {
        console.error('[SettingsRepository] Failed to sync settings to database:', error);
      }
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

