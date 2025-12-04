import { Message, MessageType } from '../../domain/entities/message';
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
  const type = role === 'user' ? MessageType.USER : role === 'model' ? MessageType.AI : MessageType.USER;
  return Message.create(role, type, text, getCurrentTimestamp());
}

