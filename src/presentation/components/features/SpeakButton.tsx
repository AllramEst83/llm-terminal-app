import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TtsService, type TtsState } from '../../../infrastructure/services/tts.service';
import type { ThemeColors } from '../../../domain/entities/theme';

interface SpeakButtonProps {
  text: string;
  apiKey: string;
  theme: ThemeColors;
  accentColor: string;
}

const SpeakerIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const StopIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

const LoadingSpinner: React.FC<{ size?: number; color: string }> = ({ size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10" opacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75">
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
    </path>
  </svg>
);

export const SpeakButton: React.FC<SpeakButtonProps> = ({ text, apiKey, theme, accentColor }) => {
  const [state, setState] = useState<TtsState>('idle');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleStateChange = useCallback((newState: TtsState) => {
    if (mountedRef.current) {
      setState(newState);
    }
  }, []);

  const handleClick = useCallback(async () => {
    if (state === 'playing' || state === 'loading') {
      TtsService.stopCurrent();
      setState('idle');
      return;
    }

    if (!text?.trim() || !apiKey) return;

    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' code block ')
      .replace(/`[^`]+`/g, (match) => match.slice(1, -1))
      .replace(/#{1,6}\s/g, '')
      .replace(/[*_~]{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim();

    if (!cleanText) return;

    const maxLen = 4000;
    const truncated = cleanText.length > maxLen
      ? cleanText.slice(0, maxLen) + '...'
      : cleanText;

    await TtsService.speak(truncated, apiKey, handleStateChange);
  }, [text, apiKey, state, handleStateChange]);

  const title = state === 'loading'
    ? 'Generating speech...'
    : state === 'playing'
      ? 'Stop'
      : 'Listen';

  return (
    <button
      onClick={handleClick}
      title={title}
      disabled={!text?.trim() || !apiKey}
      className="flex items-center justify-center rounded transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        color: accentColor,
        padding: '4px',
        opacity: state === 'idle' ? 0.5 : 1,
        background: 'transparent',
        border: 'none',
      }}
      onMouseEnter={(e) => {
        if (text?.trim() && apiKey) {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.textShadow = `0 0 8px ${accentColor}60`;
        }
      }}
      onMouseLeave={(e) => {
        if (state === 'idle') {
          e.currentTarget.style.opacity = '0.5';
          e.currentTarget.style.textShadow = 'none';
        }
      }}
    >
      {state === 'loading' ? (
        <LoadingSpinner size={14} color={accentColor} />
      ) : state === 'playing' ? (
        <StopIcon size={14} />
      ) : (
        <SpeakerIcon size={14} />
      )}
    </button>
  );
};
