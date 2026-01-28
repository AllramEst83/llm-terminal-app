import {
  Settings,
  type ThinkingModelSettings,
  GEMINI_FLASH_MODEL_ID,
  GEMINI_PRO_MODEL_ID,
} from '../../domain/entities/settings';
import { DEFAULT_SESSION_ID } from '../../domain/entities/terminal-session';
import {
  DEFAULT_CUSTOM_SYSTEM_PROMPT,
  DEFAULT_SYSTEM_PROMPT_ID,
  isValidSystemPromptId,
  type SystemPromptId,
} from '../../domain/system.prompts';
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
const SYSTEM_PROMPT_ID_STORAGE_KEY = 'terminal_systemPromptId';
const CUSTOM_SYSTEM_PROMPT_STORAGE_KEY = 'terminal_customSystemPrompt';
const SETTINGS_STORAGE_PREFIX = 'terminal_tab';

function buildScopedKey(tabId: string | undefined, key: string): string {
  if (!tabId) {
    return key;
  }
  return `${SETTINGS_STORAGE_PREFIX}:${tabId}:${key}`;
}

function readScopedValue<T>(
  tabId: string | undefined,
  key: string,
  defaultValue: T,
  allowLegacyFallback: boolean
): T {
  const scopedKey = buildScopedKey(tabId, key);
  const scopedValue = StorageService.getOptional<T>(scopedKey);
  if (scopedValue !== undefined) {
    return scopedValue;
  }
  if (allowLegacyFallback) {
    const legacyValue = StorageService.getOptional<T>(key);
    if (legacyValue !== undefined) {
      return legacyValue;
    }
  }
  return defaultValue;
}

function readScopedString(
  tabId: string | undefined,
  key: string,
  defaultValue: string,
  allowLegacyFallback: boolean
): string {
  const scopedKey = buildScopedKey(tabId, key);
  const scopedValue = StorageService.getStringOptional(scopedKey);
  if (scopedValue !== undefined) {
    return scopedValue;
  }
  if (allowLegacyFallback) {
    const legacyValue = StorageService.getStringOptional(key);
    if (legacyValue !== undefined) {
      return legacyValue;
    }
  }
  return defaultValue;
}

export class SettingsRepository {
  static async load(tabId?: string): Promise<Settings> {
    const allowLegacyFallback = tabId === DEFAULT_SESSION_ID || !tabId;
    const fontSize = readScopedValue<number>(
      tabId,
      FONT_SIZE_STORAGE_KEY,
      Settings.DEFAULT_FONT_SIZE,
      allowLegacyFallback
    );
    const themeName = ThemeService.getSavedThemeName(tabId, allowLegacyFallback);
    const apiKey = await ApiKeyService.getApiKey();
    const defaultModelName = ModelService.getDefaultModel().id;
    const modelName = readScopedString(
      tabId,
      MODEL_NAME_STORAGE_KEY,
      defaultModelName,
      allowLegacyFallback
    );
    const storedThinkingSettings = readScopedValue<Record<string, ThinkingModelSettings> | null>(
      tabId,
      THINKING_SETTINGS_STORAGE_KEY,
      null,
      allowLegacyFallback
    );
    const storedSystemPromptId = readScopedString(
      tabId,
      SYSTEM_PROMPT_ID_STORAGE_KEY,
      DEFAULT_SYSTEM_PROMPT_ID,
      allowLegacyFallback
    );
    const systemPromptId: SystemPromptId = isValidSystemPromptId(storedSystemPromptId)
      ? storedSystemPromptId
      : DEFAULT_SYSTEM_PROMPT_ID;
    const customSystemPrompt = readScopedString(
      tabId,
      CUSTOM_SYSTEM_PROMPT_STORAGE_KEY,
      DEFAULT_CUSTOM_SYSTEM_PROMPT,
      allowLegacyFallback
    );
    let thinkingSettings: Record<string, ThinkingModelSettings>;

    if (storedThinkingSettings) {
      thinkingSettings = storedThinkingSettings;
    } else {
      const legacyThinkingEnabled = allowLegacyFallback
        ? StorageService.get<boolean>(THINKING_ENABLED_STORAGE_KEY, false)
        : false;
      const legacyThinkingBudget = allowLegacyFallback
        ? StorageService.get<number | undefined>(THINKING_BUDGET_STORAGE_KEY, undefined)
        : undefined;
      const legacyThinkingLevel = allowLegacyFallback
        ? StorageService.get(THINKING_LEVEL_STORAGE_KEY, Settings.DEFAULT_THINKING_LEVEL)
        : Settings.DEFAULT_THINKING_LEVEL;

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
      thinkingSettings,
      systemPromptId,
      customSystemPrompt
    );
  }

  static async save(settings: Settings, tabId?: string): Promise<void> {
    const fontSizeSaved = StorageService.set(
      buildScopedKey(tabId, FONT_SIZE_STORAGE_KEY),
      settings.fontSize
    );
    const themeSaved = ThemeService.saveThemeName(settings.themeName, tabId);
    const apiKeySaved = ApiKeyService.setApiKey(settings.apiKey);
    const modelNameSaved = StorageService.set(
      buildScopedKey(tabId, MODEL_NAME_STORAGE_KEY),
      settings.modelName
    );
    const systemPromptIdSaved = StorageService.set(
      buildScopedKey(tabId, SYSTEM_PROMPT_ID_STORAGE_KEY),
      settings.systemPromptId
    );
    const customSystemPromptSaved = StorageService.set(
      buildScopedKey(tabId, CUSTOM_SYSTEM_PROMPT_STORAGE_KEY),
      settings.customSystemPrompt
    );
    const thinkingSettingsSaved = StorageService.set(
      buildScopedKey(tabId, THINKING_SETTINGS_STORAGE_KEY),
      settings.getThinkingSettingsSnapshot()
    );

    if (tabId === DEFAULT_SESSION_ID || !tabId) {
      StorageService.remove(THINKING_ENABLED_STORAGE_KEY);
      StorageService.remove(THINKING_BUDGET_STORAGE_KEY);
      StorageService.remove(THINKING_LEVEL_STORAGE_KEY);
    }
    
    if (
      !fontSizeSaved ||
      !themeSaved ||
      !apiKeySaved ||
      !modelNameSaved ||
      !systemPromptIdSaved ||
      !customSystemPromptSaved ||
      !thinkingSettingsSaved
    ) {
      console.warn('Some settings failed to save to localStorage:', {
        fontSize: fontSizeSaved,
        theme: themeSaved,
        apiKey: apiKeySaved,
        modelName: modelNameSaved,
        systemPromptId: systemPromptIdSaved,
        customSystemPrompt: customSystemPromptSaved,
        thinkingSettings: thinkingSettingsSaved
      });
    } else {
      console.debug('Settings saved successfully to localStorage');
    }
  }

  static async reset(tabId?: string): Promise<Settings> {
    const allowLegacyFallback = tabId === DEFAULT_SESSION_ID || !tabId;
    StorageService.remove(buildScopedKey(tabId, FONT_SIZE_STORAGE_KEY));
    ThemeService.saveThemeName(ThemeService.getDefaultThemeName(), tabId);
    StorageService.remove(buildScopedKey(tabId, MODEL_NAME_STORAGE_KEY));
    StorageService.remove(buildScopedKey(tabId, SYSTEM_PROMPT_ID_STORAGE_KEY));
    StorageService.remove(buildScopedKey(tabId, CUSTOM_SYSTEM_PROMPT_STORAGE_KEY));
    StorageService.remove(buildScopedKey(tabId, THINKING_SETTINGS_STORAGE_KEY));

    if (allowLegacyFallback) {
      StorageService.remove(FONT_SIZE_STORAGE_KEY);
      StorageService.remove(MODEL_NAME_STORAGE_KEY);
      StorageService.remove(SYSTEM_PROMPT_ID_STORAGE_KEY);
      StorageService.remove(CUSTOM_SYSTEM_PROMPT_STORAGE_KEY);
      StorageService.remove(THINKING_SETTINGS_STORAGE_KEY);
      StorageService.remove(THINKING_ENABLED_STORAGE_KEY);
      StorageService.remove(THINKING_BUDGET_STORAGE_KEY);
      StorageService.remove(THINKING_LEVEL_STORAGE_KEY);
    }

    return Settings.createDefault();
  }
}

