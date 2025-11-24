import { GoogleGenAI } from '@google/genai';
import { ModelService } from './model.service';

const GRAMMAR_SYSTEM_PROMPT =
  'You are a precise copy editor. Improve grammar, clarity, and flow while preserving the original meaning and tone. Return only the improved text without commentary or Markdown fences.';

export class GrammarService {
  static async improveText(
    text: string,
    apiKey: string,
    modelName?: string
  ): Promise<string> {
    if (!text.trim()) {
      throw new Error('No text provided for grammar improvement.');
    }

    if (!apiKey) {
      throw new Error('API key is missing. Please configure it first.');
    }

    const fallbackModel = ModelService.getDefaultModel().id;
    const modelId = ModelService.getCanonicalModelId(modelName ?? fallbackModel);
    const ai = new GoogleGenAI({ apiKey });

    const chat = ai.chats.create({
      model: modelId,
      history: [],
      config: {
        systemInstruction: GRAMMAR_SYSTEM_PROMPT,
      },
    });

    const stream = await chat.sendMessageStream({
      message: `Text:\n${text.trim()}`,
    });

    let output = '';
    for await (const chunk of stream) {
      if (chunk.text) {
        output += chunk.text;
      }
    }

    return output.trim();
  }
}

