import { Message } from '../domain/Message';
import { Settings } from '../domain/Settings';
import { sendMessageToGemini } from '../services/geminiService';
import { MessageService } from '../services/MessageService';
import { getCurrentTimestamp } from '../utils/dateUtils';
import { TokenCountService } from '../services/TokenCountService';
import { ApiKeyService } from '../services/ApiKeyService';

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
    
    // Get API key for token counting
    const apiKey = await ApiKeyService.getApiKey();
    
    // Count input tokens (conversation history + new message)
    const messagesToCount = [...this.currentMessages, userMessage];
    const inputTokenCount = apiKey 
      ? await TokenCountService.countConversationTokens(
          messagesToCount.map(m => ({ role: m.role, text: m.text })),
          apiKey,
          this.settings.modelName
        )
      : 0;
    
    // Variable to accumulate the response text for output token counting
    let responseText = '';

    await sendMessageToGemini(
      this.currentMessages,
      inputText,
      this.settings.apiKey,
      this.settings.modelName,
      this.settings.thinkingEnabled,
      this.settings.thinkingBudget,
      (chunkText, isFirstChunk) => {
        // Accumulate response text
        responseText += chunkText;
        onStreamCallback(chunkText, isFirstChunk);
      },
      async (sources) => {
        // Count output tokens after response is complete
        if (apiKey && responseText && !responseText.startsWith('SYSTEM ERROR')) {
          const outputTokenCount = await TokenCountService.countTokens(
            responseText,
            apiKey,
            this.settings.modelName
          );
          
          // Update token usage in session storage
          TokenCountService.updateTokenUsage(
            this.settings.modelName,
            inputTokenCount,
            outputTokenCount
          );
          
          // Notify UI of token count update
          if (this.onTokenCountUpdate) {
            const updatedUsage = TokenCountService.getModelTokenUsage(this.settings.modelName);
            this.onTokenCountUpdate(updatedUsage.inputTokens);
          }
        }
        
        onCompleteCallback(sources);
      }
    );

    return userMessage;
  }
}

