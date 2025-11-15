import React, { useState, useRef, useEffect } from 'react';
import type { ThemeColors } from '../domain/Theme';

interface TerminalHeaderProps {
  theme: ThemeColors;
  modelName: string;
  thinkingEnabled: boolean;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({ theme, modelName, thinkingEnabled }) => {
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);

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

  return (
    <div 
      className="p-2 flex items-center justify-between border-b-2 header-lines relative"
      style={{ backgroundColor: theme.headerBg, color: theme.headerText, borderColor: theme.accent }}
    >
      <span className="text-lg">C:\\{'>'} GEMINI_CHAT.EXE</span>
      <div className="hidden md:flex items-center space-x-2 text-sm">
        <span style={{ color: theme.headerText, opacity: 0.8 }}>Model:</span>
        <span style={{ color: theme.accent }}>{modelName}</span>
        <span style={{ color: theme.headerText, opacity: 0.6 }}>|</span>
        <span style={{ color: theme.headerText, opacity: 0.8 }}>Thinking:</span>
        <span style={{ color: theme.accent }}>{thinkingEnabled ? 'ON' : 'OFF'}</span>
      </div>
      <div className="md:hidden relative">
        <button
          ref={iconRef}
          onClick={() => setShowPopup(!showPopup)}
          className="p-1 hover:opacity-80 transition-opacity"
          style={{ color: theme.headerText }}
          aria-label="Show model info"
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
        {showPopup && (
          <div
            ref={popupRef}
            className="absolute right-0 top-full mt-2 p-3 rounded shadow-lg z-50 min-w-[200px]"
            style={{
              backgroundColor: theme.background,
              color: theme.text,
              border: `2px solid ${theme.accent}`,
            }}
          >
            <div className="flex flex-col space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span style={{ color: theme.text, opacity: 0.8 }}>Model:</span>
                <span style={{ color: theme.accent }}>{modelName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span style={{ color: theme.text, opacity: 0.8 }}>Thinking:</span>
                <span style={{ color: theme.accent }}>{thinkingEnabled ? 'ON' : 'OFF'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

