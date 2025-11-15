import React from 'react';
import { Message } from '../domain/Message';
import { MessageContent } from './MessageContent';
import { ImageDisplay } from './ImageDisplay';
import type { ThemeColors } from '../domain/Theme';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  theme: ThemeColors;
  endOfMessagesRef?: React.RefObject<HTMLDivElement>;
  fontSize: number;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isStreaming, theme, endOfMessagesRef, fontSize }) => {
  const headerFontSizeMultiplier = 0.6;
  const headerFontSize = fontSize * headerFontSizeMultiplier;
  const systemFontSizeMultiplier = 0.6;
  const systemFontSize = fontSize * systemFontSizeMultiplier;
  
  return (
    <>
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const isSystem = msg.role === 'system';
        const isModel = msg.role === 'model';
        const isLastMessage = index === messages.length - 1;
        
        return (
          <div 
            key={msg.id} 
            className={`mb-4 ${isUser ? 'pb-2' : 'pb-3'} ${isModel ? 'border-l-2 pl-3' : ''}`}
            style={{ 
              borderLeftColor: isModel ? `${theme.accent}40` : 'transparent',
              borderLeftWidth: isModel ? '2px' : '0'
            }}
          >
            {/* Message Header */}
            <div className="flex items-center gap-2 mb-1.5">
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
                    fontSize: `${systemFontSize}px`
                  }}
                >
                  SYSTEM
                </span>
              )}
            </div>
            
            {/* Message Content */}
            <div 
              className={`${isSystem ? 'opacity-90' : ''}`}
              style={isSystem ? { color: theme.system } : {}}
            >
              <MessageContent text={msg.text} theme={theme} />
            </div>
            
            {/* Image Display */}
            {msg.imageData && (
              <div className="mt-2">
                <ImageDisplay base64Image={msg.imageData} prompt={msg.text} theme={theme} />
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

