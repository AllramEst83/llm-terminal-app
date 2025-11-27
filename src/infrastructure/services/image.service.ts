import type { GeminiUsageMetadata } from '../api/gemini.service';
import { ModelService } from './model.service';

const IMAGE_ENDPOINT = '/functions/v1/gemini-image';

export interface ImageGenerationResult {
  imageData: string;
  usageMetadata?: GeminiUsageMetadata;
}

export async function generateImage(
  prompt: string,
  aspectRatio: string = '1:1',
  model?: string
): Promise<ImageGenerationResult> {
  const selectedModel = ModelService.resolveImageModel(model) ?? ModelService.getDefaultImageModel();

  const response = await fetch(IMAGE_ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      aspectRatio,
      model: selectedModel.id,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Image endpoint returned ${response.status}`);
  }

  const payload = (await response.json()) as ImageGenerationResult;
  return payload;
}
