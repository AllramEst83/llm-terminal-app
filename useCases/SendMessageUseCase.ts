import { Message } from '../domain/Message';
import { sendMessageToGemini } from '../services/geminiService';
import { MessageService } from '../services/MessageService';
import { getCurrentTimestamp } from '../utils/dateUtils';

export interface SendMessageResult {
  userMessage: Message;
  onStream: (chunkText: string, isFirstChunk: boolean) => void;
  onComplete: (sources?: Array<{ title: string; uri: string }>) => void;
}

export class SendMessageUseCase {
  constructor(
    private currentMessages: Message[],
    private apiKey: string
  ) {}

  async execute(
    inputText: string,
    onStreamCallback: (chunkText: string, isFirstChunk: boolean) => void,
    onCompleteCallback: (sources?: Array<{ title: string; uri: string }>) => void
  ): Promise<Message> {
    const userMessage = MessageService.createUserMessage(inputText);

    await sendMessageToGemini(
      this.currentMessages,
      inputText,
      this.apiKey,
      (chunkText, isFirstChunk) => {
        onStreamCallback(chunkText, isFirstChunk);
      },
      (sources) => {
        onCompleteCallback(sources);
      }
    );

    return userMessage;
  }
}

