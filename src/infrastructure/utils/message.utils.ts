import { Message } from '../../domain/entities/message';
import { getCurrentTimestamp } from './date.utils';

export function createInitialMessage(): Message {
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const buildNumber = import.meta.env.VITE_APP_BUILD || '1';
  
  return Message.createSystem(
    `* Google Gemini v1.5 (Mainframe Edition) *\n* APP VERSION: ${appVersion} (Build ${buildNumber}) *\n* MEMORY: 640K RAM OK *\n* SYSTEM READY. *\n\nAwaiting your command...`
  );
}

export function createInitialMessages(): Message[] {
  return [createInitialMessage()];
}

export function createMessageWithTimestamp(
  role: 'user' | 'model' | 'system',
  text: string
): Message {
  return Message.create(role, text, getCurrentTimestamp());
}

