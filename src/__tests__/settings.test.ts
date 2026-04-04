import { describe, it, expect } from 'vitest';
import { Settings, GEMINI_FLASH_MODEL_ID, GEMINI_PRO_MODEL_ID } from '../domain/entities/settings';

describe('Settings', () => {
  describe('createDefault', () => {
    it('creates settings with default values', () => {
      const settings = Settings.createDefault();
      expect(settings.fontSize).toBe(16);
      expect(settings.apiKey).toBe('');
      expect(settings.modelName).toBe('gemini-3-flash-preview');
      expect(settings.systemPromptId).toBe('retro-terminal');
    });
  });

  describe('isValidFontSize', () => {
    it('accepts sizes in range', () => {
      expect(Settings.isValidFontSize(8)).toBe(true);
      expect(Settings.isValidFontSize(16)).toBe(true);
      expect(Settings.isValidFontSize(48)).toBe(true);
    });

    it('rejects sizes out of range', () => {
      expect(Settings.isValidFontSize(7)).toBe(false);
      expect(Settings.isValidFontSize(49)).toBe(false);
      expect(Settings.isValidFontSize(NaN)).toBe(false);
    });
  });

  describe('immutable updates', () => {
    it('withFontSize creates a new instance', () => {
      const original = Settings.createDefault();
      const updated = original.withFontSize(20);
      expect(updated.fontSize).toBe(20);
      expect(original.fontSize).toBe(16);
    });

    it('withFontSize returns same instance for invalid size', () => {
      const original = Settings.createDefault();
      const same = original.withFontSize(999);
      expect(same).toBe(original);
    });

    it('withApiKey creates a new instance', () => {
      const original = Settings.createDefault();
      const updated = original.withApiKey('test-key');
      expect(updated.apiKey).toBe('test-key');
      expect(original.apiKey).toBe('');
    });

    it('withModelName creates a new instance', () => {
      const original = Settings.createDefault();
      const updated = original.withModelName('gemini-pro');
      expect(updated.modelName).toBe('gemini-pro');
    });

    it('withSystemPromptId creates a new instance', () => {
      const original = Settings.createDefault();
      const updated = original.withSystemPromptId('custom');
      expect(updated.systemPromptId).toBe('custom');
    });

    it('withCustomSystemPrompt creates a new instance', () => {
      const original = Settings.createDefault();
      const updated = original.withCustomSystemPrompt('Be helpful');
      expect(updated.customSystemPrompt).toBe('Be helpful');
    });
  });

  describe('thinking settings', () => {
    it('createDefaultThinkingSettings returns settings for both models', () => {
      const defaults = Settings.createDefaultThinkingSettings();
      expect(defaults[GEMINI_FLASH_MODEL_ID]).toBeDefined();
      expect(defaults[GEMINI_PRO_MODEL_ID]).toBeDefined();
      expect(defaults[GEMINI_FLASH_MODEL_ID].enabled).toBe(false);
      expect(defaults[GEMINI_PRO_MODEL_ID].enabled).toBe(false);
    });

    it('flash model has budget, pro model has level', () => {
      const defaults = Settings.createDefaultThinkingSettings();
      expect(defaults[GEMINI_FLASH_MODEL_ID].budget).toBe(8192);
      expect(defaults[GEMINI_PRO_MODEL_ID].level).toBe('high');
    });

    it('getThinkingSettingsForModel returns correct settings', () => {
      const settings = Settings.createDefault();
      const flash = settings.getThinkingSettingsForModel(GEMINI_FLASH_MODEL_ID);
      expect(flash.enabled).toBe(false);
      expect(flash.budget).toBe(8192);
    });

    it('getThinkingSettingsForModel returns defaults for unknown model', () => {
      const settings = Settings.createDefault();
      const unknown = settings.getThinkingSettingsForModel('unknown-model');
      expect(unknown.enabled).toBe(false);
    });

    it('withThinkingSettingsMap creates new instance', () => {
      const original = Settings.createDefault();
      const newThinking = {
        [GEMINI_FLASH_MODEL_ID]: { enabled: true, budget: 4096 },
        [GEMINI_PRO_MODEL_ID]: { enabled: true, level: 'low' as const },
      };
      const updated = original.withThinkingSettingsMap(newThinking);
      expect(updated.getThinkingSettingsForModel(GEMINI_FLASH_MODEL_ID).enabled).toBe(true);
      expect(updated.getThinkingSettingsForModel(GEMINI_FLASH_MODEL_ID).budget).toBe(4096);
      expect(original.getThinkingSettingsForModel(GEMINI_FLASH_MODEL_ID).enabled).toBe(false);
    });

    it('getThinkingSettingsSnapshot returns a deep copy', () => {
      const settings = Settings.createDefault();
      const snapshot = settings.getThinkingSettingsSnapshot();
      snapshot[GEMINI_FLASH_MODEL_ID].enabled = true;
      expect(settings.getThinkingSettingsForModel(GEMINI_FLASH_MODEL_ID).enabled).toBe(false);
    });
  });

  describe('thinkingEnabled getter', () => {
    it('returns false when no models have thinking enabled', () => {
      const settings = Settings.createDefault();
      expect(settings.thinkingEnabled).toBe(false);
    });

    it('returns true when any model has thinking enabled', () => {
      const settings = Settings.createDefault().withThinkingSettingsMap({
        [GEMINI_FLASH_MODEL_ID]: { enabled: true, budget: 8192 },
        [GEMINI_PRO_MODEL_ID]: { enabled: false, level: 'high' },
      });
      expect(settings.thinkingEnabled).toBe(true);
    });
  });
});
