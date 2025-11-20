import React from 'react';
import type { ThemeColors } from '../domain/Theme';

interface ApiKeySelectionUIProps {
  theme: ThemeColors;
  onSelectKey: () => void;
}

export const ApiKeySelectionUI: React.FC<ApiKeySelectionUIProps> = ({ theme, onSelectKey }) => (
  <div className="p-4">
    <div className="whitespace-pre-wrap">
      SYSTEM: API Key not selected.
      {'\n'}
      Please select a Google AI Studio API Key to continue.
      {'\n\n'}
      This app uses the Gemini API. For more information on billing, see ai.google.dev/gemini-api/docs/billing.
    </div>
    <div className="mt-4 flex items-center">
      <span style={{ color: theme.prompt }} className="mr-2">{'>'}</span>
      <button 
        onClick={onSelectKey}
        style={{ backgroundColor: theme.accent, color: theme.background }}
        className="px-2 focus:outline-none uppercase"
      >
        Select API Key
      </button>
      <span style={{ backgroundColor: theme.text }} className="w-3 h-5 inline-block cursor-blink ml-2"></span>
    </div>
  </div>
);





