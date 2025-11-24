import React from 'react';
import type { ThemeColors } from '../../../domain/entities/theme';

interface TokenCounterProps {
  inputTokens: number;
  maxTokens: number;
  theme: ThemeColors;
}

export const TokenCounter: React.FC<TokenCounterProps> = ({ inputTokens, maxTokens, theme }) => {
  const percentage = Math.min((inputTokens / maxTokens) * 100, 100);
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (): string => {
    if (percentage >= 90) return '#ff4444';
    if (percentage >= 75) return '#ffaa00';
    return theme.accent;
  };

  const color = getColor();

  return (
    <div className="flex items-center space-x-2">
      <div className="relative inline-flex items-center justify-center">
        <svg width="40" height="40" className="transform -rotate-90">
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke={theme.headerText}
            strokeWidth="3"
            fill="none"
            opacity="0.2"
          />
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
            }}
          />
        </svg>
        <div
          className="absolute text-xs font-bold"
          style={{ color: color }}
        >
          {percentage >= 1 ? Math.round(percentage) : '<1'}%
        </div>
      </div>
      <div className="flex flex-col text-xs">
        <span style={{ color: theme.headerText, opacity: 0.8 }}>Tokens</span>
        <span style={{ color: color }} className="font-mono">
          {inputTokens.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

