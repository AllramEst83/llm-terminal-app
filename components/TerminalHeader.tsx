import React from 'react';
import type { ThemeColors } from '../domain/Theme';

interface TerminalHeaderProps {
  theme: ThemeColors;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({ theme }) => (
  <div 
    className="p-2 flex items-center justify-between border-b-2 header-lines"
    style={{ backgroundColor: theme.headerBg, color: theme.headerText, borderColor: theme.accent }}
  >
    <span className="text-lg">C:\\{'>'} GEMINI_CHAT.EXE</span>
    <div className="flex space-x-2">
      <div className="w-4 h-4 border flex items-center justify-center text-xs" style={{ borderColor: theme.text }}>_</div>
      <div className="w-4 h-4 border flex items-center justify-center text-xs" style={{ borderColor: theme.text }}>[]</div>
      <div className="w-4 h-4 bg-red-500 border flex items-center justify-center text-xs text-white" style={{ borderColor: theme.text }}>X</div>
    </div>
  </div>
);

