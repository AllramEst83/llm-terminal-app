import React, { useRef, useEffect } from 'react';
import type { CommandDefinition } from '../domain/Command';
import type { ThemeColors } from '../domain/Theme';
import { CommandSuggestions } from './CommandSuggestions';

export interface AttachedImage {
  base64Data: string;
  mimeType: string;
  fileName: string;
  dataUrl: string;
}

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
  attachedImage?: AttachedImage | null;
  onImageAttach?: (image: AttachedImage) => void;
  onImageRemove?: () => void;
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
  attachedImage,
  onImageAttach,
  onImageRemove,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRef.current?.focus();
    }
  }, [autoFocus, disabled]);

  const handleSuggestionSelect = (command: string) => {
    onSuggestionSelect(command);
    // Refocus input after selecting suggestion to keep keyboard open on mobile
    setTimeout(() => {
      if (inputRef.current && !inputRef.current.disabled) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items || !onImageAttach) return;

    for (const item of Array.from(items)) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        e.preventDefault();
        
        const imageBlob = item.getAsFile();
        if (!imageBlob) continue;

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const dataUrl = loadEvent.target?.result as string;
          const base64String = dataUrl.split(',')[1];
          
          onImageAttach({
            base64Data: base64String,
            mimeType: imageBlob.type,
            fileName: imageBlob.name || 'pasted-image.png',
            dataUrl: dataUrl,
          });
        };
        
        reader.readAsDataURL(imageBlob);
        break;
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageAttach) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      const base64String = dataUrl.split(',')[1];
      
      onImageAttach({
        base64Data: base64String,
        mimeType: file.type,
        fileName: file.name,
        dataUrl: dataUrl,
      });
    };
    
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
          handleSuggestionSelect(suggestions[activeSuggestionIndex].name);
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
    <div className="border-t-4" style={{ borderColor: theme.accent }}>
      <div className="p-2 flex items-center relative">
        {showSuggestions && suggestions.length > 0 && (
          <CommandSuggestions
            suggestions={suggestions}
            activeIndex={activeSuggestionIndex}
            onSelect={handleSuggestionSelect}
            theme={theme}
          />
        )}
        
        {/* Image attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="mr-2 p-1 hover:opacity-80 transition-opacity"
          style={{ color: theme.accent, opacity: disabled ? 0.3 : 1 }}
          title="Attach image"
        >
          📎
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <span style={{ color: theme.prompt }} className="mr-2">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="bg-transparent border-none flex-1 focus:outline-none"
          style={{ color: theme.text, opacity: disabled ? 0.5 : 1 }}
          autoFocus={autoFocus}
          readOnly={disabled}
          autoComplete="off"
        />
        
        {/* Image thumbnail */}
        {attachedImage && (
          <div className="ml-2 relative flex items-center">
            <div className="relative">
              <img
                src={attachedImage.dataUrl}
                alt="Attached"
                className="w-12 h-12 object-cover rounded border-2"
                style={{ borderColor: theme.accent }}
              />
              {onImageRemove && (
                <button
                  onClick={onImageRemove}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor: theme.accent,
                    color: theme.background,
                  }}
                  title="Remove image"
                >
                  ×
                </button>
              )}
            </div>
            <span
              className="ml-2 text-xs truncate max-w-[100px]"
              style={{ color: theme.text, opacity: 0.7 }}
            >
              {attachedImage.fileName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

