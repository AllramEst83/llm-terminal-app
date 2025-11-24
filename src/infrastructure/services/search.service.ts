import { GoogleGenAI } from '@google/genai';
import type { Source } from '../../domain/entities/message';
import { ModelService } from './model.service';

const SEARCH_SYSTEM_PROMPT = `You are a real-time search analyst. Use Google Search to gather the most up-to-date information, synthesize it into a concise Markdown response, and include findings ordered by relevance. Support factual statements with bracketed citations like [1], referring to a Sources section at the end listing each URL with a short title. If no information is available, respond with "DATA UNAVAILABLE". Keep replies under 250 words.`;

export interface SearchResult {
  text: string;
  sources: Source[];
}

export class SearchService {
  static async performSearch(
    query: string,
    apiKey: string,
    modelName?: string
  ): Promise<SearchResult> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      throw new Error('No search query provided.');
    }

    if (!apiKey) {
      throw new Error('API key is missing. Configure it first.');
    }

    const fallbackModel = ModelService.getDefaultModel().id;
    const modelId = ModelService.getCanonicalModelId(modelName ?? fallbackModel);
    const ai = new GoogleGenAI({ apiKey });

    const chat = ai.chats.create({
      model: modelId,
      history: [],
      config: {
        systemInstruction: SEARCH_SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
      },
    });

    const stream = await chat.sendMessageStream({
      message: trimmedQuery,
    });

    let responseText = '';
    const sourcesMap = new Map<string, Source>();

    for await (const chunk of stream) {
      if (chunk.text) {
        responseText += chunk.text;
      }

      const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
      const groundingChunks = groundingMetadata?.groundingChunks ?? [];
      for (const groundingChunk of groundingChunks) {
        if (groundingChunk.web?.uri && !sourcesMap.has(groundingChunk.web.uri)) {
          sourcesMap.set(groundingChunk.web.uri, {
            title: groundingChunk.web.title || groundingChunk.web.uri,
            uri: groundingChunk.web.uri,
          });
        }
      }
    }

    const finalText = responseText.trim();
    if (!finalText) {
      throw new Error('Search did not return any content.');
    }

    return {
      text: finalText,
      sources: Array.from(sourcesMap.values()),
    };
  }
}


