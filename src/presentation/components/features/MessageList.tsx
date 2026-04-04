import React from 'react';
import { MessageContent } from './MessageContent';
import { ImageDisplay } from './ImageDisplay';
import { ModelService } from '../../../infrastructure/services/model.service';
import { MessageType, type Message } from '../../../domain/entities/message';
import type { ThemeColors } from '../../../domain/entities/theme';
import type { MessageListProps } from '../../../types/ui/components';

interface MessageRowProps {
  msg: Message;
  index: number;
  isLast: boolean;
  isStreaming: boolean;
  theme: ThemeColors;
  headerFontSize: number;
  commandInputFontSize: number;
  commandLabelFontSize: number;
  imageIndex: number;
  allImages: Array<{ src: string; alt: string }>;
  onImageLoad?: () => void;
}

const MessageRow: React.FC<MessageRowProps> = React.memo(({
  msg, index, isLast, isStreaming, theme,
  headerFontSize, commandInputFontSize, commandLabelFontSize,
  imageIndex, allImages, onImageLoad,
}) => {
  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';
  const isModel = msg.role === 'model';

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

  const modelLabel = ModelService.getDisplayName(msg.modelName) ?? msg.modelName ?? 'Unknown Model';
  const shortModelName = ModelService.getShortLabel(msg.modelName);

  const commandLabel = msg.command
    ? (msg.command.startsWith('/') ? msg.command.substring(1) : msg.command)
    : undefined;

  return (
    <div
      className="mb-4 rounded-md p-3"
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${borderColor}40`
      }}
    >
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

      <div
        className={`${isSystem ? 'opacity-90' : ''}`}
        style={isSystem ? { color: theme.system } : {}}
      >
        {commandLabel ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: theme.accent,
                  color: theme.background,
                  fontSize: `${commandLabelFontSize}px`
                }}
              >
                {commandLabel}
              </span>
            </div>
            {msg.commandInput && (
              <div className="pl-2 border-l-2 font-mono" style={{ borderColor: `${theme.accent}40`, color: theme.text, fontSize: `${commandInputFontSize}px` }}>
                <span style={{ color: theme.prompt }}>{'>'} </span>
                {msg.commandInput}
              </div>
            )}
          </div>
        ) : (
          (isUser || !msg.imageData || (msg.imageData && msg.text && !msg.text.startsWith('Generated image for:'))) && (
            <MessageContent text={msg.text} theme={theme} />
          )
        )}
      </div>

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
                    requestAnimationFrame(() => { onImageLoad?.(); });
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

      {msg.imageData && !msg.images && isUser && (
        <div className="mt-2">
          <img
            src={`data:${msg.imageMimeType || 'image/png'};base64,${msg.imageData}`}
            alt="User attached image"
            className="max-w-xs rounded border-2"
            style={{ borderColor: theme.accent }}
            onLoad={() => {
              requestAnimationFrame(() => { onImageLoad?.(); });
            }}
          />
        </div>
      )}

      {msg.type === MessageType.IMAGE && msg.imageData && (
        <div className="mt-2">
          <ImageDisplay
            base64Image={msg.imageData}
            prompt={msg.text}
            theme={theme}
            onImageLoad={onImageLoad}
            allImages={allImages}
            currentImageIndex={imageIndex >= 0 ? imageIndex : 0}
          />
        </div>
      )}

      {isStreaming && isModel && isLast && (
        <span
          style={{ backgroundColor: theme.text }}
          className="w-3 h-5 inline-block cursor-blink ml-1 align-middle"
        />
      )}

      {msg.sources && msg.sources.length > 0 && isLast && !isStreaming && (
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
});

MessageRow.displayName = 'MessageRow';

export const MessageList: React.FC<MessageListProps> = React.memo(({ messages, isStreaming, theme, fontSize, onImageLoad }) => {
  const headerFontSize = fontSize * 0.9;
  const commandInputFontSize = fontSize * 0.8;
  const commandLabelFontSize = fontSize * 0.6;

  const generatedImages = React.useMemo(() => {
    return messages
      .map((msg, msgIndex) => ({ msg, msgIndex }))
      .filter(({ msg }) =>
        msg.type === MessageType.IMAGE &&
        msg.imageData
      )
      .map(({ msg, msgIndex }) => {
        const match = msg.text.match(/Generated image for: "(.+)"/);
        const alt = match ? match[1] : msg.text || 'Generated image';
        return {
          src: `data:image/png;base64,${msg.imageData}`,
          alt,
          messageIndex: msgIndex,
        };
      });
  }, [messages]);

  // Pre-index: message index -> image gallery index (O(1) lookups)
  const imageIndexMap = React.useMemo(() => {
    const map = new Map<number, number>();
    generatedImages.forEach((img, galleryIdx) => {
      map.set(img.messageIndex, galleryIdx);
    });
    return map;
  }, [generatedImages]);

  const allImageSlides = React.useMemo(
    () => generatedImages.map(img => ({ src: img.src, alt: img.alt })),
    [generatedImages]
  );

  return (
    <>
      {messages.map((msg, index) => (
        <MessageRow
          key={msg.id}
          msg={msg}
          index={index}
          isLast={index === messages.length - 1}
          isStreaming={isStreaming}
          theme={theme}
          headerFontSize={headerFontSize}
          commandInputFontSize={commandInputFontSize}
          commandLabelFontSize={commandLabelFontSize}
          imageIndex={imageIndexMap.get(index) ?? -1}
          allImages={allImageSlides}
          onImageLoad={onImageLoad}
        />
      ))}
    </>
  );
});

MessageList.displayName = 'MessageList';
