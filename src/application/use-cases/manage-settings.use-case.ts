import { Settings } from '../../domain/entities/settings';
import { SettingsRepository } from '../../infrastructure/repositories/settings.repository';
import { ThemeService } from '../../infrastructure/services/theme.service';

export class ManageSettingsUseCase {
  async loadSettings(): Promise<Settings> {
    return await SettingsRepository.load();
  }

  async saveSettings(settings: Settings): Promise<void> {
    await SettingsRepository.save(settings);
    ThemeService.applyTheme(ThemeService.getTheme(settings.themeName));
  }

  async updateSettings(
    currentSettings: Settings,
    updates: Partial<Settings>
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

    if (updates.thinkingSettings !== undefined) {
      newSettings = newSettings.withThinkingSettingsMap(updates.thinkingSettings);
    }

    if (updates.audioEnabled !== undefined) {
      newSettings = newSettings.withAudioEnabled(updates.audioEnabled);
    }

    await this.saveSettings(newSettings);
    return newSettings;
  }

  async resetSettings(isStudioEnv: boolean): Promise<Settings> {
    const defaultSettings = Settings.createDefault();
    if (isStudioEnv) {
      const currentSettings = await this.loadSettings();
      const resetSettings = defaultSettings.withApiKey(currentSettings.apiKey);
      await this.saveSettings(resetSettings);
      return resetSettings;
    }
    await SettingsRepository.reset();
    return defaultSettings;
  }
}

