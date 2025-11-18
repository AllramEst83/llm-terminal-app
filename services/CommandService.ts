import { Command, type CommandDefinition } from '../domain/Command';

export class CommandService {
  static getAllCommands(): CommandDefinition[] {
    return Command.getAllCommands();
  }

  static findCommand(name: string): CommandDefinition | undefined {
    return Command.findCommand(name);
  }

  static findMatchingCommands(prefix: string): CommandDefinition[] {
    return Command.findMatchingCommands(prefix);
  }

  static isCommand(input: string): boolean {
    return Command.isCommand(input);
  }

  static parseCommand(input: string): { command: string; args: string[] } | null {
    return Command.parseCommand(input);
  }
}



