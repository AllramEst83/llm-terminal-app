import { Message, MessageImage } from '../domain/Message';
import { Settings } from '../domain/Settings';
import { sendMessageToGemini } from '../services/geminiService';
import { MessageService } from '../services/MessageService';
import { TokenCountService } from '../services/TokenCountService';

interface CompletionResult {
  sources?: Array<{ title: string; uri: string }>;
  warningMessage?: string;
}

export class SendMessageUseCase {
  constructor(
    private currentMessages: Message[],
    private settings: Settings,
    private onTokenCountUpdate?: (inputTokens: number) => void
  ) {}

  async execute(
    inputText: string,
    onStreamCallback: (chunkText: string, isFirstChunk: boolean) => void,
    onCompleteCallback: (result: CompletionResult) => void,
    imageData?: string,
    imageMimeType?: string,
    images?: MessageImage[]
  ): Promise<Message> {
    const userMessage = MessageService.createUserMessage(inputText, imageData, imageMimeType, images);

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

        let warningMessage: string | undefined;
        const promptTokens = usageMetadata?.promptTokenCount;
        if (TokenCountService.isApproachingModelLimit(this.settings.modelName, promptTokens)) {
          const limit = TokenCountService.getModelLimit(this.settings.modelName);
          const displayName = TokenCountService.getModelDisplayName(this.settings.modelName);
          const buffer = TokenCountService.TOKEN_WARNING_BUFFER.toLocaleString();
          warningMessage = `SYSTEM WARNING: ${displayName} context window nearing limit.\n\nUsage: ${promptTokens?.toLocaleString() ?? '0'} / ${limit.toLocaleString()} tokens.\n\nYou're within ${buffer} tokens of the maximum context window. Use /clear to reset the conversation before reaching the limit.`;
        }
        
        onCompleteCallback({
          sources,
          warningMessage,
        });
      },
      imageData,
      imageMimeType,
      images
    );

    return userMessage;
  }
}

