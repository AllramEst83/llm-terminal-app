import { ModelService } from './model.service';

const GRAMMAR_ENDPOINT = '/functions/v1/gemini-grammar';

export class GrammarService {
  static async improveText(text: string, modelName?: string): Promise<string> {
    if (!text.trim()) {
      throw new Error('No text provided for grammar improvement.');
    }

    const fallbackModel = ModelService.getDefaultModel().id;
    const modelId = ModelService.getCanonicalModelId(modelName ?? fallbackModel);

    const response = await fetch(GRAMMAR_ENDPOINT, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model: modelId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Grammar endpoint returned ${response.status}`);
    }

    const payload = (await response.json()) as { output: string };
    return payload.output.trim();
  }
}
