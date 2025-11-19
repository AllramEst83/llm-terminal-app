import { Settings } from '../domain/Settings';
import { Theme, type ThemeName } from '../domain/Theme';
import { CommandService } from '../services/CommandService';
import { ThemeService } from '../services/ThemeService';
import { ApiKeyService } from '../services/ApiKeyService';
import { MessageService } from '../services/MessageService';
import { BrowserInfoService } from '../services/BrowserInfoService';
import { generateImage, type ImageModel } from '../services/imageService';
import { Message } from '../domain/Message';
import type { CommandResult } from '../domain/CommandResult';
import { TokenCountService } from '../services/TokenCountService';
import { ModelService } from '../services/ModelService';

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
      case 'clear':
        return this.handleClear();
      case 'settings':
        return this.handleSettings();
      case 'tokens':
        return this.handleTokens();
      case 'font':
        return this.handleFont(args);
      case 'theme':
        return this.handleTheme(args);
      case 'apikey':
        return await this.handleApiKey(args);
      case 'reset':
        return await this.handleReset();
      case 'info':
        return await this.handleInfo();
      case 'model':
        return this.handleModel(args);
      case 'think':
        return this.handleThink(args);
      case 'image':
        return await this.handleImage(args);
      case 'audio':
        return this.handleAudio(args);
      case 'help':
      case '':
        return this.handleHelp();
      default:
        return this.handleUnknownCommand(command);
    }
  }

  private handleClear(): CommandResult {
    // Clear token usage when clearing messages
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

    const thinkingStatus = this.currentSettings.thinkingEnabled
      ? `Enabled${this.currentSettings.thinkingBudget ? ` (${this.currentSettings.thinkingBudget} tokens)` : ' (default budget)'}`
      : 'Disabled';

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
        modelName: Settings.DEFAULT_MODEL_NAME,
        thinkingEnabled: false,
        thinkingBudget: undefined,
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
    const arg = args[0]?.toLowerCase();
    
    if (!arg) {
      const currentStatus = this.currentSettings.thinkingEnabled
        ? `Enabled${this.currentSettings.thinkingBudget ? ` (${this.currentSettings.thinkingBudget} tokens)` : ' (default budget)'}`
        : 'Disabled';
      const message = MessageService.createSystemMessage(
        `Thinking mode: ${currentStatus}\n\nUsage:\n  /think on        - Enable with default budget\n  /think off       - Disable\n  /think <number>  - Enable with custom budget (e.g., /think 5000)`
      );
      return { success: true, message };
    }

    if (arg === 'on') {
      const message = MessageService.createSystemMessage(
        'SYSTEM: Thinking mode enabled with default budget.'
      );
      return {
        success: true,
        message,
        settingsUpdate: {
          thinkingEnabled: true,
          thinkingBudget: undefined,
        },
      };
    } else if (arg === 'off') {
      const message = MessageService.createSystemMessage(
        'SYSTEM: Thinking mode disabled.'
      );
      return {
        success: true,
        message,
        settingsUpdate: {
          thinkingEnabled: false,
          thinkingBudget: undefined,
        },
      };
    } else {
      const budget = parseInt(arg, 10);
      if (isNaN(budget) || budget <= 0) {
        const message = MessageService.createErrorMessage(
          `SYSTEM ERROR: Invalid thinking budget "${arg}".\n\nUse a positive number (e.g., /think 5000).`
        );
        return { success: false, message };
      }

      const message = MessageService.createSystemMessage(
        `SYSTEM: Thinking mode enabled with budget of ${budget} tokens.`
      );
      return {
        success: true,
        message,
        settingsUpdate: {
          thinkingEnabled: true,
          thinkingBudget: budget,
        },
      };
    }
  }

  private async handleImage(args: string[]): Promise<CommandResult> {
    if (args.length === 0) {
      const message = MessageService.createErrorMessage(
        'Usage: /image <prompt> [--aspect <ratio>] [--model <model>]\n\nExamples:\n  /image a cat\n  /image a cat --aspect 16:9\n  /image a cat --model nano-banana\n  /image a cat --aspect 9:16 --model imagen-4.0\n\nSupported aspect ratios: 1:1 (default), 16:9, 9:16, 4:3, 3:4\nSupported models: nano-banana (default), imagen-4.0'
      );
      return { success: false, message };
    }

    // Parse arguments: look for --aspect and --model flags
    let promptParts: string[] = [];
    let aspectRatio = '1:1'; // default
    let imageModel: ImageModel = 'nano-banana'; // default to Nano Banana
    let i = 0;

    while (i < args.length) {
      if (args[i] === '--aspect' && i + 1 < args.length) {
        aspectRatio = args[i + 1];
        i += 2;
      } else if (args[i] === '--model' && i + 1 < args.length) {
        const modelArg = args[i + 1].toLowerCase();
        if (modelArg === 'nano-banana' || modelArg === 'imagen-4.0') {
          imageModel = modelArg as ImageModel;
        } else {
          const message = MessageService.createErrorMessage(
            `Invalid model: "${args[i + 1]}"\n\nSupported models: nano-banana (default), imagen-4.0\n\nExample: /image a cat --model nano-banana`
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
      const message = MessageService.createErrorMessage(
        'Usage: /image <prompt> [--aspect <ratio>] [--model <model>]\n\nExamples:\n  /image a cat\n  /image a cat --aspect 16:9\n  /image a cat --model nano-banana\n\nSupported aspect ratios: 1:1 (default), 16:9, 9:16, 4:3, 3:4\nSupported models: nano-banana (default), imagen-4.0'
      );
      return { success: false, message };
    }

    try {
      const apiKey = await ApiKeyService.getApiKey();
      if (!apiKey) {
        const message = MessageService.createErrorMessage(
          'SYSTEM ERROR: API key is missing. Please configure your API key using /apikey <your_key>.'
        );
        return { success: false, message };
      }

      const { imageData, usageMetadata } = await generateImage(prompt, apiKey, aspectRatio, imageModel);
      const aspectInfo = aspectRatio !== '1:1' ? ` (${aspectRatio})` : '';
      const modelInfo = imageModel !== 'nano-banana' ? ` [${imageModel}]` : '';
      const message = MessageService.createSystemMessage(
        `Generated image for: "${prompt}"${aspectInfo}${modelInfo}`
      ).withImageData(imageData);

      if (imageModel === 'nano-banana') {
        const imageTokenCount =
          usageMetadata?.totalTokenCount ??
          usageMetadata?.promptTokenCount ??
          0;
        TokenCountService.addImageTokens(ModelService.getDefaultModel().id, imageTokenCount);
      }

      return {
        success: true,
        message,
      };
    } catch (error) {
      console.error('Error generating image:', error);
      let errorMessage = 'SYSTEM ERROR: Failed to generate image.';
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('exceeds') && (errorMsg.includes('token limit') || errorMsg.includes('nano banana'))) {
          errorMessage = `SYSTEM ERROR: ${error.message}\n\nThe image prompt is too long. Nano Banana has a maximum input limit of 32,768 tokens.\n\nPlease shorten your prompt and try again.`;
        } else if (errorMsg.includes('invalid aspect ratio')) {
          errorMessage = `SYSTEM ERROR: ${error.message}\n\nSupported aspect ratios: 1:1 (default), 16:9, 9:16, 4:3, 3:4\n\nExample: /image a cat --aspect 16:9`;
        } else if (errorMsg.includes('api key') || errorMsg.includes('permission') || errorMsg.includes('invalid')) {
          errorMessage = `SYSTEM ERROR: ${error.message}\n\nTroubleshooting:\n- Verify your API key is correct\n- Ensure Imagen API is enabled in Google AI Studio\n- Check that your API key has access to image generation\n- Try updating your key: /apikey <your_key>`;
        } else if (errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
          errorMessage = 'SYSTEM ERROR: API quota exceeded or rate limit reached.\n\nPlease try again later.';
        } else if (errorMsg.includes('policy') || errorMsg.includes('violation')) {
          errorMessage = 'SYSTEM ERROR: Content policy violation. Please try a different prompt.';
        } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
          errorMessage = `SYSTEM ERROR: Image generation API not available.\n\nThe ${imageModel === 'nano-banana' ? 'Gemini 2.5 Flash Image (Nano Banana)' : 'Imagen'} API may not be enabled for your API key or may not be available in your region.\n\nPlease check:\n- Enable the image generation API in Google AI Studio\n- Verify your API key has the necessary permissions\n- Try using a different model: /image <prompt> --model ${imageModel === 'nano-banana' ? 'imagen-4.0' : 'nano-banana'}`;
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

  private handleUnknownCommand(command: string): CommandResult {
    const message = MessageService.createErrorMessage(
      `COMMAND NOT FOUND: /${command}\nType /help for a list of commands.`
    );

    return {
      success: false,
      message,
    };
  }
}

