import { Settings } from '../../domain/entities/settings';
import { SettingsRepository } from '../../infrastructure/repositories/settings.repository';
import { ThemeService } from '../../infrastructure/services/theme.service';

interface SaveSettingsOptions {
  applyTheme?: boolean;
}

export class ManageSettingsUseCase {
  constructor(private readonly sessionId?: string) {}

  async loadSettings(): Promise<Settings> {
    return await SettingsRepository.load(this.sessionId);
  }

  async saveSettings(settings: Settings, options: SaveSettingsOptions = {}): Promise<void> {
    const { applyTheme = true } = options;
    await SettingsRepository.save(settings, this.sessionId);
    if (applyTheme) {
      ThemeService.applyTheme(ThemeService.getTheme(settings.themeName));
    }
  }

  async updateSettings(
    currentSettings: Settings,
    updates: Partial<Settings>,
    options: SaveSettingsOptions = {}
  ): Promise<Settings> {
    let newSettings = currentSettings;

    if (updates.fontSize !== undefined) {
      newSettings = newSettings.withFontSize(updates.fontSize);
    }

    if (updates.themeName !== undefined) {
      newSettings = newSettings.withThemeName(updates.themeName);
    }

    if (updates.apiKey !== undefined) {
      newSettings = newSettings.withApiKey(updates.apiKey);
    }

    if (updates.modelName !== undefined) {
      newSettings = newSettings.withModelName(updates.modelName);
    }

    if (updates.systemPromptId !== undefined) {
      newSettings = newSettings.withSystemPromptId(updates.systemPromptId);
    }

    if (updates.customSystemPrompt !== undefined) {
      newSettings = newSettings.withCustomSystemPrompt(updates.customSystemPrompt);
    }

    if (updates.thinkingSettings !== undefined) {
      newSettings = newSettings.withThinkingSettingsMap(updates.thinkingSettings);
    }

    await this.saveSettings(newSettings, options);
    return newSettings;
  }

  async resetSettings(currentSettings: Settings): Promise<Settings> {
    const defaultSettings = Settings.createDefault();
    const resetSettings = defaultSettings.withApiKey(currentSettings.apiKey);
    await SettingsRepository.reset(this.sessionId);
    await this.saveSettings(resetSettings, { applyTheme: false });
    return resetSettings;
  }
}

