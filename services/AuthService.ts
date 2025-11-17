import { User } from '../domain/User';
import { Session } from '../domain/Session';
import { StorageService } from './StorageService';

const SESSION_STORAGE_KEY = 'terminal_session';

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  session?: Session;
  error?: string;
}

export class AuthService {
  /**
   * Register a new user account
   * STUB: This is a placeholder implementation
   * TODO: Implement actual API call to backend
   */
  static async register(request: RegisterRequest): Promise<AuthResponse> {
    console.log('[AuthService] STUB: register called', { email: request.email, username: request.username });
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // STUB: Create mock user and session
    const user = User.create(request.email, request.username);
    const token = this.generateMockToken();
    const session = Session.create(user, token);
    
    // Save session to local storage
    this.saveSession(session);
    
    return {
      success: true,
      session
    };
  }

  /**
   * Login with existing credentials
   * STUB: This is a placeholder implementation
   * TODO: Implement actual API call to backend
   */
  static async login(request: LoginRequest): Promise<AuthResponse> {
    console.log('[AuthService] STUB: login called', { email: request.email });
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // STUB: Create mock user and session
    const user = User.create(request.email, request.email.split('@')[0]);
    const token = this.generateMockToken();
    const session = Session.create(user, token);
    
    // Save session to local storage
    this.saveSession(session);
    
    return {
      success: true,
      session
    };
  }

  /**
   * Logout current user
   * STUB: This is a placeholder implementation
   * TODO: Implement actual API call to backend to invalidate session
   */
  static async logout(): Promise<void> {
    console.log('[AuthService] STUB: logout called');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Clear session from local storage
    this.clearSession();
  }

  /**
   * Get current session from local storage
   */
  static getSession(): Session | null {
    const sessionJson = StorageService.get<any>(SESSION_STORAGE_KEY, null);
    if (!sessionJson) {
      return null;
    }
    
    try {
      const session = Session.fromJson(sessionJson);
      
      // Check if session is expired
      if (session.isExpired()) {
        this.clearSession();
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('[AuthService] Failed to parse session', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const session = this.getSession();
    return session !== null && !session.isExpired();
  }

  /**
   * Save session to local storage
   */
  private static saveSession(session: Session): void {
    StorageService.set(SESSION_STORAGE_KEY, session.toJson());
  }

  /**
   * Clear session from local storage
   */
  private static clearSession(): void {
    StorageService.remove(SESSION_STORAGE_KEY);
  }

  /**
   * Generate a mock authentication token
   * STUB: In production, this would come from the backend
   */
  private static generateMockToken(): string {
    return `mock_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Validate session with backend
   * STUB: This is a placeholder implementation
   * TODO: Implement actual API call to backend to validate session
   */
  static async validateSession(session: Session): Promise<boolean> {
    console.log('[AuthService] STUB: validateSession called', { sessionId: session.id });
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // STUB: Just check if session is expired locally
    return !session.isExpired();
  }
}
