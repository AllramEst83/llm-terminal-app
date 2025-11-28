import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CommandSuggestions } from './CommandSuggestions';
import type { TerminalInputProps, AttachedImage } from '../../../types/ui/components';

// Using ASCII-safe icon to avoid parser issues with emoji in WebContainer
const ATTACH_ICON = '[+]';

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
  onError,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragActive, setIsDragActive] = useState(false);
  
  const hasImages = attachedImages.length > 0;
  const isMaxImages = attachedImages.length >= maxImages;

  // Helper function to validate image format
  const isValidImageFormat = (mimeType: string): boolean => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    return validTypes.includes(mimeType.toLowerCase());
  };

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRef.current?.focus();
    }
  }, [autoFocus, disabled]);

  const processImageFiles = useCallback(
    (files: File[]) => {
      if (!onImageAttach || files.length === 0) return;

      const remainingSlots = maxImages - attachedImages.length;
      if (remainingSlots <= 0) {
        onError?.(`Maximum ${maxImages} images reached. Please remove some images before adding more.`);
        return;
      }

      const imageFiles = files.filter((file) => file.type?.toLowerCase().startsWith('image/'));
      if (imageFiles.length === 0) {
        onError?.('Only image files can be attached. Please use PNG, JPEG, GIF, or WebP images.');
        return;
      }

      const filesToProcess = imageFiles.slice(0, remainingSlots);
      const skippedNonImages = files.length - imageFiles.length;
      let invalidFormatCount = 0;
      let readErrorCount = 0;

      filesToProcess.forEach((file) => {
        if (!isValidImageFormat(file.type)) {
          invalidFormatCount++;
          if (invalidFormatCount === 1) {
            onError?.('Unsupported file format. Please use PNG, JPEG, GIF, or WebP images.');
          }
          return;
        }

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const dataUrl = loadEvent.target?.result as string;
          const base64String = dataUrl.split(',')[1];

          onImageAttach({
            base64Data: base64String,
            mimeType: file.type,
            fileName: file.name || 'image.png',
            dataUrl,
          });
        };

        reader.onerror = () => {
          readErrorCount++;
          if (readErrorCount === 1) {
            onError?.('Failed to read image file. Please try again.');
          }
        };

        reader.readAsDataURL(file);
      });

      if (imageFiles.length > remainingSlots) {
        onError?.(
          `Only ${remainingSlots} of ${imageFiles.length} image(s) were added. Maximum ${maxImages} images allowed.`
        );
      }

      if (skippedNonImages > 0) {
        onError?.('Some files were skipped because they are not images.');
      }
    },
    [attachedImages.length, maxImages, onError, onImageAttach]
  );

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

    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length === 0) return;

    e.preventDefault();
    processImageFiles(imageFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !onImageAttach) return;

    processImageFiles(Array.from(files));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasSupportedImage = (items: DataTransferItemList | null | undefined) => {
    if (!items) return false;
    return Array.from(items).some(
      (item) => item.kind === 'file' && (!item.type || item.type.toLowerCase().startsWith('image/'))
    );
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (hasSupportedImage(e.dataTransfer?.items) && !isDragActive) {
      setIsDragActive(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (hasSupportedImage(e.dataTransfer?.items) && !isDragActive) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    dragCounter.current = 0;

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    processImageFiles(Array.from(files));
    e.dataTransfer?.clearData();
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
              title={`Add more images (${attachedImages.length}/${maxImages}) - Hold Ctrl/Cmd to select multiple`}
            >
              +
            </button>
          )}
        </div>
      )}
      
      <div
        className="p-2 flex items-center relative rounded transition-colors"
        onDragEnter={disabled || isMaxImages ? undefined : handleDragEnter}
        onDragOver={disabled || isMaxImages ? undefined : handleDragOver}
        onDragLeave={disabled || isMaxImages ? undefined : handleDragLeave}
        onDrop={disabled || isMaxImages ? undefined : handleDrop}
        style={{
          border: isDragActive ? `1px dashed ${theme.accent}` : '1px solid transparent',
          backgroundColor: isDragActive ? `${theme.accent}15` : undefined,
        }}
      >
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
          className="terminal-input-attach-btn"
          style={{ 
            color: theme.accent
          }}
          title={
            isMaxImages
              ? `Maximum ${maxImages} images reached`
              : hasImages
              ? `Add more images (${attachedImages.length}/${maxImages}) - drag & drop, paste, or use file picker`
              : 'Attach images - drag & drop, paste, or use the file picker (Ctrl/Cmd for multi-select)'
          }
        >
          <span className="terminal-input-attach-icon">{ATTACH_ICON}</span>
          {hasImages && (
            <span 
              className="terminal-input-attach-badge"
              style={{
                backgroundColor: theme.accent,
                color: theme.background,
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
          placeholder={
            hasImages
              ? `${attachedImages.length} image${attachedImages.length > 1 ? 's' : ''} attached...`
              : disabled
              ? ''
              : 'Type a command or drag & drop images...'
          }
        />
      </div>
    </div>
  );
};

