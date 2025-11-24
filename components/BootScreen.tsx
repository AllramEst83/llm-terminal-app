import React from 'react';
import type { ThemeColors } from '../domain/Theme';

interface BootScreenProps {
  sequence: string[];
  theme: ThemeColors;
}

export const BootScreen: React.FC<BootScreenProps> = ({ sequence, theme }) => (
  <div className="p-4 whitespace-pre-wrap" style={{ color: theme.system }}>
    {sequence.map((line, index) => (
      <div key={index}>{line}</div>
    ))}
    <div className="flex items-center">
      <span style={{ backgroundColor: theme.text }} className="w-3 h-5 inline-block cursor-blink"></span>
    </div>
  </div>
);










