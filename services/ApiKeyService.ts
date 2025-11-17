import { StorageService } from './StorageService';
import { AuthService } from './AuthService';
import { UserRepository } from '../repositories/UserRepository';

const API_KEY_STORAGE_KEY = 'terminal_apiKey';
const API_KEY_MEMORY_KEY = 'runtime_apiKey';

// In-memory storage for API key during runtime (cleared on logout/refresh)
let runtimeApiKey: string | null = null;

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
    
    // Check runtime memory
    if (runtimeApiKey && runtimeApiKey.length > 0) {
      return true;
    }
    
    // Check if user is authenticated and has API key in database
    const session = AuthService.getSession();
    if (session) {
      const dbApiKey = await UserRepository.loadApiKey(session.user.id);
      if (dbApiKey && dbApiKey.length > 0) {
        runtimeApiKey = dbApiKey; // Cache in memory
        return true;
      }
    }
    
    // LEGACY: Fall back to local storage for backward compatibility
    // This will be removed in future versions
    const savedKey = StorageService.getString(API_KEY_STORAGE_KEY, '');
    if (savedKey.length > 0) {
      // Migrate to database if user is authenticated
      if (session) {
        await UserRepository.saveApiKey(session.user.id, savedKey);
        StorageService.remove(API_KEY_STORAGE_KEY); // Remove from local storage
        runtimeApiKey = savedKey;
      }
      return true;
    }
    
    return false;
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
    
    // Check runtime memory
    if (runtimeApiKey && runtimeApiKey.length > 0) {
      return runtimeApiKey;
    }
    
    // Check if user is authenticated and has API key in database
    const session = AuthService.getSession();
    if (session) {
      const dbApiKey = await UserRepository.loadApiKey(session.user.id);
      if (dbApiKey && dbApiKey.length > 0) {
        runtimeApiKey = dbApiKey; // Cache in memory
        return dbApiKey;
      }
    }
    
    // LEGACY: Fall back to local storage for backward compatibility
    const savedKey = StorageService.getString(API_KEY_STORAGE_KEY, '');
    if (savedKey.length > 0) {
      // Migrate to database if user is authenticated
      if (session) {
        await UserRepository.saveApiKey(session.user.id, savedKey);
        StorageService.remove(API_KEY_STORAGE_KEY); // Remove from local storage
        runtimeApiKey = savedKey;
        return savedKey;
      }
      return savedKey;
    }
    
    return '';
  }

  static async setApiKey(apiKey: string): Promise<boolean> {
    if (this.isStudioEnvironment()) {
      return true; // In Studio env, consider it "saved" (handled by Studio)
    }
    
    // Set in runtime memory
    runtimeApiKey = apiKey;
    
    // Save to database if user is authenticated
    const session = AuthService.getSession();
    if (session) {
      try {
        await UserRepository.saveApiKey(session.user.id, apiKey);
        // DO NOT save to local storage - only in database
        console.log('[ApiKeyService] API key saved to database');
        return true;
      } catch (error) {
        console.error('[ApiKeyService] Failed to save API key to database:', error);
        return false;
      }
    } else {
      // If not authenticated, temporarily save to local storage
      // This will be migrated to database when user logs in
      console.warn('[ApiKeyService] User not authenticated, saving API key to local storage temporarily');
      return StorageService.setString(API_KEY_STORAGE_KEY, apiKey);
    }
  }

  static removeApiKey(): void {
    // Clear runtime memory
    runtimeApiKey = null;
    
    if (!this.isStudioEnvironment()) {
      StorageService.remove(API_KEY_STORAGE_KEY);
    }
    
    // Note: We don't delete from database here
    // That should be done through user account management
  }

  static async openKeySelector(): Promise<void> {
    if (this.isStudioEnvironment()) {
      await (window as any).aistudio.openSelectKey();
    }
  }

  /**
   * Clear API key from runtime memory (call on logout)
   */
  static clearRuntimeApiKey(): void {
    runtimeApiKey = null;
  }
}

