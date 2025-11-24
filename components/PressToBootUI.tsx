import React from 'react';
import type { ThemeColors } from '../domain/Theme';

interface PressToBootUIProps {
  theme: ThemeColors;
}

export const PressToBootUI: React.FC<PressToBootUIProps> = ({ theme }) => (
  <div className="p-4 whitespace-pre-wrap flex flex-col items-center justify-center h-full">
    <div style={{ color: theme.system }}>SYSTEM READY. API KEY DETECTED.</div>
    <div className="mt-4 flex items-center">
      <span style={{ color: theme.prompt }} className="mr-2">{'>'}</span>
      <span className="uppercase">Press any key to boot</span>
      <span style={{ backgroundColor: theme.text }} className="w-3 h-5 inline-block cursor-blink ml-2"></span>
    </div>
  </div>
);










