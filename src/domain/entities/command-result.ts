import type { Message } from './message';
import type { Settings } from './settings';

export interface CommandResult {
  success: boolean;
  message?: Message;
  settingsUpdate?: Partial<Settings>;
  shouldClearMessages?: boolean;
  shouldOpenKeySelector?: boolean;
}

