import { StorageService } from './StorageService';

const API_KEY_STORAGE_KEY = 'terminal_apiKey';

export class ApiKeyService {
  static isStudioEnvironment(): boolean {
    return !!(window as any).aistudio;
  }

  static getEnvApiKey(): string {
    // Check for environment variable from .env.local (via Vite)
    const envKey = import.meta.env?.GEMINI_API_KEY || '';
    return envKey;
  }

  static async hasApiKey(): Promise<boolean> {
    if (this.isStudioEnvironment()) {
      return await (window as any).aistudio.hasSelectedApiKey();
    }
    // Check environment variable first
    const envKey = this.getEnvApiKey();
    if (envKey.length > 0) {
      return true;
    }
    // Fall back to stored key
    const savedKey = StorageService.getString(API_KEY_STORAGE_KEY, '');
    return savedKey.length > 0;
  }

  static async getApiKey(): Promise<string> {
    if (this.isStudioEnvironment()) {
      return process.env.API_KEY || '';
    }
    // Check environment variable first (from .env.local)
    const envKey = this.getEnvApiKey();
    if (envKey.length > 0) {
      return envKey;
    }
    // Fall back to stored key
    return StorageService.getString(API_KEY_STORAGE_KEY, '');
  }

  static setApiKey(apiKey: string): boolean {
    if (!this.isStudioEnvironment()) {
      return StorageService.setString(API_KEY_STORAGE_KEY, apiKey);
    }
    return true; // In Studio env, consider it "saved" (handled by Studio)
  }

  static removeApiKey(): void {
    if (!this.isStudioEnvironment()) {
      StorageService.remove(API_KEY_STORAGE_KEY);
    }
  }

  static async openKeySelector(): Promise<void> {
    if (this.isStudioEnvironment()) {
      await (window as any).aistudio.openSelectKey();
    }
  }
}

