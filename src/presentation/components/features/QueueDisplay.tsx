import React from 'react';
import type { QueueItem } from '../../../domain/entities/queue-item';
import type { ThemeColors } from '../../../domain/entities/theme';

interface QueueDisplayProps {
  queue: QueueItem[];
  onRemove: (itemId: string) => void;
  onClear: () => void;
  theme: ThemeColors;
}

export const QueueDisplay: React.FC<QueueDisplayProps> = ({
  queue,
  onRemove,
  onClear,
  theme,
}) => {
  if (queue.length === 0) {
    return null;
  }

  const truncateText = (text: string, maxLength: number = 50): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getStatusColor = (status: QueueItem['status']): string => {
    switch (status) {
      case 'pending':
        return theme.accent;
      case 'processing':
        return theme.ai;
      case 'cancelled':
        return theme.system;
      default:
        return theme.text;
    }
  };

  const getStatusLabel = (status: QueueItem['status']): string => {
    switch (status) {
      case 'pending':
        return 'PENDING';
      case 'processing':
        return 'PROCESSING';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return '';
    }
  };

  return (
    <div
      className="border-t-2 px-2 py-2"
      style={{
        borderColor: theme.accent,
        backgroundColor: `${theme.background}dd`,
        maxHeight: '200px',
        overflowY: 'auto',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: theme.accent }}
          >
            QUEUE ({queue.length})
          </span>
          {queue.some(item => item.isProcessing()) && (
            <span
              className="text-xs font-bold uppercase tracking-wider animate-pulse"
              style={{ color: theme.ai }}
            >
              PROCESSING...
            </span>
          )}
        </div>
        {queue.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs px-2 py-1 rounded font-bold uppercase tracking-wider hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: theme.system,
              color: theme.background,
            }}
            title="Clear all items from queue"
          >
            CLEAR
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {queue.map((item, index) => {
          const isProcessing = item.isProcessing();
          const statusColor = getStatusColor(item.status);
          const statusLabel = getStatusLabel(item.status);

          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 px-2 py-1 rounded"
              style={{
                backgroundColor: isProcessing
                  ? `${theme.ai}20`
                  : `${theme.accent}10`,
                border: `1px solid ${statusColor}40`,
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span
                  className="text-xs font-mono font-bold flex-shrink-0"
                  style={{ color: theme.accent }}
                >
                  #{index + 1}
                </span>
                <span
                  className="text-xs font-mono uppercase tracking-wider flex-shrink-0"
                  style={{ color: statusColor }}
                >
                  [{item.type}]
                </span>
                {statusLabel && (
                  <span
                    className="text-xs font-bold uppercase tracking-wider flex-shrink-0"
                    style={{ color: statusColor }}
                  >
                    {statusLabel}
                  </span>
                )}
                <span
                  className="text-xs truncate flex-1"
                  style={{ color: theme.text }}
                  title={item.text}
                >
                  {truncateText(item.text, 60)}
                </span>
                {item.attachedImages.length > 0 && (
                  <span
                    className="text-xs font-bold flex-shrink-0"
                    style={{ color: theme.accent }}
                  >
                    [{item.attachedImages.length} IMG{item.attachedImages.length > 1 ? 'S' : ''}]
                  </span>
                )}
              </div>
              {!isProcessing && (
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-xs px-1 py-0.5 rounded font-bold hover:opacity-80 transition-opacity flex-shrink-0"
                  style={{
                    backgroundColor: theme.system,
                    color: theme.background,
                  }}
                  title={`Remove "${truncateText(item.text, 30)}" from queue`}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

