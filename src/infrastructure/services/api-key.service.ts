const EDGE_BASE = '/functions/v1';
const API_KEY_ENDPOINT = `${EDGE_BASE}/save-api-key`;

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export class ApiKeyService {
  static async hasApiKey(): Promise<boolean> {
    try {
      const data = await request<{ hasKey?: boolean }>(API_KEY_ENDPOINT, {
        method: 'GET',
      });
      return Boolean(data.hasKey);
    } catch (error) {
      console.warn('Failed to check API key status:', error);
      return false;
    }
  }

  static async saveApiKey(apiKey: string): Promise<void> {
    await request(API_KEY_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    });
  }

  static async deleteApiKey(): Promise<void> {
    await request(API_KEY_ENDPOINT, {
      method: 'DELETE',
    });
  }
}
