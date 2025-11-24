import { StorageService } from '../storage/storage.service';

const API_KEY_STORAGE_KEY = 'terminal_apiKey';

export class ApiKeyService {
  static isStudioEnvironment(): boolean {
    return !!(window as unknown).aistudio;
  }

  static getEnvApiKey(): string {
    const envKey = import.meta.env?.GEMINI_API_KEY || '';
    return envKey;
  }

  static async hasApiKey(): Promise<boolean> {
    if (this.isStudioEnvironment()) {
      return await (window as unknown).aistudio.hasSelectedApiKey();
    }
    const envKey = this.getEnvApiKey();
    if (envKey.length > 0) {
      return true;
    }
    const savedKey = StorageService.getString(API_KEY_STORAGE_KEY, '');
    return savedKey.length > 0;
  }

  static async getApiKey(): Promise<string> {
    if (this.isStudioEnvironment()) {
      return process.env.API_KEY || '';
    }
    const envKey = this.getEnvApiKey();
    if (envKey.length > 0) {
      return envKey;
    }
    return StorageService.getString(API_KEY_STORAGE_KEY, '');
  }

  static setApiKey(apiKey: string): boolean {
    if (!this.isStudioEnvironment()) {
      return StorageService.setString(API_KEY_STORAGE_KEY, apiKey);
    }
    return true;
  }

  static removeApiKey(): void {
    if (!this.isStudioEnvironment()) {
      StorageService.remove(API_KEY_STORAGE_KEY);
    }
  }

  static async openKeySelector(): Promise<void> {
    if (this.isStudioEnvironment()) {
      await (window as unknown).aistudio.openSelectKey();
    }
  }
}

