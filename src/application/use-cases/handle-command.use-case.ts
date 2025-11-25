import {
  Settings,
  GEMINI_FLASH_MODEL_ID,
  GEMINI_PRO_MODEL_ID,
  GEMINI_3_PRO_MODEL_ID,
  type ThinkingModelSettings,
} from '../../domain/entities/settings';
import { Theme, type ThemeName } from '../../domain/entities/theme';
import type { CommandResult } from '../../domain/entities/command-result';
import type { Message } from '../../domain/entities/message';
import { CommandNames } from '../../domain/entities/command';
import { CommandService } from '../../infrastructure/services/command.service';
import { ThemeService } from '../../infrastructure/services/theme.service';
import { ApiKeyService } from '../../infrastructure/services/api-key.service';
import { MessageService } from '../../infrastructure/services/message.service';
import { BrowserInfoService } from '../../infrastructure/services/browser-info.service';
import { generateImage } from '../../infrastructure/services/image.service';
import { TokenCountService } from '../../infrastructure/services/token-count.service';
import { ModelService, type ImageModelDefinition } from '../../infrastructure/services/model.service';
import { GrammarService } from '../../infrastructure/services/grammar.service';
import { SearchService } from '../../infrastructure/services/search.service';

const THINKING_BUDGET_MODEL_IDS = new Set([GEMINI_FLASH_MODEL_ID, GEMINI_PRO_MODEL_ID]);
const THINKING_MODEL_LABELS: Record<string, string> = {
  [GEMINI_FLASH_MODEL_ID]: 'Gemini 2.5 Flash',
  [GEMINI_PRO_MODEL_ID]: 'Gemini 2.5 Pro',
  [GEMINI_3_PRO_MODEL_ID]: 'Gemini 3 Pro Preview',
};
const THINKING_MODEL_SHORTCUTS: Record<string, string> = {
  [GEMINI_FLASH_MODEL_ID]: 'flash',
  [GEMINI_PRO_MODEL_ID]: '2.5-pro',
  [GEMINI_3_PRO_MODEL_ID]: '3-pro',
};
const THINKING_SUPPORTED_MODELS_TEXT = `${THINKING_MODEL_SHORTCUTS[GEMINI_FLASH_MODEL_ID]}, ${THINKING_MODEL_SHORTCUTS[GEMINI_PRO_MODEL_ID]}, ${THINKING_MODEL_SHORTCUTS[GEMINI_3_PRO_MODEL_ID]}`;

export class HandleCommandUseCase {
  constructor(
    private currentSettings: Settings,
    private isStudioEnv: boolean
  ) {}

  async execute(
    command: string,
    args: string[]
  ): Promise<CommandResult> {
    switch (command) {
      case CommandNames.CLEAR:
        return this.handleClear();
      case CommandNames.SETTINGS:
        return this.handleSettings();
      case CommandNames.TOKENS:
        return this.handleTokens();
      case CommandNames.FONT:
        return this.handleFont(args);
      case CommandNames.THEME:
        return this.handleTheme(args);
      case CommandNames.API_KEY:
        return await this.handleApiKey(args);
      case CommandNames.RESET:
        return await this.handleReset();
      case CommandNames.INFO:
        return await this.handleInfo();
      case CommandNames.MODEL:
        return this.handleModel(args);
      case CommandNames.THINK:
        return this.handleThink(args);
      case CommandNames.GRAMMAR:
        return await this.handleGrammar(args);
      case CommandNames.IMAGE:
        return await this.handleImage(args);
      case CommandNames.AUDIO:
        return this.handleAudio(args);
      case CommandNames.SEARCH:
        return await this.handleSearch(args);
      case CommandNames.HELP:
      case '':
        return this.handleHelp();
      default:
        return this.handleUnknownCommand(command);
    }
  }

  private handleClear(): CommandResult {
    TokenCountService.clearTokenUsage();
    
    return {
      success: true,
      shouldClearMessages: true,
    };
  }

  private handleSettings(): CommandResult {
    const keyStatus = this.isStudioEnv
      ? 'Using Studio API Key'
      : (this.currentSettings.apiKey
          ? `Configured (${this.currentSettings.apiKey.substring(0, 8)}...)`
          : 'Not configured');

    const thinkingStatus = this.buildSettingsThinkingSummary();

    const audioStatus = this.currentSettings.audioEnabled ? 'Enabled' : 'Disabled';

    const message = MessageService.createSystemMessage(
      `## CURRENT SETTINGS

- **FONT SIZE:** ${this.currentSettings.fontSize}px
- **THEME:** ${this.currentSettings.themeName.toUpperCase()}
- **MODEL:** ${this.currentSettings.modelName}
- **THINKING:** ${thinkingStatus}
- **AUDIO:** ${audioStatus}
- **API KEY:** ${keyStatus}`
    );

    return {
      success: true,
      message,
    };
  }

  private handleTokens(): CommandResult {
    const usage = TokenCountService.getTokenUsage();
    const formattedUsage = TokenCountService.formatTokenUsage(usage);
    const message = MessageService.createSystemMessage(formattedUsage);

    return {
      success: true,
      message,
    };
  }

  private handleFont(args: string[]): CommandResult {
    const size = parseInt(args[0], 10);
    if (!Settings.isValidFontSize(size)) {
      const message = MessageService.createErrorMessage(
        'SYSTEM ERROR: Invalid font size. Use a number between 8 and 48. (e.g., /font 18)'
      );
      return { success: false, message };
    }

    const message = MessageService.createSystemMessage(
      `SYSTEM: Font size set to ${size}px.`
    );

    return {
      success: true,
      message,
      settingsUpdate: { fontSize: size },
    };
  }

  private handleTheme(args: string[]): CommandResult {
    const requestedTheme = args[0] as ThemeName;
    
    if (!requestedTheme) {
      const allThemes = Theme.getAllThemes();
      const themeList = Object.entries(allThemes)
        .map(([key, theme]) => `- **${key}** - ${theme.name}`)
        .join('\n');
      const message = MessageService.createSystemMessage(
        `Available themes:\n\n${themeList}\n\nUsage: /theme <theme_name>`
      );
      return { success: true, message };
    }

    if (!Theme.isValidThemeName(requestedTheme)) {
      const message = MessageService.createErrorMessage(
        `SYSTEM ERROR: Theme "${requestedTheme}" not found.`
      );
      return { success: false, message };
    }

    const message = MessageService.createSystemMessage(
      `SYSTEM: Theme set to ${requestedTheme.toUpperCase()}.`
    );

    return {
      success: true,
      message,
      settingsUpdate: { themeName: requestedTheme },
    };
  }

  private async handleApiKey(args: string[]): Promise<CommandResult> {
    if (this.isStudioEnv) {
      await ApiKeyService.openKeySelector();
      const message = MessageService.createSystemMessage(
        'SYSTEM: Opening API key selector...'
      );
      return {
        success: true,
        message,
        shouldOpenKeySelector: true,
      };
    }

    const newKey = args.join(' ').trim();
    if (!newKey) {
      const message = MessageService.createErrorMessage(
        'SYSTEM ERROR: No API key provided.\nUsage: /apikey <your_api_key>\n\nYou can get a key from Google AI Studio.'
      );
      return { success: false, message };
    }

    const message = MessageService.createSystemMessage(
      'SYSTEM: API key has been updated successfully.\n\nTry sending a message to verify it works.'
    );

    return {
      success: true,
      message,
      settingsUpdate: { apiKey: newKey },
    };
  }

  private async handleReset(): Promise<CommandResult> {
    const defaultModelName = ModelService.getDefaultModel().id;
    const message = MessageService.createSystemMessage(
      'SYSTEM: All settings have been reset to default.'
    );

    return {
      success: true,
      message,
      settingsUpdate: {
        fontSize: Settings.DEFAULT_FONT_SIZE,
        themeName: Theme.DEFAULT_THEME_NAME,
        apiKey: this.isStudioEnv ? this.currentSettings.apiKey : '',
        modelName: defaultModelName,
        thinkingSettings: Settings.createDefaultThinkingSettings(),
        audioEnabled: true,
      },
    };
  }

  private async handleInfo(): Promise<CommandResult> {
    try {
      const browserInfo = await BrowserInfoService.getBrowserInfo();
      const formattedInfo = BrowserInfoService.formatBrowserInfo(browserInfo);
      const message = MessageService.createSystemMessage(formattedInfo);

      return {
        success: true,
        message,
      };
    } catch (error) {
      const message = MessageService.createErrorMessage(
        'SYSTEM ERROR: Failed to retrieve browser information.'
      );
      return {
        success: false,
        message,
      };
    }
  }

  private handleHelp(): CommandResult {
    const commands = CommandService.getAllCommands();
    const commandList = commands
      .map(cmd => `- \`/${cmd.name}\` - ${cmd.description}`)
      .join('\n');
    
    const message = MessageService.createSystemMessage(
      `Available commands:\n\n${commandList}`
    );

    return {
      success: true,
      message,
    };
  }

  private handleModel(args: string[]): CommandResult {
    const requestedModelRaw = args[0];
    const availableModels = ModelService.listModels();

    if (!requestedModelRaw) {
      const modelList = availableModels
        .map(model => `- **${model.shortLabel}** (${model.id})`)
        .join('\n');
      const shortcuts = availableModels
        .map(model => `- ${model.shortLabel.toLowerCase()} → ${model.id}`)
        .join('\n');
      const message = MessageService.createSystemMessage(
        `Available models:\n\n${modelList}\n\nUsage:\n- /model <model_name>\n\nShortcuts:\n\n${shortcuts}\n\nYou can also provide any Gemini model ID (e.g., gemini-2.0-flash).`
      );
      return { success: true, message };
    }

    const requestedModel = requestedModelRaw.toLowerCase();
    const resolvedModel = ModelService.resolveModel(requestedModel);

    let modelName: string;
    let modelLabel: string;

    if (resolvedModel) {
      modelName = resolvedModel.id;
      modelLabel = resolvedModel.displayName;
    } else if (requestedModel.startsWith('gemini-')) {
      modelName = requestedModelRaw;
      modelLabel = modelName;
    } else {
      const message = MessageService.createErrorMessage(
        `SYSTEM ERROR: Invalid model "${requestedModelRaw}".\n\nUse one of the shortcuts (${availableModels
          .map(model => model.shortLabel.toLowerCase())
          .join(', ')}) or provide a full Gemini model ID.`
      );
      return { success: false, message };
    }

    const message = MessageService.createSystemMessage(
      `SYSTEM: Model set to ${modelLabel}.`
    );

    return {
      success: true,
      message,
      settingsUpdate: { modelName },
    };
  }

  private handleThink(args: string[]): CommandResult {
    if (args.length === 0) {
      const message = MessageService.createSystemMessage(this.buildThinkingStatusMessage());
      return { success: true, message };
    }

    const [modelArgRaw, ...restArgs] = args;
    const canonicalModelId = this.resolveThinkingModel(modelArgRaw);

    if (!canonicalModelId) {
      if (this.looksLikeLegacyThinkingValue(modelArgRaw)) {
        const message = MessageService.createErrorMessage(
          `SYSTEM ERROR: Specify a model before "${modelArgRaw}".\n\nExample: /think 3-pro high`
        );
        return { success: false, message };
      }

      const message = MessageService.createErrorMessage(
        `SYSTEM ERROR: Unsupported thinking model "${modelArgRaw}".\n\nSupported models: ${THINKING_SUPPORTED_MODELS_TEXT}.`
      );
      return { success: false, message };
    }

    const actionArg = restArgs[0];
    if (!actionArg) {
      return this.createThinkUsageResponse(canonicalModelId);
    }

    if (THINKING_BUDGET_MODEL_IDS.has(canonicalModelId)) {
      return this.applyThinkingBudget(actionArg, canonicalModelId);
    }

    return this.applyThinkingLevel(actionArg, canonicalModelId);
  }

  private buildThinkingStatusMessage(): string {
    const flashSection = this.buildBudgetModelStatus(GEMINI_FLASH_MODEL_ID);
    const proSection = this.buildBudgetModelStatus(GEMINI_PRO_MODEL_ID);
    const threeSection = this.buildLevelModelStatus(GEMINI_3_PRO_MODEL_ID);

    return `## CURRENT THINKING SETTINGS

${flashSection}

${proSection}

${threeSection}

- **Notes**
  - Each model stores its own thinking budget or level.
  - Always include the model first: /think <model> <option>.
  - Supported models: ${THINKING_SUPPORTED_MODELS_TEXT}.`;
  }

  private resolveThinkingModel(input?: string): string | undefined {
    if (!input) {
      return undefined;
    }

    const normalized = input.toLowerCase();
    const resolved = ModelService.resolveModel(normalized);
    const candidate =
      resolved?.id ?? (normalized.startsWith('gemini-') ? normalized : undefined);

    if (candidate && (THINKING_BUDGET_MODEL_IDS.has(candidate) || candidate === GEMINI_3_PRO_MODEL_ID)) {
      return candidate;
    }

    return undefined;
  }

  private looksLikeLegacyThinkingValue(value?: string): boolean {
    if (!value) {
      return false;
    }

    const normalized = value.toLowerCase();
    if (normalized === 'on' || normalized === 'off' || normalized === 'low' || normalized === 'high') {
      return true;
    }

    const parsed = parseInt(normalized, 10);
    return !Number.isNaN(parsed);
  }

  private createThinkUsageResponse(modelId: string): CommandResult {
    const label = THINKING_MODEL_LABELS[modelId];
    const usageLines = this.getUsageLines(modelId);
    const usageBlock = usageLines.map(line => `  - ${line}`).join('\n');

    const message = MessageService.createSystemMessage(
      `## THINK COMMAND

- **Model:** ${label}
- **Usage**
${usageBlock}
- **Tip**
  - Always include the model first: /think <model> <option>.
  - Supported models: ${THINKING_SUPPORTED_MODELS_TEXT}.`
    );

    return { success: false, message };
  }

  private buildBudgetModelStatus(modelId: string): string {
    const label = THINKING_MODEL_LABELS[modelId];
    const config = this.currentSettings.getThinkingSettingsForModel(modelId);
    const budgetValue = config.budget ?? Settings.DEFAULT_THINKING_BUDGET;
    const budgetText = this.formatBudgetValue(budgetValue);
    const status = config.enabled ? `Enabled (${budgetText})` : 'Disabled';
    const usageBlock = this.buildUsageBlock(modelId);

    return `${label}
Status: ${status}
Budget: ${budgetText}
Usage:
${usageBlock}`;
  }

  private buildLevelModelStatus(modelId: string): string {
    const label = THINKING_MODEL_LABELS[modelId];
    const config = this.currentSettings.getThinkingSettingsForModel(modelId);
    const levelText = this.formatLevelValue(config.level);
    const status = config.enabled ? `Enabled (${levelText} level)` : 'Disabled';
    const usageBlock = this.buildUsageBlock(modelId);

    return `${label}
Status: ${status},
Thinking level: ${levelText},
Usage:
${usageBlock}`;
  }

  private buildUsageBlock(modelId: string): string {
    return this.getUsageLines(modelId)
      .map(line => `  - ${line}`)
      .join('\n');
  }

  private getUsageLines(modelId: string): string[] {
    const shortcut = THINKING_MODEL_SHORTCUTS[modelId];
    if (THINKING_BUDGET_MODEL_IDS.has(modelId)) {
      return [
        `/think ${shortcut} on - Enable with default budget`,
        `/think ${shortcut} off - Disable thinking`,
        `/think ${shortcut} <tokens> - Enable with custom budget`,
      ];
    }

    return [
      `/think ${shortcut} high - Maximum reasoning depth`,
      `/think ${shortcut} low - Lower latency & cost`,
      `/think ${shortcut} off - Disable thinking`,
    ];
  }

  private updateThinkingSettingsMap(
    modelId: string,
    updater: (current: ThinkingModelSettings) => ThinkingModelSettings
  ): Record<string, ThinkingModelSettings> {
    const snapshot = this.currentSettings.getThinkingSettingsSnapshot();
    const current = this.currentSettings.getThinkingSettingsForModel(modelId);
    snapshot[modelId] = updater(current);
    return snapshot;
  }

  private formatBudgetValue(budget: number): string {
    const formatted = `${budget.toLocaleString()} tokens`;
    return budget === Settings.DEFAULT_THINKING_BUDGET ? `Default (${formatted})` : formatted;
  }

  private formatLevelValue(level?: string): string {
    return (level ?? Settings.DEFAULT_THINKING_LEVEL).toUpperCase();
  }

  private buildSettingsThinkingSummary(): string {
    const flash = this.describeBudgetSummary(GEMINI_FLASH_MODEL_ID);
    const pro = this.describeBudgetSummary(GEMINI_PRO_MODEL_ID);
    const threePro = this.describeLevelSummary(GEMINI_3_PRO_MODEL_ID);
    return `Flash ${flash} | 2.5-Pro ${pro} | 3-Pro ${threePro}`;
  }

  private describeBudgetSummary(modelId: string): string {
    const config = this.currentSettings.getThinkingSettingsForModel(modelId);
    const budget = this.formatBudgetValue(config.budget ?? Settings.DEFAULT_THINKING_BUDGET);
    return config.enabled ? `ON (${budget})` : 'OFF';
  }

  private describeLevelSummary(modelId: string): string {
    const config = this.currentSettings.getThinkingSettingsForModel(modelId);
    const level = this.formatLevelValue(config.level);
    return config.enabled ? `ON (${level})` : 'OFF';
  }

  private applyThinkingBudget(rawArg: string, modelId: string): CommandResult {
    const normalized = rawArg.toLowerCase();
    const label = THINKING_MODEL_LABELS[modelId];

    if (normalized === 'off') {
      const updatedSettings = this.updateThinkingSettingsMap(modelId, current => ({
        ...current,
        enabled: false,
      }));
      const message = MessageService.createSystemMessage(
        `SYSTEM: Thinking disabled for ${label}.`
      );
      return {
        success: true,
        message,
        settingsUpdate: {
          thinkingSettings: updatedSettings,
        },
      };
    }

    if (normalized === 'on') {
      const updatedSettings = this.updateThinkingSettingsMap(modelId, current => ({
        ...current,
        enabled: true,
        budget: current.budget ?? Settings.DEFAULT_THINKING_BUDGET,
      }));
      const message = MessageService.createSystemMessage(
        `SYSTEM: Thinking enabled for ${label} with the default budget.`
      );
      return {
        success: true,
        message,
        settingsUpdate: {
          thinkingSettings: updatedSettings,
        },
      };
    }

    const budget = parseInt(rawArg, 10);
    if (Number.isNaN(budget) || budget <= 0) {
      const message = MessageService.createErrorMessage(
        `SYSTEM ERROR: Invalid thinking budget "${rawArg}".\n\nUse a positive number (e.g., /think ${THINKING_MODEL_SHORTCUTS[modelId]} 5000).`
      );
      return { success: false, message };
    }

    const updatedSettings = this.updateThinkingSettingsMap(modelId, current => ({
      ...current,
      enabled: true,
      budget,
    }));

    const message = MessageService.createSystemMessage(
      `SYSTEM: Thinking enabled for ${label} with a budget of ${budget.toLocaleString()} tokens.`
    );
    return {
      success: true,
      message,
      settingsUpdate: {
        thinkingSettings: updatedSettings,
      },
    };
  }

  private applyThinkingLevel(rawArg: string, modelId: string): CommandResult {
    const normalized = rawArg.toLowerCase();
    const label = THINKING_MODEL_LABELS[modelId];

    if (normalized === 'off') {
      const updatedSettings = this.updateThinkingSettingsMap(modelId, current => ({
        ...current,
        enabled: false,
      }));
      const message = MessageService.createSystemMessage(
        `SYSTEM: Thinking disabled for ${label}.`
      );
      return {
        success: true,
        message,
        settingsUpdate: {
          thinkingSettings: updatedSettings,
        },
      };
    }

    let level: 'low' | 'high' | undefined;
    if (normalized === 'on' || normalized === 'high') {
      level = 'high';
    } else if (normalized === 'low') {
      level = 'low';
    }

    if (!level) {
      const message = MessageService.createErrorMessage(
        `SYSTEM ERROR: Invalid thinking level "${rawArg}".\n\nUse one of: low, high, off.`
      );
      return { success: false, message };
    }

    const updatedSettings = this.updateThinkingSettingsMap(modelId, current => ({
      ...current,
      enabled: true,
      level,
    }));

    const message = MessageService.createSystemMessage(
      `SYSTEM: Thinking enabled for ${label} with ${level.toUpperCase()} reasoning depth.`
    );
    return {
      success: true,
      message,
      settingsUpdate: {
        thinkingSettings: updatedSettings,
      },
    };
  }

  private async handleImage(args: string[]): Promise<CommandResult> {
    const defaultImageModel = ModelService.getDefaultImageModel();
    const imageModels = ModelService.listImageModels();
    const usageMessage = this.buildImageUsageMessage(imageModels, defaultImageModel);

    if (args.length === 0) {
      const message = MessageService.createErrorMessage(
        usageMessage
      );
      return { success: false, message };
    }

    let promptParts: string[] = [];
    let aspectRatio: string = defaultImageModel.defaultAspectRatio;
    let imageModelId: string = defaultImageModel.id;
    let i = 0;

    while (i < args.length) {
      if (args[i] === '--aspect' && i + 1 < args.length) {
        aspectRatio = args[i + 1];
        i += 2;
      } else if (args[i] === '--model' && i + 1 < args.length) {
        const modelArg = args[i + 1];
        const resolvedModel = ModelService.resolveImageModel(modelArg);
        if (resolvedModel) {
          imageModelId = resolvedModel.id;
        } else {
          const message = MessageService.createErrorMessage(
            `Invalid model: "${args[i + 1]}"\n\n${usageMessage}`
          );
          return { success: false, message };
        }
        i += 2;
      } else {
        promptParts.push(args[i]);
        i++;
      }
    }

    const prompt = promptParts.join(' ').trim();
    
    if (!prompt) {
      const message = MessageService.createErrorMessage(usageMessage);
      return { success: false, message };
    }

    const selectedImageModel =
      ModelService.resolveImageModel(imageModelId) ?? defaultImageModel;

    try {
      const apiKey = await ApiKeyService.getApiKey();
      if (!apiKey) {
        const message = MessageService.createErrorMessage(
          'SYSTEM ERROR: API key is missing. Please configure your API key using /apikey <your_key>.'
        );
        return { success: false, message };
      }

      const { imageData, usageMetadata } = await generateImage(
        prompt,
        apiKey,
        aspectRatio,
        imageModelId
      );
      const aspectInfo =
        aspectRatio !== selectedImageModel.defaultAspectRatio ? ` (${aspectRatio})` : '';
      const modelInfo = imageModelId !== defaultImageModel.id ? ` [${imageModelId}]` : '';
      const message = MessageService.createSystemMessage(
        `Generated image for: "${prompt}"${aspectInfo}${modelInfo}`
      ).withImageData(imageData);

      TokenCountService.updateImageModelUsageFromMetadata(imageModelId, usageMetadata);

      return {
        success: true,
        message,
      };
    } catch (error) {
      console.error('Error generating image:', error);
      let errorMessage = 'SYSTEM ERROR: Failed to generate image.';
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('exceeds') && errorMsg.includes('token limit')) {
          const limit = selectedImageModel.inputTokenLimit ?? defaultImageModel.inputTokenLimit ?? 0;
          errorMessage = `SYSTEM ERROR: ${error.message}\n\nThe image prompt is too long. ${selectedImageModel.displayName} has a maximum input limit of ${limit.toLocaleString()} tokens.\n\nPlease shorten your prompt and try again.`;
        } else if (errorMsg.includes('invalid aspect ratio')) {
          const aspectList = selectedImageModel.supportedAspectRatios.join(', ');
          const example = this.getImageModelExamples(selectedImageModel.id)[0] ?? '/image a cat';
          errorMessage = `SYSTEM ERROR: ${error.message}\n\n${selectedImageModel.displayName} supports: ${aspectList}\n\nExample: ${example}`;
        } else if (errorMsg.includes('api key') || errorMsg.includes('permission') || errorMsg.includes('invalid')) {
          errorMessage = `SYSTEM ERROR: ${error.message}\n\nTroubleshooting:\n- Verify your API key is correct\n- Ensure Imagen API is enabled in Google AI Studio\n- Check that your API key has access to image generation\n- Try updating your key: /apikey <your_key>`;
        } else if (errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
          errorMessage = 'SYSTEM ERROR: API quota exceeded or rate limit reached.\n\nPlease try again later.';
        } else if (errorMsg.includes('policy') || errorMsg.includes('violation')) {
          errorMessage = 'SYSTEM ERROR: Content policy violation. Please try a different prompt.';
        } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
          const fallbackModelId =
            imageModels.find(model => model.id !== imageModelId)?.id ?? defaultImageModel.id;
          errorMessage = `SYSTEM ERROR: Image generation API not available.\n\nThe ${selectedImageModel.displayName} API may not be enabled for your API key or may not be available in your region.\n\nPlease check:\n- Enable the image generation API in Google AI Studio\n- Verify your API key has the necessary permissions\n- Try using a different model: /image <prompt> --model ${fallbackModelId}`;
        } else {
          errorMessage = `SYSTEM ERROR: ${error.message}`;
        }
      }

      const message = MessageService.createErrorMessage(errorMessage);
      return {
        success: false,
        message,
      };
    }
  }

  private handleAudio(args: string[]): CommandResult {
    const arg = args[0]?.toLowerCase();
    
    if (!arg) {
      const currentStatus = this.currentSettings.audioEnabled ? 'Enabled' : 'Disabled';
      const message = MessageService.createSystemMessage(
        `Audio effects: ${currentStatus}\n\nUsage:\n  /audio on   - Enable audio effects\n  /audio off  - Disable audio effects`
      );
      return { success: true, message };
    }

    if (arg === 'on') {
      const message = MessageService.createSystemMessage(
        'SYSTEM: Audio effects enabled.'
      );
      return {
        success: true,
        message,
        settingsUpdate: {
          audioEnabled: true,
        },
      };
    } else if (arg === 'off') {
      const message = MessageService.createSystemMessage(
        'SYSTEM: Audio effects disabled.'
      );
      return {
        success: true,
        message,
        settingsUpdate: {
          audioEnabled: false,
        },
      };
    } else {
      const message = MessageService.createErrorMessage(
        `SYSTEM ERROR: Invalid audio setting "${arg}".\n\nUse "on" or "off" (e.g., /audio on).`
      );
      return { success: false, message };
    }
  }

  private async handleSearch(args: string[]): Promise<CommandResult> {
    const query = args.join(' ').trim();
    if (!query) {
      const message = MessageService.createErrorMessage(
        'SYSTEM ERROR: Provide a search query.\nUsage: /search <keywords or question>'
      );
      return { success: false, message };
    }

    try {
      const apiKey = await ApiKeyService.getApiKey();
      if (!apiKey) {
        const message = MessageService.createErrorMessage(
          'SYSTEM ERROR: API key is missing. Configure it with /apikey <your_key>.'
        );
        return { success: false, message };
      }

      const result = await SearchService.performSearch(
        query,
        apiKey,
        this.currentSettings.modelName
      );

      let message = MessageService.createSystemMessage(result.text);
      if (result.sources.length > 0) {
        message = message.withSources(result.sources);
      }

      return {
        success: true,
        message,
      };
    } catch (error) {
      console.error('Error executing search:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unexpected error while searching.';
      const message = MessageService.createErrorMessage(
        `SYSTEM ERROR: Search failed.\n\nDetails: ${errorMessage}`
      );
      return {
        success: false,
        message,
      };
    }
  }

  private buildImageUsageMessage(
    imageModels: ImageModelDefinition[],
    defaultImageModel: ImageModelDefinition
  ): string {
    const modelSections = imageModels
      .map(model => {
        const defaultLabel = model.id === defaultImageModel.id ? ' (default)' : '';
        const aspectList = model.supportedAspectRatios.join(', ');
        const examples = this.getImageModelExamples(model.id);
        const formattedExamples = examples.length
          ? `\n  - Examples:\n${examples.map(example => `    - ${example}`).join('\n')}`
          : '';
        return `- **${model.displayName}** (${model.id}${defaultLabel})\n  - Aspect ratios: ${aspectList}${formattedExamples}`;
      })
      .join('\n');

    return `Usage: /image <prompt> [--aspect <ratio>] [--model <model>]\n\nSupported models:\n${modelSections}`;
  }

  private getImageModelExamples(modelId: string): string[] {
    switch (modelId) {
      case 'nano-banana':
        return [
          '/image a cat',
          '/image a cat --aspect 16:9',
          '/image a cat --model nano-banana',
        ];
      case 'imagen-4.0':
        return [
          '/image a cat --model imagen-4.0',
          '/image a cat --aspect 9:16 --model imagen-4.0',
        ];
      default:
        return ['/image a cat', `/image a cat --model ${modelId}`];
    }
  }

  private handleUnknownCommand(command: string): CommandResult {
    const message = MessageService.createErrorMessage(
      `COMMAND NOT FOUND: /${command}\nType /help for a list of commands.`
    );

    return {
      success: false,
      message,
    };
  }
  private async handleGrammar(args: string[]): Promise<CommandResult> {
    const textToImprove = args.join(' ').trim();

    if (!textToImprove) {
      const message = MessageService.createErrorMessage(
        'SYSTEM ERROR: Provide the text to improve.\nUsage: /grammar <text to improve>'
      );
      return { success: false, message };
    }

    try {
      const apiKey = await ApiKeyService.getApiKey();
      if (!apiKey) {
        const message = MessageService.createErrorMessage(
          'SYSTEM ERROR: API key is missing. Configure it with /apikey <your_key>.'
        );
        return { success: false, message };
      }

      const improved = await GrammarService.improveText(
        textToImprove,
        apiKey,
        this.currentSettings.modelName
      );

      const codeBlock = `\`\`\`\n${improved}\n\`\`\``;
      const message = MessageService.createSystemMessage(
        `GRAMMAR OUTPUT READY:\n\n${codeBlock}`
      );

      return {
        success: true,
        message,
      };
    } catch (error) {
      console.error('Error improving grammar text:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unexpected error while improving text.';
      const message = MessageService.createErrorMessage(
        `SYSTEM ERROR: Unable to improve grammar.\n\nDetails: ${errorMessage}`
      );
      return { success: false, message };
    }
  }
}

