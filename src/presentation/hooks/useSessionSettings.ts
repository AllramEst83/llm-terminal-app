import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings } from '../../domain/entities/settings';
import { ThemeService } from '../../infrastructure/services/theme.service';
import { TokenCountService } from '../../infrastructure/services/token-count.service';
import { ManageSettingsUseCase } from '../../application/use-cases/manage-settings.use-case';
import type { ThemeColors } from '../../domain/entities/theme';

export function useSessionSettings(sessionId: string, apiKey: string) {
  const [settings, setSettings] = useState<Settings>(Settings.createDefault());
  const [theme, setTheme] = useState<ThemeColors>(ThemeService.getDefaultTheme());
  const isInitializedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    isInitializedRef.current = false;

    const initSession = async () => {
      const loaded = await new ManageSettingsUseCase(sessionId).loadSettings();
      if (cancelled) return;
      setSettings(loaded);
      setTheme(ThemeService.getTheme(loaded.themeName));
      TokenCountService.initializeSessionStorage(sessionId);
      isInitializedRef.current = true;
    };
    initSession();

    return () => { cancelled = true; };
  }, [sessionId]);

  useEffect(() => {
    if (!isInitializedRef.current || !apiKey) return;
    setSettings(prev => (prev.apiKey === apiKey ? prev : prev.withApiKey(apiKey)));
  }, [apiKey]);

  useEffect(() => {
    if (!isInitializedRef.current) return;

    const save = async () => {
      await new ManageSettingsUseCase(sessionId).saveSettings(settings, { applyTheme: false });
      setTheme(ThemeService.getTheme(settings.themeName));
    };
    save();
  }, [settings, sessionId]);

  const updateSettings = useCallback((updater: (prev: Settings) => Settings) => {
    setSettings(updater);
  }, []);

  return { settings, setSettings, updateSettings, theme, isInitializedRef };
}
