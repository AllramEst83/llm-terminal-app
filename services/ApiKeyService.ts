import { StorageService } from './StorageService';

const API_KEY_STORAGE_KEY = 'terminal_apiKey';

export class ApiKeyService {
  static isStudioEnvironment(): boolean {
    return !!(window as any).aistudio;
  }

  static async hasApiKey(): Promise<boolean> {
    if (this.isStudioEnvironment()) {
      return await (window as any).aistudio.hasSelectedApiKey();
    }
    const savedKey = StorageService.getString(API_KEY_STORAGE_KEY, '');
    return savedKey.length > 0;
  }

  static async getApiKey(): Promise<string> {
    if (this.isStudioEnvironment()) {
      return process.env.API_KEY || '';
    }
    return StorageService.getString(API_KEY_STORAGE_KEY, '');
  }

  static setApiKey(apiKey: string): void {
    if (!this.isStudioEnvironment()) {
      StorageService.setString(API_KEY_STORAGE_KEY, apiKey);
    }
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

