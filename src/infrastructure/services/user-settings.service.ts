import type { Settings } from '../../domain/entities/settings';

const SETTINGS_ENDPOINT = '/functions/v1/user-settings';

export interface RemoteSettingsPayload {
  settings: Partial<Settings>;
  version?: string;
}

export class UserSettingsService {
  static async fetch(): Promise<RemoteSettingsPayload | null> {
    try {
      const response = await fetch(SETTINGS_ENDPOINT, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as RemoteSettingsPayload;
      return data;
    } catch (error) {
      console.warn('Failed to fetch remote settings', error);
      return null;
    }
  }

  static async save(settings: Settings): Promise<string | undefined> {
    try {
      const response = await fetch(SETTINGS_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Settings endpoint returned ${response.status}`);
      }

      const payload = (await response.json()) as { version?: string };
      return payload.version;
    } catch (error) {
      console.warn('Failed to persist remote settings', error);
      return undefined;
    }
  }
}

