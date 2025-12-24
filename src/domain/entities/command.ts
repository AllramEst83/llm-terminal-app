export const CommandNames = {
  CLEAR: 'clear',
  SEARCH: 'search',
  SETTINGS: 'settings',
  TOKENS: 'tokens',
  FONT: 'font',
  THEME: 'theme',
  API_KEY: 'apikey',
  RESET: 'reset',
  INFO: 'info',
  MODEL: 'model',
  THINK: 'think',
  GRAMMAR: 'grammar',
  IMAGE: 'image',
  AUDIO: 'audio',
  HELP: 'help',
} as const;

export type CommandName = typeof CommandNames[keyof typeof CommandNames];

export interface CommandDefinition {
  name: CommandName;
  description: string;
}

const COMMANDS: CommandDefinition[] = [
  { name: CommandNames.CLEAR, description: 'Clears the terminal screen.' },
  { name: CommandNames.SEARCH, description: 'Searches the web (e.g., /search latest news).' },
  { name: CommandNames.SETTINGS, description: 'Displays current settings.' },
  { name: CommandNames.TOKENS, description: 'Shows token usage for the current session grouped by model.' },
  { name: CommandNames.FONT, description: 'Sets font size (e.g., /font 18).' },
  { name: CommandNames.THEME, description: 'Changes color scheme (e.g., /theme amber).' },
  { name: CommandNames.API_KEY, description: 'Sets or updates the API key (e.g., /apikey <your_key>).' },
  { name: CommandNames.RESET, description: 'Resets all settings to their default values.' },
  { name: CommandNames.INFO, description: 'Displays browser and system information.' },
  { name: CommandNames.MODEL, description: 'Switch between models (e.g., /model pro or /model flash).' },
  { name: CommandNames.THINK, description: 'Configure thinking per model (e.g., /think flash 5000, /think 3-pro high).' },
  { name: CommandNames.GRAMMAR, description: 'Fix grammar and slightly improve provided text.' },
  { name: CommandNames.IMAGE, description: 'Generates an image from a prompt using Gemini 3 Pro Image Preview (e.g., /image a cat [--aspect 16:9] [--model gemini-3-pro-image-preview]).' },
  { name: CommandNames.AUDIO, description: 'Toggle audio effects (e.g., /audio on, /audio off).' },
  { name: CommandNames.HELP, description: 'Shows this list of commands.' },
];

export class Command {
  static readonly COMMANDS: CommandDefinition[] = COMMANDS;

  static getAllCommands(): CommandDefinition[] {
    return [...this.COMMANDS];
  }

  static findCommand(name: string): CommandDefinition | undefined {
    return this.COMMANDS.find(cmd => cmd.name === name);
  }

  static findMatchingCommands(prefix: string): CommandDefinition[] {
    const lowerPrefix = prefix.toLowerCase();
    return this.COMMANDS.filter(cmd => 
      cmd.name.toLowerCase().startsWith(lowerPrefix)
    );
  }

  static isCommand(input: string): boolean {
    return input.trim().startsWith('/');
  }

  static parseCommand(input: string): { command: string; args: string[] } | null {
    if (!this.isCommand(input)) {
      return null;
    }

    const parts = input.substring(1).trim().split(/\s+/);
    return {
      command: parts[0]?.toLowerCase() || '',
      args: parts.slice(1),
    };
  }
}

