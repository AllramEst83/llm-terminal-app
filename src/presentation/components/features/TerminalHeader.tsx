import React, { useState, useRef, useEffect } from 'react';
import { TokenCounter } from './TokenCounter';
import { ModelService } from '../../../infrastructure/services/model.service';
import type { TerminalHeaderProps } from '../../../types/ui/components';

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  theme,
  modelName,
  thinkingEnabled,
  inputTokenCount,
  systemInfoVisible,
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);

  const maxTokens = ModelService.getContextLimit(modelName) ?? ModelService.getDefaultModel().contextLimit;
  const modelDisplayName = ModelService.getDisplayName(modelName) ?? (modelName?.trim() ? modelName : 'Unknown Model');
  const compactModelLabel = (() => {
    const candidates = [
      ModelService.getDisplayName(modelName),
      modelName,
      ModelService.getShortLabel(modelName),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (candidates.includes('flash')) {
      return 'Flash';
    }
    if (candidates.includes('pro')) {
      return 'Pro';
    }
    return ModelService.getShortLabel(modelName);
  })();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        popupRef.current &&
        iconRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !iconRef.current.contains(event.target as Node)
      ) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showPopup]);

  useEffect(() => {
    if (!systemInfoVisible && showPopup) {
      setShowPopup(false);
    }
  }, [systemInfoVisible, showPopup]);

  return (
    <div 
      className="p-2 flex items-center justify-between border-b-2 header-lines relative"
      style={{ backgroundColor: theme.headerBg, color: theme.headerText, borderColor: theme.accent }}
    >
      <div className="flex items-center min-w-0 text-lg font-mono">
        <span
          className="hidden sm:inline truncate"
          style={{ color: theme.accent }}
        >
          {modelDisplayName}
        </span>
        <span
          className="sm:hidden"
          style={{ color: theme.accent }}
        >
          {compactModelLabel}
        </span>
      </div>
      {systemInfoVisible && (
        <div className="hidden md:flex items-center space-x-3 text-sm">
          <span style={{ color: theme.headerText, opacity: 0.8 }}>Thinking:</span>
          <span style={{ color: theme.accent }}>{thinkingEnabled ? 'ON' : 'OFF'}</span>
          <span style={{ color: theme.headerText, opacity: 0.6 }}>|</span>
          <TokenCounter inputTokens={inputTokenCount} maxTokens={maxTokens} theme={theme} />
        </div>
      )}
      <div className="md:hidden relative">
        <button
          ref={iconRef}
          onClick={() => systemInfoVisible && setShowPopup(!showPopup)}
          className="p-1 hover:opacity-80 transition-opacity"
          style={{ color: theme.headerText, opacity: systemInfoVisible ? 1 : 0.4 }}
          aria-label="Show model info"
          disabled={!systemInfoVisible}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        {showPopup && systemInfoVisible && (
          <div
            ref={popupRef}
            className="absolute right-0 top-full mt-2 rounded shadow-lg z-50 w-[280px]"
            style={{
              backgroundColor: theme.background,
              color: theme.text,
              border: `2px solid ${theme.accent}`,
            }}
          >
            {/* Header */}
            <div 
              className="px-4 py-2 border-b"
              style={{ borderColor: theme.accent, opacity: 0.3 }}
            >
              <h3 
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: theme.accent }}
              >
                SYSTEM INFO
              </h3>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Model Section */}
              <div className="space-y-1">
                <div 
                  className="text-xs uppercase tracking-wide"
                  style={{ color: theme.text, opacity: 0.7 }}
                >
                  Model
                </div>
                <div 
                  className="text-sm font-mono truncate"
                  style={{ color: theme.accent }}
                >
                  {modelDisplayName}
                </div>
              </div>

              {/* Thinking Section */}
              <div className="space-y-1">
                <div 
                  className="text-xs uppercase tracking-wide"
                  style={{ color: theme.text, opacity: 0.7 }}
                >
                  Thinking
                </div>
                <div className="flex items-center">
                  <button
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      thinkingEnabled ? 'opacity-100' : 'opacity-60'
                    }`}
                    style={{
                      backgroundColor: thinkingEnabled ? theme.accent : 'transparent',
                      color: thinkingEnabled ? theme.background : theme.text,
                      border: `1px solid ${theme.accent}`,
                    }}
                    disabled
                  >
                    {thinkingEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div 
                className="h-px"
                style={{ backgroundColor: theme.accent, opacity: 0.3 }}
              />

              {/* Token Section */}
              <div className="space-y-2">
                <div 
                  className="text-xs uppercase tracking-wide"
                  style={{ color: theme.text, opacity: 0.7 }}
                >
                  Token Usage
                </div>
                <div className="flex items-center justify-start">
                  <TokenCounter inputTokens={inputTokenCount} maxTokens={maxTokens} theme={theme} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

