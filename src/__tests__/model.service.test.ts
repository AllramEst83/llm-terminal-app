import { describe, it, expect } from 'vitest';
import { ModelService } from '../infrastructure/services/model.service';

describe('ModelService', () => {
  it('lists only models that are 3.1 or newer', () => {
    const models = ModelService.listModels();
    const modelIds = models.map(m => m.id);

    expect(modelIds).toContain('gemini-3.6-flash');
    expect(modelIds).toContain('gemini-3.5-flash');
    expect(modelIds).toContain('gemini-3.5-flash-lite');
    expect(modelIds).toContain('gemini-3.1-pro-preview');

    expect(modelIds).not.toContain('gemini-3-flash-preview');
    expect(modelIds).not.toContain('gemini-2.5-pro');
    expect(modelIds).not.toContain('gemini-2.5-flash');
    expect(modelIds).not.toContain('gemini-1.5-pro');
    expect(modelIds).not.toContain('gemini-1.5-flash');
  });

  it('resolves shortcuts flash and pro to 3.1+ versions', () => {
    const flashModel = ModelService.resolveModel('flash');
    expect(flashModel?.id).toBe('gemini-3.6-flash');

    const proModel = ModelService.resolveModel('pro');
    expect(proModel?.id).toBe('gemini-3.1-pro-preview');
  });

  it('lists Nano Banana 2 image models', () => {
    const imageModels = ModelService.listImageModels();
    const ids = imageModels.map(m => m.id);

    expect(ids).toContain('gemini-3.1-flash-image');
    expect(ids).toContain('gemini-3.1-flash-lite-image');

    const defaultImageModel = ModelService.getDefaultImageModel();
    expect(defaultImageModel.id).toBe('gemini-3.1-flash-image');
  });

  it('resolves Nano Banana 2 image model aliases', () => {
    expect(ModelService.resolveImageModel('nano-banana-2')?.id).toBe('gemini-3.1-flash-image');
    expect(ModelService.resolveImageModel('nano-banana-2-lite')?.id).toBe('gemini-3.1-flash-lite-image');
    expect(ModelService.resolveImageModel('flash-image')?.id).toBe('gemini-3.1-flash-image');
    expect(ModelService.resolveImageModel('flash-lite-image')?.id).toBe('gemini-3.1-flash-lite-image');
  });
});
