import type { Message, MessageImage } from '../../domain/entities/message';
import type { Settings } from '../../domain/entities/settings';
import { sendMessageToGemini } from '../../infrastructure/api/gemini.service';
import { MessageService } from '../../infrastructure/services/message.service';
import { TokenCountService } from '../../infrastructure/services/token-count.service';

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

    const thinkingSettings = this.settings.getThinkingSettingsForModel(this.settings.modelName);

    await sendMessageToGemini(
      this.currentMessages,
      inputText,
      this.settings.apiKey,
      this.settings.modelName,
      thinkingSettings,
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

