import React from 'react';
import { Message } from '../domain/Message';
import { MessageContent } from './MessageContent';
import { ImageDisplay } from './ImageDisplay';
import type { ThemeColors } from '../domain/Theme';
import { getShortModelName } from '../utils/modelUtils';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  theme: ThemeColors;
  endOfMessagesRef?: React.RefObject<HTMLDivElement>;
  fontSize: number;
  onImageLoad?: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isStreaming, theme, endOfMessagesRef, fontSize, onImageLoad }) => {
  const headerFontSizeMultiplier = 0.9;
  const headerFontSize = fontSize * headerFontSizeMultiplier;
  
  return (
    <>
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const isSystem = msg.role === 'system';
        const isModel = msg.role === 'model';
        const isLastMessage = index === messages.length - 1;
        
        // Determine card background and border colors based on role
        const cardBg = isUser 
          ? (theme.userCardBg || theme.background)
          : isModel 
          ? (theme.aiCardBg || theme.background)
          : (theme.systemCardBg || theme.background);
        
        const borderColor = isUser 
          ? theme.prompt 
          : isModel 
          ? theme.ai 
          : theme.system;
        
        const modelLabel = msg.modelName ?? 'Unknown Model';
        const shortModelName = getShortModelName(msg.modelName);

        return (
          <div 
            key={msg.id} 
            className="mb-4 rounded-md p-3"
            style={{ 
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}40`
            }}
          >
            {/* Message Header */}
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {msg.timestamp && (
                  <span 
                    className="font-mono opacity-60" 
                    style={{ 
                      color: theme.accent,
                      fontSize: `${headerFontSize}px`
                    }}
                  >
                    {msg.timestamp}
                  </span>
                )}
                {isUser && (
                  <>
                    <span 
                      className="font-bold text-sm" 
                      style={{ color: theme.prompt }}
                    >
                      {'>'}
                    </span>
                    <span 
                      className="uppercase tracking-wider font-semibold" 
                      style={{ 
                        color: theme.prompt,
                        fontSize: `${headerFontSize}px`
                      }}
                    >
                      User
                    </span>
                  </>
                )}
                {isModel && (
                  <span 
                    className="uppercase tracking-wider font-bold" 
                    style={{ 
                      color: theme.ai,
                      fontSize: `${headerFontSize}px`,
                      textShadow: `0 0 8px ${theme.ai}40`
                    }}
                  >
                    AI
                  </span>
                )}
                {isSystem && (
                  <span 
                    className="uppercase tracking-wider opacity-70" 
                    style={{ 
                      color: theme.system,
                      fontSize: `${headerFontSize}px`
                    }}
                  >
                    SYSTEM
                  </span>
                )}
              </div>
              {isModel && (
                <>
                  {/* Mobile: Short version */}
                  <span
                    className="md:hidden font-mono uppercase tracking-widest text-right whitespace-nowrap"
                    style={{ 
                      color: theme.ai,
                      fontSize: `${Math.max(headerFontSize * 0.8, 10)}px`,
                      textShadow: `0 0 6px ${theme.ai}30`
                    }}
                  >
                    Model: {shortModelName}
                  </span>
                  {/* Desktop: Full version */}
                  <span
                    className="hidden md:inline font-mono uppercase tracking-widest text-right whitespace-nowrap"
                    style={{ 
                      color: theme.ai,
                      fontSize: `${Math.max(headerFontSize * 0.8, 10)}px`,
                      textShadow: `0 0 6px ${theme.ai}30`
                    }}
                  >
                    MODEL: {modelLabel}
                  </span>
                </>
              )}
            </div>
            
            {/* Message Content */}
            <div 
              className={`${isSystem ? 'opacity-90' : ''}`}
              style={isSystem ? { color: theme.system } : {}}
            >
              {/* Show text for user messages with images, or any message without imageData from /image command */}
              {(isUser || !msg.imageData || (msg.imageData && msg.text && !msg.text.startsWith('Generated image for:'))) && (
                <MessageContent text={msg.text} theme={theme} />
              )}
            </div>
            
            {/* Multiple Images Display - For user-attached images (new format) */}
            {msg.images && msg.images.length > 0 && isUser && (
              <div className="mt-2">
                <div 
                  className="text-xs font-bold mb-2 opacity-70"
                  style={{ color: theme.accent }}
                >
                  {msg.images.length} IMAGE{msg.images.length > 1 ? 'S' : ''} ATTACHED:
                </div>
                <div className="flex flex-wrap gap-2">
                  {msg.images.map((image, idx) => (
                    <div key={idx} className="relative">
                      <img 
                        src={`data:${image.mimeType};base64,${image.base64Data}`}
                        alt={image.fileName || `Image ${idx + 1}`}
                        className="max-w-xs rounded border-2"
                        style={{ borderColor: theme.accent }}
                        onLoad={() => {
                          requestAnimationFrame(() => {
                            onImageLoad?.();
                          });
                        }}
                      />
                      <div 
                        className="absolute top-1 left-1 px-2 py-0.5 rounded text-xs font-bold"
                        style={{
                          backgroundColor: `${theme.background}dd`,
                          color: theme.accent,
                          border: `1px solid ${theme.accent}`,
                        }}
                      >
                        {idx + 1}
                      </div>
                      {image.fileName && (
                        <div 
                          className="text-xs mt-1 opacity-70 truncate max-w-xs"
                          style={{ color: theme.text }}
                        >
                          {image.fileName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Single Image Display - For user-attached images (old format - backward compatibility) */}
            {msg.imageData && !msg.images && isUser && (
              <div className="mt-2">
                <img 
                  src={`data:${msg.imageMimeType || 'image/png'};base64,${msg.imageData}`}
                  alt="User attached image"
                  className="max-w-xs rounded border-2"
                  style={{ borderColor: theme.accent }}
                  onLoad={() => {
                    requestAnimationFrame(() => {
                      onImageLoad?.();
                    });
                  }}
                />
              </div>
            )}
            
            {/* Image Display - For generated images from /image command */}
            {msg.imageData && !isUser && (
              <div className="mt-2">
                <ImageDisplay base64Image={msg.imageData} prompt={msg.text} theme={theme} onImageLoad={onImageLoad} />
              </div>
            )}
            
            {/* Streaming Cursor */}
            {isStreaming && isModel && isLastMessage && (
              <span 
                style={{ backgroundColor: theme.text }} 
                className="w-3 h-5 inline-block cursor-blink ml-1 align-middle"
              />
            )}
            
            {/* Sources */}
            {msg.sources && msg.sources.length > 0 && isLastMessage && !isStreaming && (
              <div 
                className="mt-3 pt-2 border-t" 
                style={{ 
                  color: theme.accent,
                  borderTopColor: `${theme.accent}40`
                }}
              >
                <div className="text-xs uppercase tracking-wider mb-2 opacity-80">SOURCES:</div>
                <ul className="list-none space-y-1">
                  {msg.sources.map((source, i) => (
                    <li key={`${msg.id}-source-${i}`} className="text-sm">
                      <span className="opacity-70">[{i + 1}] </span>
                      <a
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:opacity-75 transition-opacity"
                        style={{ color: theme.accent }}
                      >
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
      <div ref={endOfMessagesRef} />
    </>
  );
};

