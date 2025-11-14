import { Message } from '../domain/Message';
import { getCurrentTimestamp } from './dateUtils';

export function createInitialMessage(): Message {
  return Message.createSystem(
    '* Google Gemini v1.5 (Flash Edition) *\n* MEMORY: 640K RAM OK *\n* SYSTEM READY. *\n\nAwaiting your command...'
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

