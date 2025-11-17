import { Message } from '../domain/Message';
import { Settings } from '../domain/Settings';
import { sendMessageToGemini } from '../services/geminiService';
import { MessageService } from '../services/MessageService';
import { getCurrentTimestamp } from '../utils/dateUtils';
import { TokenCountService } from '../services/TokenCountService';
export class SendMessageUseCase {
  constructor(
    private currentMessages: Message[],
    private settings: Settings,
    private onTokenCountUpdate?: (inputTokens: number) => void
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
      this.settings.apiKey,
      this.settings.modelName,
      this.settings.thinkingEnabled,
      this.settings.thinkingBudget,
      (chunkText, isFirstChunk) => {
        onStreamCallback(chunkText, isFirstChunk);
      },
      async (sources, usageMetadata) => {
        TokenCountService.updateTokenUsageFromMetadata(this.settings.modelName, usageMetadata);

        if (this.onTokenCountUpdate) {
          const updatedUsage = TokenCountService.getModelTokenUsage(this.settings.modelName);
          this.onTokenCountUpdate(updatedUsage.inputTokens);
        }
        
        onCompleteCallback(sources);
      }
    );

    return userMessage;
  }
}

