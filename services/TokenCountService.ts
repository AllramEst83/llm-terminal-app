export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ModelTokenUsage {
  'gemini-2.5-flash': TokenUsage;
  'gemini-2.5-pro': TokenUsage;
}

const SESSION_STORAGE_KEY = 'token_usage';

export class TokenCountService {
  // Model token limits
  static readonly MODEL_LIMITS = {
    'gemini-2.5-flash': 1_000_000,
    'gemini-2.5-pro': 2_000_000,
  };

  // Initialize session storage with empty counts
  static initializeSessionStorage(): void {
    const initialUsage: ModelTokenUsage = {
      'gemini-2.5-flash': { inputTokens: 0, outputTokens: 0 },
      'gemini-2.5-pro': { inputTokens: 0, outputTokens: 0 },
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(initialUsage));
  }

  // Get current token usage from session storage
  static getTokenUsage(): ModelTokenUsage {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) {
        this.initializeSessionStorage();
        return this.getTokenUsage();
      }
      return JSON.parse(stored) as ModelTokenUsage;
    } catch (error) {
      console.error('Error reading token usage from session storage:', error);
      this.initializeSessionStorage();
      return this.getTokenUsage();
    }
  }

  // Update token usage for a specific model
  static updateTokenUsage(
    modelName: string,
    inputTokens: number,
    outputTokens: number
  ): void {
    const usage = this.getTokenUsage();
    const normalizedModel = this.normalizeModelName(modelName);
    
    if (normalizedModel in usage) {
      usage[normalizedModel as keyof ModelTokenUsage].inputTokens += inputTokens;
      usage[normalizedModel as keyof ModelTokenUsage].outputTokens += outputTokens;
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(usage));
    }
  }

  // Get token usage for the current model
  static getModelTokenUsage(modelName: string): TokenUsage {
    const usage = this.getTokenUsage();
    const normalizedModel = this.normalizeModelName(modelName);
    return usage[normalizedModel as keyof ModelTokenUsage] || { inputTokens: 0, outputTokens: 0 };
  }

  // Count tokens via Gemini API
  static async countTokens(
    text: string,
    apiKey: string,
    modelName: string
  ): Promise<number> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:countTokens`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: text,
            },
          ],
        },
      ],
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `HTTP ERROR! STATUS: ${response.status}, DETAIL: ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      return data.totalTokens || 0;
    } catch (error) {
      console.error('Error counting tokens:', error);
      return 0;
    }
  }

  // Count tokens for conversation history
  static async countConversationTokens(
    messages: Array<{ role: string; text: string }>,
    apiKey: string,
    modelName: string
  ): Promise<number> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:countTokens`;

    const requestBody = {
      contents: messages
        .filter(msg => msg.role === 'user' || msg.role === 'model')
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }],
        })),
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `HTTP ERROR! STATUS: ${response.status}, DETAIL: ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      return data.totalTokens || 0;
    } catch (error) {
      console.error('Error counting conversation tokens:', error);
      return 0;
    }
  }

  // Format token usage for display
  static formatTokenUsage(usage: ModelTokenUsage): string {
    const flashUsage = usage['gemini-2.5-flash'];
    const proUsage = usage['gemini-2.5-pro'];
    const flashLimit = this.MODEL_LIMITS['gemini-2.5-flash'];
    const proLimit = this.MODEL_LIMITS['gemini-2.5-pro'];

    const flashTotal = flashUsage.inputTokens + flashUsage.outputTokens;
    const proTotal = proUsage.inputTokens + proUsage.outputTokens;

    const flashPercent = ((flashUsage.inputTokens / flashLimit) * 100).toFixed(1);
    const proPercent = ((proUsage.inputTokens / proLimit) * 100).toFixed(1);

    return `## TOKEN USAGE (CURRENT SESSION)

### Gemini 2.5 Flash
- **Input Tokens:** ${flashUsage.inputTokens.toLocaleString()} / ${flashLimit.toLocaleString()} (${flashPercent}%)
- **Output Tokens:** ${flashUsage.outputTokens.toLocaleString()}
- **Total Tokens:** ${flashTotal.toLocaleString()}

### Gemini 2.5 Pro
- **Input Tokens:** ${proUsage.inputTokens.toLocaleString()} / ${proLimit.toLocaleString()} (${proPercent}%)
- **Output Tokens:** ${proUsage.outputTokens.toLocaleString()}
- **Total Tokens:** ${proTotal.toLocaleString()}

---
**Note:** Input tokens represent the conversation context sent to the model. Use \`/clear\` to reset the context and token counts.`;
  }

  // Normalize model name to standard format
  private static normalizeModelName(modelName: string): string {
    if (modelName.includes('flash')) {
      return 'gemini-2.5-flash';
    } else if (modelName.includes('pro')) {
      return 'gemini-2.5-pro';
    }
    return modelName;
  }

  // Clear token usage (for /clear command)
  static clearTokenUsage(): void {
    this.initializeSessionStorage();
  }
}

