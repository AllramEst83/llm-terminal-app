import type { Message } from './message';

export interface SendMessageResult {
  userMessage: Message;
  onStream: (chunkText: string, isFirstChunk: boolean) => void;
  onComplete: (sources?: Array<{ title: string; uri: string }>) => void;
}

