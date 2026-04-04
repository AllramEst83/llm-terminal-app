import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessageToGemini } from '../infrastructure/api/gemini.service';
import type { GeminiUsageMetadata } from '../infrastructure/api/gemini.service';
import { Message } from '../domain/entities/message';

const mockSendMessageStream = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    chats: {
      create: vi.fn().mockReturnValue({
        sendMessageStream: mockSendMessageStream,
      }),
    },
  })),
}));

function createAsyncIterable<T>(items: T[]): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        async next() {
          if (i < items.length) return { value: items[i++], done: false };
          return { value: undefined as unknown as T, done: true };
        },
      };
    },
  };
}

describe('sendMessageToGemini', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('streams text chunks and calls onComplete', async () => {
    mockSendMessageStream.mockResolvedValue(
      createAsyncIterable([
        { text: 'Hello', candidates: [], usageMetadata: undefined },
        { text: ' World', candidates: [], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 } },
      ])
    );

    const streamedChunks: Array<{ text: string; isFirst: boolean }> = [];
    let completionSources: unknown;
    let completionUsage: GeminiUsageMetadata | undefined;

    await sendMessageToGemini(
      [],
      'Hello',
      'test-api-key',
      'gemini-3-flash-preview',
      { enabled: false },
      'Be helpful',
      (chunkText, isFirst) => {
        streamedChunks.push({ text: chunkText, isFirst });
      },
      (sources, usage) => {
        completionSources = sources;
        completionUsage = usage;
      }
    );

    expect(streamedChunks).toHaveLength(2);
    expect(streamedChunks[0]).toEqual({ text: 'Hello', isFirst: true });
    expect(streamedChunks[1]).toEqual({ text: ' World', isFirst: false });
    expect(completionUsage?.promptTokenCount).toBe(10);
    expect(completionUsage?.candidatesTokenCount).toBe(5);
  });

  it('collects grounding sources from chunks', async () => {
    mockSendMessageStream.mockResolvedValue(
      createAsyncIterable([
        {
          text: 'Result',
          candidates: [{
            groundingMetadata: {
              groundingChunks: [
                { web: { title: 'Example', uri: 'https://example.com' } },
              ],
            },
          }],
          usageMetadata: undefined,
        },
      ])
    );

    let receivedSources: unknown;

    await sendMessageToGemini(
      [],
      'search query',
      'test-api-key',
      'gemini-3-flash-preview',
      { enabled: false },
      'Be helpful',
      () => {},
      (sources) => { receivedSources = sources; }
    );

    expect(receivedSources).toEqual([{ title: 'Example', uri: 'https://example.com' }]);
  });

  it('deduplicates grounding sources by URI', async () => {
    mockSendMessageStream.mockResolvedValue(
      createAsyncIterable([
        {
          text: 'A',
          candidates: [{
            groundingMetadata: {
              groundingChunks: [
                { web: { title: 'Example', uri: 'https://example.com' } },
              ],
            },
          }],
          usageMetadata: undefined,
        },
        {
          text: 'B',
          candidates: [{
            groundingMetadata: {
              groundingChunks: [
                { web: { title: 'Example Again', uri: 'https://example.com' } },
              ],
            },
          }],
          usageMetadata: undefined,
        },
      ])
    );

    let receivedSources: unknown;

    await sendMessageToGemini(
      [],
      'query',
      'test-api-key',
      'gemini-3-flash-preview',
      { enabled: false },
      'prompt',
      () => {},
      (sources) => { receivedSources = sources; }
    );

    expect(receivedSources).toHaveLength(1);
  });

  it('handles API errors and streams error message', async () => {
    mockSendMessageStream.mockRejectedValue(new Error('API key invalid'));

    const chunks: string[] = [];
    let completionCalled = false;

    await sendMessageToGemini(
      [],
      'hello',
      'bad-key',
      'gemini-3-flash-preview',
      { enabled: false },
      'prompt',
      (text) => { chunks.push(text); },
      () => { completionCalled = true; }
    );

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain('SYSTEM ERROR');
    expect(chunks[0]).toContain('API key');
    expect(completionCalled).toBe(true);
  });

  it('handles rate limit errors', async () => {
    mockSendMessageStream.mockRejectedValue(new Error('quota exceeded'));

    const chunks: string[] = [];

    await sendMessageToGemini(
      [],
      'hello',
      'key',
      'gemini-3-flash-preview',
      { enabled: false },
      'prompt',
      (text) => { chunks.push(text); },
      () => {}
    );

    expect(chunks[0]).toContain('quota');
  });

  it('handles network errors', async () => {
    mockSendMessageStream.mockRejectedValue(new Error('network error'));

    const chunks: string[] = [];

    await sendMessageToGemini(
      [],
      'hello',
      'key',
      'gemini-3-flash-preview',
      { enabled: false },
      'prompt',
      (text) => { chunks.push(text); },
      () => {}
    );

    expect(chunks[0]).toContain('Network');
  });

  it('handles non-Error thrown values', async () => {
    mockSendMessageStream.mockRejectedValue('string error');

    const chunks: string[] = [];

    await sendMessageToGemini(
      [],
      'hello',
      'key',
      'gemini-3-flash-preview',
      { enabled: false },
      'prompt',
      (text) => { chunks.push(text); },
      () => {}
    );

    expect(chunks[0]).toContain('Unexpected error');
  });

  it('throws when API key is empty', async () => {
    await expect(
      sendMessageToGemini(
        [],
        'hello',
        '',
        'gemini-3-flash-preview',
        { enabled: false },
        'prompt',
        () => {},
        () => {}
      )
    ).resolves.toBeUndefined();
  });

  it('formats messages with images for history', async () => {
    const msgWithImages = Message.create(
      'user',
      Message.createUser('test').type,
      'describe this',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      [{ base64Data: 'abc', mimeType: 'image/png' }]
    );

    mockSendMessageStream.mockResolvedValue(
      createAsyncIterable([{ text: 'response', candidates: [], usageMetadata: undefined }])
    );

    await sendMessageToGemini(
      [msgWithImages],
      'describe this',
      'key',
      'gemini-3-flash-preview',
      { enabled: false },
      'prompt',
      () => {},
      () => {}
    );

    expect(mockSendMessageStream).toHaveBeenCalled();
  });
});
