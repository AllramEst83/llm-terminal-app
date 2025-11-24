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
      
      const readBack = localStorage.getItem(key);
      if (readBack !== serialized) {
        console.error(`Failed to verify localStorage write: ${key}. Write may have failed.`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to save to localStorage: ${key}`, error);
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
      
      const readBack = localStorage.getItem(key);
      if (readBack !== value) {
        console.error(`Failed to verify localStorage write: ${key}. Write may have failed.`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to save to localStorage: ${key}`, error);
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

