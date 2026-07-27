import type { Settings } from '../../../domain/entities/settings';
import type { CommandResult } from '../../../domain/entities/command-result';
import type { Message } from '../../../domain/entities/message';

export interface CommandContext {
  settings: Settings;
  isStudioEnv: boolean;
  sessionId?: string;
  messages?: Message[];
}

export interface ICommandHandler {
  canHandle(command: string): boolean;
  execute(command: string, args: string[], context: CommandContext): Promise<CommandResult>;
}
