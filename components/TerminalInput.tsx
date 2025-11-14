import React, { useRef, useEffect } from 'react';
import type { CommandDefinition } from '../domain/Command';
import type { ThemeColors } from '../domain/Theme';
import { CommandSuggestions } from './CommandSuggestions';

interface TerminalInputProps {
  input: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  suggestions: CommandDefinition[];
  showSuggestions: boolean;
  activeSuggestionIndex: number;
  onSuggestionSelect: (command: string) => void;
  onSuggestionIndexChange: (index: number) => void;
  onSuggestionsClose: () => void;
  theme: ThemeColors;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const TerminalInput: React.FC<TerminalInputProps> = ({
  input,
  onChange,
  onSend,
  onKeyDown,
  suggestions,
  showSuggestions,
  activeSuggestionIndex,
  onSuggestionSelect,
  onSuggestionIndexChange,
  onSuggestionsClose,
  theme,
  disabled = false,
  autoFocus = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRef.current?.focus();
    }
  }, [autoFocus, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle suggestions navigation when suggestions are visible
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        onSuggestionIndexChange((activeSuggestionIndex + 1) % suggestions.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onSuggestionIndexChange((activeSuggestionIndex - 1 + suggestions.length) % suggestions.length);
        return;
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        if (activeSuggestionIndex >= 0) {
          e.preventDefault();
          onSuggestionSelect(suggestions[activeSuggestionIndex].name);
          return;
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onSuggestionsClose();
        return;
      }
    }

    // Handle Enter key for sending messages
    if (e.key === 'Enter' && !showSuggestions) {
      onSend();
      return;
    }

    // For arrow keys when suggestions are not shown, let parent handle history navigation
    // Call parent's onKeyDown handler for all keys (including arrow keys when suggestions are hidden)
    onKeyDown?.(e);
  };

  return (
    <div className="p-2 border-t-4 flex items-center relative" style={{ borderColor: theme.accent }}>
      {showSuggestions && suggestions.length > 0 && (
        <CommandSuggestions
          suggestions={suggestions}
          activeIndex={activeSuggestionIndex}
          onSelect={onSuggestionSelect}
          theme={theme}
        />
      )}
      <span style={{ color: theme.prompt }} className="mr-2">{'>'}</span>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="bg-transparent border-none w-full focus:outline-none"
        style={{ color: theme.text }}
        autoFocus={autoFocus}
        disabled={disabled}
        autoComplete="off"
      />
    </div>
  );
};

