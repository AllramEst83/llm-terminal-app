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
  attachedImages?: AttachedImage[];
  onImageAttach?: (image: AttachedImage) => void;
  onImageRemove?: (index: number) => void;
  maxImages?: number;
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
  attachedImages = [],
  onImageAttach,
  onImageRemove,
  maxImages = 10,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const hasImages = attachedImages.length > 0;
  const isMaxImages = attachedImages.length >= maxImages;

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
    if (!items || !onImageAttach || isMaxImages) return;

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
    const files = e.target.files;
    if (!files || !onImageAttach) return;

    // Process multiple files up to the max limit
    const remainingSlots = maxImages - attachedImages.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        continue;
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
    }
    
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
      {/* Image thumbnails row - shown above input if images are attached */}
      {hasImages && (
        <div 
          className="px-2 pt-2 pb-1 flex items-center gap-1 overflow-x-auto"
          style={{ borderBottom: `1px solid ${theme.accent}40` }}
        >
          <span 
            className="text-xs font-bold mr-1 whitespace-nowrap"
            style={{ color: theme.accent }}
          >
            {attachedImages.length} IMG{attachedImages.length > 1 ? 'S' : ''}:
          </span>
          {attachedImages.map((image, index) => (
            <div key={index} className="relative flex-shrink-0">
              <img
                src={image.dataUrl}
                alt={`Image ${index + 1}`}
                className="w-10 h-10 object-cover rounded border"
                style={{ borderColor: theme.accent }}
              />
              {onImageRemove && (
                <button
                  onClick={() => onImageRemove(index)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none"
                  style={{
                    backgroundColor: theme.accent,
                    color: theme.background,
                    fontSize: '10px',
                  }}
                  title={`Remove ${image.fileName}`}
                >
                  ×
                </button>
              )}
              <div 
                className="absolute bottom-0 left-0 right-0 text-center text-xs font-bold"
                style={{
                  backgroundColor: `${theme.background}dd`,
                  color: theme.accent,
                  fontSize: '8px',
                  lineHeight: '10px',
                }}
              >
                {index + 1}
              </div>
            </div>
          ))}
          {attachedImages.length < maxImages && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="w-10 h-10 flex items-center justify-center rounded border border-dashed hover:opacity-80 transition-opacity flex-shrink-0"
              style={{ 
                borderColor: theme.accent,
                color: theme.accent,
                opacity: disabled ? 0.3 : 1 
              }}
              title={`Add image (${attachedImages.length}/${maxImages})`}
            >
              +
            </button>
          )}
        </div>
      )}
      
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
          disabled={disabled || isMaxImages}
          className="mr-2 p-1 hover:opacity-80 transition-opacity relative"
          style={{ color: theme.accent, opacity: disabled || isMaxImages ? 0.3 : 1 }}
          title={isMaxImages ? `Maximum ${maxImages} images` : 'Attach images (paste or click)'}
        >
          📎
          {hasImages && (
            <span 
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-bold"
              style={{
                backgroundColor: theme.accent,
                color: theme.background,
                fontSize: '9px',
              }}
            >
              {attachedImages.length}
            </span>
          )}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
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
          placeholder={hasImages ? `${attachedImages.length} image${attachedImages.length > 1 ? 's' : ''} attached...` : ''}
        />
      </div>
    </div>
  );
};

