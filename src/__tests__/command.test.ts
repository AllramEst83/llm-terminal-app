import { describe, it, expect } from 'vitest';
import { Command, CommandNames } from '../domain/entities/command';

describe('Command', () => {
  describe('getAllCommands', () => {
    it('returns all defined commands', () => {
      const commands = Command.getAllCommands();
      expect(commands.length).toBeGreaterThan(10);
      const names = commands.map(c => c.name);
      expect(names).toContain(CommandNames.CLEAR);
      expect(names).toContain(CommandNames.HELP);
      expect(names).toContain(CommandNames.SETTINGS);
    });

    it('returns a copy (not the internal array)', () => {
      const a = Command.getAllCommands();
      const b = Command.getAllCommands();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe('findCommand', () => {
    it('finds a command by name', () => {
      const cmd = Command.findCommand(CommandNames.CLEAR);
      expect(cmd).toBeDefined();
      expect(cmd?.name).toBe(CommandNames.CLEAR);
    });

    it('returns undefined for unknown command', () => {
      expect(Command.findCommand('nonexistent')).toBeUndefined();
    });
  });

  describe('findMatchingCommands', () => {
    it('finds commands by prefix', () => {
      const matches = Command.findMatchingCommands('cl');
      expect(matches.length).toBeGreaterThanOrEqual(1);
      expect(matches.some(c => c.name === CommandNames.CLEAR)).toBe(true);
    });

    it('is case insensitive', () => {
      const matches = Command.findMatchingCommands('CL');
      expect(matches.some(c => c.name === CommandNames.CLEAR)).toBe(true);
    });

    it('returns empty for no matches', () => {
      expect(Command.findMatchingCommands('zzzzz')).toEqual([]);
    });
  });

  describe('isCommand', () => {
    it('returns true for slash-prefixed input', () => {
      expect(Command.isCommand('/help')).toBe(true);
      expect(Command.isCommand('/clear')).toBe(true);
      expect(Command.isCommand('  /settings')).toBe(true);
    });

    it('returns false for non-command input', () => {
      expect(Command.isCommand('hello')).toBe(false);
      expect(Command.isCommand('')).toBe(false);
      expect(Command.isCommand('help')).toBe(false);
    });
  });

  describe('parseCommand', () => {
    it('parses a simple command', () => {
      const result = Command.parseCommand('/clear');
      expect(result).toEqual({ command: 'clear', args: [] });
    });

    it('parses a command with arguments', () => {
      const result = Command.parseCommand('/font 18');
      expect(result).toEqual({ command: 'font', args: ['18'] });
    });

    it('parses a command with multiple arguments', () => {
      const result = Command.parseCommand('/image a cute cat --aspect 16:9');
      expect(result?.command).toBe('image');
      expect(result?.args).toEqual(['a', 'cute', 'cat', '--aspect', '16:9']);
    });

    it('lowercases the command name', () => {
      const result = Command.parseCommand('/HELP');
      expect(result?.command).toBe('help');
    });

    it('returns null for non-command input', () => {
      expect(Command.parseCommand('hello')).toBeNull();
    });

    it('handles leading whitespace', () => {
      const result = Command.parseCommand('/  settings');
      expect(result?.command).toBe('settings');
    });
  });
});
