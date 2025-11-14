export class StorageService {
  private static isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Diagnostic function to check localStorage status
   * Useful for debugging production issues
   */
  static diagnose(): {
    available: boolean;
    quota?: number;
    used?: number;
    remaining?: number;
    error?: string;
  } {
    const result: {
      available: boolean;
      quota?: number;
      used?: number;
      remaining?: number;
      error?: string;
    } = {
      available: false
    };

    try {
      // Test basic availability
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      result.available = true;

      // Try to get storage quota (may not be available in all browsers)
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          result.quota = estimate.quota;
          result.used = estimate.usage;
          result.remaining = estimate.quota && estimate.usage 
            ? estimate.quota - estimate.usage 
            : undefined;
        }).catch(() => {
          // Quota estimation not available
        });
      }
    } catch (error) {
      result.available = false;
      if (error instanceof DOMException) {
        result.error = error.name === 'SecurityError' 
          ? 'SecurityError: localStorage access denied (may be in iframe or private browsing)'
          : error.message;
      } else {
        result.error = String(error);
      }
    }

    return result;
  }

  static get<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available. Settings will not persist.');
      return defaultValue;
    }
    
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to read from localStorage: ${key}`, error);
      return defaultValue;
    }
  }

  static getString(key: string, defaultValue: string): string {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available. Settings will not persist.');
      return defaultValue;
    }
    
    try {
      return localStorage.getItem(key) || defaultValue;
    } catch (error) {
      console.error(`Failed to read from localStorage: ${key}`, error);
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available. Settings will not persist.');
      return false;
    }
    
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      
      // Verify the write succeeded
      const readBack = localStorage.getItem(key);
      if (readBack !== serialized) {
        console.error(`Failed to verify localStorage write: ${key}. Write may have failed.`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to save to localStorage: ${key}`, error);
      // Log specific error details for debugging
      if (error instanceof DOMException) {
        if (error.code === 22 || error.code === 1014) {
          console.error('localStorage quota exceeded or storage is full');
        } else if (error.name === 'SecurityError') {
          console.error('localStorage access denied. This may happen in private browsing mode or when the site is in an iframe with different origin.');
        }
      }
      return false;
    }
  }

  static setString(key: string, value: string): boolean {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available. Settings will not persist.');
      return false;
    }
    
    try {
      localStorage.setItem(key, value);
      
      // Verify the write succeeded
      const readBack = localStorage.getItem(key);
      if (readBack !== value) {
        console.error(`Failed to verify localStorage write: ${key}. Write may have failed.`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to save to localStorage: ${key}`, error);
      // Log specific error details for debugging
      if (error instanceof DOMException) {
        if (error.code === 22 || error.code === 1014) {
          console.error('localStorage quota exceeded or storage is full');
        } else if (error.name === 'SecurityError') {
          console.error('localStorage access denied. This may happen in private browsing mode or when the site is in an iframe with different origin.');
        }
      }
      return false;
    }
  }

  static remove(key: string): void {
    if (!this.isAvailable()) {
      return;
    }
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove from localStorage: ${key}`, error);
    }
  }
}

