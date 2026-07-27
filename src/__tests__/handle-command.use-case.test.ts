import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HandleCommandUseCase } from '../application/use-cases/handle-command.use-case';
import { Settings, GEMINI_FLASH_MODEL_ID, GEMINI_PRO_MODEL_ID } from '../domain/entities/settings';
import { CommandNames } from '../domain/entities/command';

vi.mock('../infrastructure/services/api-key.service', () => ({
  ApiKeyService: {
    getApiKey: vi.fn().mockResolvedValue('test-key'),
    openKeySelector: vi.fn().mockResolvedValue(undefined),
    removeApiKey: vi.fn(),
    getEnvApiKey: vi.fn().mockReturnValue(''),
    isStudioEnvironment: vi.fn().mockReturnValue(false),
  },
}));

vi.mock('../infrastructure/services/browser-info.service', () => ({
  BrowserInfoService: {
    getBrowserInfo: vi.fn().mockResolvedValue({
      userAgent: 'test-agent',
      platform: 'test-platform',
    }),
    formatBrowserInfo: vi.fn().mockReturnValue('Browser: test-agent'),
  },
}));

vi.mock('../infrastructure/services/image.service', () => ({
  generateImage: vi.fn().mockResolvedValue({
    imageData: 'base64data',
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
  }),
}));

vi.mock('../infrastructure/services/grammar.service', () => ({
  GrammarService: {
    improveText: vi.fn().mockResolvedValue('Improved text'),
  },
}));

vi.mock('../infrastructure/services/search.service', () => ({
  SearchService: {
    performSearch: vi.fn().mockResolvedValue({
      text: 'Search result',
      sources: [{ title: 'Source', uri: 'https://example.com' }],
    }),
  },
}));

describe('HandleCommandUseCase', () => {
  let settings: Settings;

  beforeEach(() => {
    settings = Settings.createDefault().withApiKey('test-key');
    localStorage.clear();
    sessionStorage.clear();
  });

  function createUseCase(overrides?: { settings?: Settings; isStudio?: boolean; sessionId?: string }) {
    return new HandleCommandUseCase(
      overrides?.settings ?? settings,
      overrides?.isStudio ?? false,
      overrides?.sessionId ?? 'test-session'
    );
  }

  describe('/clear', () => {
    it('returns shouldClearMessages', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.CLEAR, []);
      expect(result.success).toBe(true);
      expect(result.shouldClearMessages).toBe(true);
    });
  });

  describe('/settings', () => {
    it('returns current settings as system message', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.SETTINGS, []);
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.message!.text).toContain('CURRENT SETTINGS');
      expect(result.message!.text).toContain('FONT SIZE');
      expect(result.message!.text).toContain('THEME');
    });
  });

  describe('/font', () => {
    it('accepts valid font size', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.FONT, ['20']);
      expect(result.success).toBe(true);
      expect(result.settingsUpdate?.fontSize).toBe(20);
    });

    it('rejects invalid font size', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.FONT, ['999']);
      expect(result.success).toBe(false);
      expect(result.message!.text).toContain('SYSTEM ERROR');
    });

    it('rejects non-numeric font size', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.FONT, ['abc']);
      expect(result.success).toBe(false);
    });
  });

  describe('/theme', () => {
    it('lists themes when no argument', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.THEME, []);
      expect(result.success).toBe(true);
      expect(result.message!.text).toContain('Available themes');
    });

    it('rejects invalid theme name', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.THEME, ['nonexistent']);
      expect(result.success).toBe(false);
      expect(result.message!.text).toContain('not found');
    });

    it('accepts valid theme name', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.THEME, ['amber']);
      expect(result.success).toBe(true);
      expect(result.settingsUpdate?.themeName).toBe('amber');
    });
  });

  describe('/model', () => {
    it('lists models when no argument', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.MODEL, []);
      expect(result.success).toBe(true);
      expect(result.message!.text).toContain('Available models');
    });

    it('rejects invalid model', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.MODEL, ['invalid-model']);
      expect(result.success).toBe(false);
    });
  });

  describe('/help', () => {
    it('lists all commands', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.HELP, []);
      expect(result.success).toBe(true);
      expect(result.message!.text).toContain('/clear');
      expect(result.message!.text).toContain('/help');
    });
  });

  describe('/about', () => {
    it('returns about text', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.ABOUT, []);
      expect(result.success).toBe(true);
      expect(result.message!.text).toContain('ABOUT');
    });
  });

  describe('/reset', () => {
    it('returns default settings update', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.RESET, []);
      expect(result.success).toBe(true);
      expect(result.settingsUpdate).toBeDefined();
      expect(result.settingsUpdate!.fontSize).toBe(Settings.DEFAULT_FONT_SIZE);
    });
  });

  describe('/think', () => {
    it('shows thinking status when no args', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.THINK, []);
      expect(result.success).toBe(true);
      expect(result.message!.text).toContain('THINKING SETTINGS');
    });

    it('enables flash thinking with budget', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.THINK, ['flash', '5000']);
      expect(result.success).toBe(true);
      expect(result.settingsUpdate?.thinkingSettings?.[GEMINI_FLASH_MODEL_ID].enabled).toBe(true);
      expect(result.settingsUpdate?.thinkingSettings?.[GEMINI_FLASH_MODEL_ID].budget).toBe(5000);
    });

    it('disables flash thinking', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.THINK, ['flash', 'off']);
      expect(result.success).toBe(true);
      expect(result.settingsUpdate?.thinkingSettings?.[GEMINI_FLASH_MODEL_ID].enabled).toBe(false);
    });

    it('sets pro thinking level', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.THINK, ['3-pro', 'high']);
      expect(result.success).toBe(true);
      expect(result.settingsUpdate?.thinkingSettings?.[GEMINI_PRO_MODEL_ID].enabled).toBe(true);
    });

    it('rejects unsupported model', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.THINK, ['unknown-model']);
      expect(result.success).toBe(false);
    });

    it('suggests model-first syntax for legacy values', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.THINK, ['on']);
      expect(result.success).toBe(false);
      expect(result.message!.text).toContain('Specify a model');
    });
  });

  describe('/prompt', () => {
    it('lists prompts when no args', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.PROMPT, []);
      expect(result.success).toBe(true);
      expect(result.message!.text).toContain('Available system prompts');
    });

    it('sets custom prompt', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.PROMPT, ['custom', 'Be', 'very', 'helpful']);
      expect(result.success).toBe(true);
      expect(result.settingsUpdate?.systemPromptId).toBe('custom');
      expect(result.settingsUpdate?.customSystemPrompt).toBe('Be very helpful');
    });
  });

  describe('/search', () => {
    it('requires a query', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.SEARCH, []);
      expect(result.success).toBe(false);
      expect(result.message!.text).toContain('Provide a search query');
    });

    it('performs search and returns result', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.SEARCH, ['test', 'query']);
      expect(result.success).toBe(true);
      expect(result.message!.text).toContain('Search result');
    });
  });

  describe('/grammar', () => {
    it('requires text input', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.GRAMMAR, []);
      expect(result.success).toBe(false);
    });

    it('improves provided text', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.GRAMMAR, ['fix', 'this', 'text']);
      expect(result.success).toBe(true);
      expect(result.message!.text).toContain('Improved text');
    });
  });

  describe('/image', () => {
    it('requires a prompt', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.IMAGE, []);
      expect(result.success).toBe(false);
    });

    it('generates an image from prompt', async () => {
      const uc = createUseCase();
      const result = await uc.execute(CommandNames.IMAGE, ['a', 'cute', 'cat']);
      expect(result.success).toBe(true);
      expect(result.message?.imageData).toBe('base64data');
    });
  });

  describe('unknown command', () => {
    it('returns error for unknown command', async () => {
      const uc = createUseCase();
      const result = await uc.execute('nonexistent', []);
      expect(result.success).toBe(false);
      expect(result.message!.text).toContain('COMMAND NOT FOUND');
    });
  });
});
