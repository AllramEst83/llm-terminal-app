import { GoogleGenAI } from '@google/genai';
import { ModelService } from './model.service';

const GRAMMAR_SYSTEM_PROMPT =
  'You are a precise copy editor. Improve grammar, clarity, and flow while preserving the original meaning and tone unless optional notes request otherwise. If notes are provided, follow them as additional instructions. Return only the improved text without commentary or Markdown fences.';

export class GrammarService {
  static async improveText(
    text: string,
    apiKey: string,
    modelName?: string,
    notes?: string
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

    const messageParts = [`Text:\n${text.trim()}`];
    if (notes?.trim()) {
      messageParts.push(`Notes:\n${notes.trim()}`);
    }

    const stream = await chat.sendMessageStream({
      message: messageParts.join('\n\n'),
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

