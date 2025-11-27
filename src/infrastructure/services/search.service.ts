import type { Source } from '../../domain/entities/message';
import { ModelService } from './model.service';

const SEARCH_ENDPOINT = '/functions/v1/gemini-search';

export interface SearchResult {
  text: string;
  sources: Source[];
}

export class SearchService {
  static async performSearch(query: string, modelName?: string): Promise<SearchResult> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      throw new Error('No search query provided.');
    }

    const fallbackModel = ModelService.getDefaultModel().id;
    const modelId = ModelService.getCanonicalModelId(modelName ?? fallbackModel);

    const response = await fetch(SEARCH_ENDPOINT, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: trimmedQuery,
        model: modelId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Search endpoint returned ${response.status}`);
    }

    const payload = (await response.json()) as SearchResult;
    return payload;
  }
}
