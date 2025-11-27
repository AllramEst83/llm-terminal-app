import React, { useState } from 'react';
import type { ThemeColors } from '../../../domain/entities/theme';
import { ApiKeyService } from '../../../infrastructure/services/api-key.service';

interface SecureApiKeyPromptProps {
  theme: ThemeColors;
  onSuccess: () => Promise<void> | void;
}

export const SecureApiKeyPrompt: React.FC<SecureApiKeyPromptProps> = ({ theme, onSuccess }) => {
  const [apiKey, setApiKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!apiKey.trim()) {
      setStatus('error');
      setMessage('API key is required.');
      return;
    }

    if (apiKey !== confirmKey) {
      setStatus('error');
      setMessage('Keys do not match. Please confirm the same value.');
      return;
    }

    try {
      setStatus('saving');
      await ApiKeyService.saveApiKey(apiKey.trim());
      setStatus('success');
      setMessage('API key stored securely. Booting terminal...');
      setApiKey('');
      setConfirmKey('');
      await onSuccess();
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Failed to store API key. Please try again.'
      );
    }
  };

  return (
    <div className="p-4 space-y-4" style={{ color: theme.text }}>
      <div className="whitespace-pre-wrap text-sm leading-6">
        SYSTEM: Gemini access key missing.
        {'\n'}
        Enter your Google AI API key to continue. The key is encrypted and stored server-side; it never remains in the browser.
        {'\n\n'}
        Obtain a key at ai.google.dev, ensure billing is enabled, then paste it below.
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-xs tracking-widest uppercase">
          API Key
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            className="w-full mt-1 bg-transparent border border-current px-2 py-1 focus:outline-none"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx"
            autoComplete="off"
          />
        </label>
        <label className="block text-xs tracking-widest uppercase">
          Confirm Key
          <input
            type="password"
            value={confirmKey}
            onChange={(event) => setConfirmKey(event.target.value)}
            className="w-full mt-1 bg-transparent border border-current px-2 py-1 focus:outline-none"
            placeholder="Re-enter API key"
            autoComplete="off"
          />
        </label>
        <button
          type="submit"
          className="w-full border-2 px-3 py-2 uppercase tracking-[0.3em]"
          style={{ borderColor: theme.accent, color: theme.accent }}
          disabled={status === 'saving'}
        >
          {status === 'saving' ? 'Encrypting...' : 'Store Key'}
        </button>
      </form>
      {message && (
        <p
          role="status"
          className={`text-sm ${status === 'error' ? 'text-red-400' : 'text-green-300'}`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

