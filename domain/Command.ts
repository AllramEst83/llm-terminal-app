export interface CommandDefinition {
  name: string;
  description: string;
}

export class Command {
  static readonly COMMANDS: CommandDefinition[] = [
    { name: 'clear', description: 'Clears the terminal screen.' },
    { name: 'search', description: 'Searches the web (e.g., /search latest news).' },
    { name: 'settings', description: 'Displays current settings.' },
    { name: 'tokens', description: 'Shows token usage for the current session grouped by model.' },
    { name: 'font', description: 'Sets font size (e.g., /font 18).' },
    { name: 'theme', description: 'Changes color scheme (e.g., /theme amber).' },
    { name: 'apikey', description: 'Sets or updates the API key (e.g., /apikey <your_key>).' },
    { name: 'reset', description: 'Resets all settings to their default values.' },
    { name: 'info', description: 'Displays browser and system information.' },
    { name: 'model', description: 'Switch between models (e.g., /model pro or /model flash).' },
    { name: 'think', description: 'Enable thinking mode (e.g., /think on, /think off, /think 5000).' },
    { name: 'image', description: 'Generates an image from a prompt using Nano Banana (default) or Imagen 4.0 (e.g., /image a cat [--aspect 16:9] [--model nano-banana]).' },
    { name: 'audio', description: 'Toggle audio effects (e.g., /audio on, /audio off).' },
    { name: 'help', description: 'Shows this list of commands.' },
  ];

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

