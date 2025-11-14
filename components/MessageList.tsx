import React from 'react';
import { Message } from '../domain/Message';
import { MessageContent } from './MessageContent';
import type { ThemeColors } from '../domain/Theme';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  theme: ThemeColors;
  endOfMessagesRef?: React.RefObject<HTMLDivElement>;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isStreaming, theme, endOfMessagesRef }) => {
  return (
    <>
      {messages.map((msg, index) => (
        <div key={msg.id} className="mb-2 whitespace-pre-wrap" style={msg.role === 'system' ? { color: theme.system } : {}}>
          {msg.timestamp && <span className="mr-2" style={{ color: theme.accent, opacity: 0.6 }}>{msg.timestamp}</span>}
          {msg.role === 'user' ? 
            <span style={{ color: theme.prompt }}>{'>'} </span>
            : <span className="mr-1"></span>
          }
          <MessageContent text={msg.text} />
          
          {msg.sources && msg.sources.length > 0 && index === messages.length - 1 && !isStreaming && (
            <div className="mt-2 text-sm" style={{ color: theme.accent }}>
              <div>SOURCES:</div>
              <ul className="list-none pl-4">
                {msg.sources.map((source, i) => (
                  <li key={`${msg.id}-source-${i}`} className="truncate">
                    <span>[{i + 1}] </span>
                    <a
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:opacity-75"
                    >
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isStreaming && msg.role === 'model' && index === messages.length - 1 && (
            <span style={{ backgroundColor: theme.text }} className="w-3 h-5 inline-block cursor-blink ml-1 align-middle"></span>
          )}
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </>
  );
};

