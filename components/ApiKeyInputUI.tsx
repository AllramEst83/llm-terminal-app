import React, { useState, useEffect, useRef } from 'react';
import type { ThemeColors } from '../domain/Theme';

interface ApiKeyInputUIProps {
  theme: ThemeColors;
  onApiKeySubmit: (key: string) => void;
}

export const ApiKeyInputUI: React.FC<ApiKeyInputUIProps> = ({ theme, onApiKeySubmit }) => {
  const [localApiKey, setLocalApiKey] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localApiKey.trim()) {
      onApiKeySubmit(localApiKey.trim());
    }
  };
  
  return (
    <div className="p-4">
      <div className="whitespace-pre-wrap">
        SYSTEM: Google AI API Key not found.
        {'\n'}
        Please paste your API key below and press Enter.
        {'\n\n'}
        You can get a key from Google AI Studio.
        {'\n'}
        This app uses the Gemini API. For more information on billing, see ai.google.dev/gemini-api/docs/billing.
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex items-center">
        <span style={{ color: theme.prompt }} className="mr-2">{'>'}</span>
        <input
          ref={inputRef}
          type="password"
          value={localApiKey}
          onChange={(e) => setLocalApiKey(e.target.value)}
          className="bg-transparent border-none w-full focus:outline-none"
          style={{ color: theme.text }}
          autoFocus
          placeholder="Paste your API key here..."
        />
      </form>
    </div>
  );
};










