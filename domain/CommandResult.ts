import { Message } from './Message';
import { Settings } from './Settings';

export interface CommandResult {
  success: boolean;
  message?: Message;
  settingsUpdate?: Partial<Settings>;
  shouldClearMessages?: boolean;
  shouldOpenKeySelector?: boolean;
}
