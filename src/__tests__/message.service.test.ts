import { describe, it, expect } from 'vitest';
import { MessageService } from '../infrastructure/services/message.service';
import { Message, MessageType } from '../domain/entities/message';

describe('MessageService', () => {
  describe('createUserMessage', () => {
    it('creates a user message with role and type', () => {
      const msg = MessageService.createUserMessage('hello');
      expect(msg.role).toBe('user');
      expect(msg.type).toBe(MessageType.USER);
      expect(msg.text).toBe('hello');
      expect(msg.timestamp).toBeTruthy();
    });

    it('creates a user message with images', () => {
      const images = [{ base64Data: 'abc', mimeType: 'image/png', fileName: 'test.png' }];
      const msg = MessageService.createUserMessage('look at this', undefined, undefined, images);
      expect(msg.images).toEqual(images);
    });
  });

  describe('createModelMessage', () => {
    it('creates a model message', () => {
      const msg = MessageService.createModelMessage('response', 'gemini-3-flash');
      expect(msg.role).toBe('model');
      expect(msg.type).toBe(MessageType.AI);
      expect(msg.text).toBe('response');
      expect(msg.modelName).toBe('gemini-3-flash');
    });
  });

  describe('createSystemMessage', () => {
    it('creates a system message', () => {
      const msg = MessageService.createSystemMessage('info');
      expect(msg.role).toBe('system');
      expect(msg.text).toBe('info');
    });
  });

  describe('createErrorMessage', () => {
    it('creates a system-role error message', () => {
      const msg = MessageService.createErrorMessage('SYSTEM ERROR: something');
      expect(msg.role).toBe('system');
      expect(msg.text).toBe('SYSTEM ERROR: something');
    });
  });

  describe('updateLastMessage', () => {
    it('updates the last message in the array', () => {
      const a = Message.createUser('first');
      const b = Message.createUser('second');
      const result = MessageService.updateLastMessage([a, b], msg => msg.withUpdatedText('updated'));
      expect(result[0].text).toBe('first');
      expect(result[1].text).toBe('updated');
    });

    it('returns the same array when empty', () => {
      const result = MessageService.updateLastMessage([], msg => msg.withUpdatedText('x'));
      expect(result).toEqual([]);
    });

    it('does not mutate the original', () => {
      const original = [Message.createUser('original')];
      const result = MessageService.updateLastMessage(original, msg => msg.withUpdatedText('changed'));
      expect(original[0].text).toBe('original');
      expect(result[0].text).toBe('changed');
    });
  });

  describe('appendMessage', () => {
    it('appends a message to the array', () => {
      const a = Message.createUser('first');
      const b = Message.createUser('second');
      const result = MessageService.appendMessage([a], b);
      expect(result).toHaveLength(2);
      expect(result[1].text).toBe('second');
    });
  });
});

describe('Message', () => {
  it('withUpdatedText returns a new instance with updated text', () => {
    const msg = Message.createUser('original');
    const updated = msg.withUpdatedText('changed');
    expect(updated.text).toBe('changed');
    expect(updated.id).toBe(msg.id);
    expect(msg.text).toBe('original');
  });

  it('withSources returns a new instance with sources', () => {
    const msg = Message.createModel('text');
    const updated = msg.withSources([{ title: 'Google', uri: 'https://google.com' }]);
    expect(updated.sources).toHaveLength(1);
    expect(msg.sources).toBeUndefined();
  });

  it('withModelName returns a new instance', () => {
    const msg = Message.createModel('text');
    const updated = msg.withModelName('gemini-pro');
    expect(updated.modelName).toBe('gemini-pro');
  });

  it('createCommand creates a command message', () => {
    const msg = Message.createCommand('clear', '/clear');
    expect(msg.role).toBe('system');
    expect(msg.type).toBe(MessageType.CLEAR);
    expect(msg.command).toBe('clear');
    expect(msg.commandInput).toBe('/clear');
  });
});
