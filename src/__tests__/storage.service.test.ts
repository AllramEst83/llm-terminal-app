import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../infrastructure/storage/storage.service';

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('get', () => {
    it('returns parsed JSON from localStorage', () => {
      localStorage.setItem('key', JSON.stringify({ name: 'test' }));
      const result = StorageService.get<{ name: string }>('key', { name: 'default' });
      expect(result).toEqual({ name: 'test' });
    });

    it('returns default value when key does not exist', () => {
      const result = StorageService.get('missing', 42);
      expect(result).toBe(42);
    });

    it('returns default value for corrupt JSON', () => {
      localStorage.setItem('bad', 'not-json');
      const result = StorageService.get('bad', 'fallback');
      expect(result).toBe('fallback');
    });
  });

  describe('getOptional', () => {
    it('returns parsed JSON when key exists', () => {
      localStorage.setItem('key', JSON.stringify(true));
      expect(StorageService.getOptional<boolean>('key')).toBe(true);
    });

    it('returns undefined when key does not exist', () => {
      expect(StorageService.getOptional('missing')).toBeUndefined();
    });
  });

  describe('getString', () => {
    it('returns raw string from localStorage', () => {
      localStorage.setItem('key', 'hello');
      expect(StorageService.getString('key', 'default')).toBe('hello');
    });

    it('returns default value when key does not exist', () => {
      expect(StorageService.getString('missing', 'default')).toBe('default');
    });
  });

  describe('getStringOptional', () => {
    it('returns string when key exists', () => {
      localStorage.setItem('key', 'value');
      expect(StorageService.getStringOptional('key')).toBe('value');
    });

    it('returns undefined when key does not exist', () => {
      expect(StorageService.getStringOptional('missing')).toBeUndefined();
    });
  });

  describe('set', () => {
    it('stores serialized JSON and returns true', () => {
      const success = StorageService.set('key', { a: 1 });
      expect(success).toBe(true);
      expect(localStorage.getItem('key')).toBe(JSON.stringify({ a: 1 }));
    });

    it('stores primitive values', () => {
      StorageService.set('num', 42);
      expect(StorageService.get('num', 0)).toBe(42);
    });
  });

  describe('setString', () => {
    it('stores raw string and returns true', () => {
      const success = StorageService.setString('key', 'value');
      expect(success).toBe(true);
      expect(localStorage.getItem('key')).toBe('value');
    });
  });

  describe('remove', () => {
    it('removes a key from localStorage', () => {
      localStorage.setItem('key', 'value');
      StorageService.remove('key');
      expect(localStorage.getItem('key')).toBeNull();
    });

    it('does not throw when key does not exist', () => {
      expect(() => StorageService.remove('missing')).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('can set and get complex objects', () => {
      const data = { users: [{ id: 1, name: 'Alice' }], count: 1 };
      StorageService.set('complex', data);
      const result = StorageService.get('complex', { users: [], count: 0 });
      expect(result).toEqual(data);
    });
  });
});
