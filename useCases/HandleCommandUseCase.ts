import { Settings } from '../domain/Settings';
import { Theme, type ThemeName } from '../domain/Theme';
import { CommandService } from '../services/CommandService';
import { ThemeService } from '../services/ThemeService';
import { ApiKeyService } from '../services/ApiKeyService';
import { MessageService } from '../services/MessageService';
import { Message } from '../domain/Message';

export interface CommandResult {
  success: boolean;
  message?: Message;
  settingsUpdate?: Partial<Settings>;
  shouldClearMessages?: boolean;
  shouldOpenKeySelector?: boolean;
}

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
      case 'font':
        return this.handleFont(args);
      case 'theme':
        return this.handleTheme(args);
      case 'apikey':
        return await this.handleApiKey(args);
      case 'reset':
        return await this.handleReset();
      case 'help':
      case '':
        return this.handleHelp();
      default:
        return this.handleUnknownCommand(command);
    }
  }

  private handleClear(): CommandResult {
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

    const message = MessageService.createSystemMessage(
      `CURRENT SETTINGS:
-----------------
FONT SIZE: ${this.currentSettings.fontSize}px
THEME:     ${this.currentSettings.themeName.toUpperCase()}
API KEY:   ${keyStatus}`
    );

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
      const availableThemes = Theme.getThemeNames().join(', ');
      const message = MessageService.createSystemMessage(
        `Available themes:\n${availableThemes}\n\nUsage: /theme <theme_name>`
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
      },
    };
  }

  private handleHelp(): CommandResult {
    const commands = CommandService.getAllCommands();
    const commandList = commands
      .map(cmd => `  /${cmd.name.padEnd(15, ' ')} - ${cmd.description}`)
      .join('\n');
    
    const message = MessageService.createSystemMessage(
      `Available commands:\n${commandList}`
    );

    return {
      success: true,
      message,
    };
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

