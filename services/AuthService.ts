import { User } from '../domain/User';
import { Session } from '../domain/Session';
import { supabase } from './supabaseClient';
import type { AuthError, User as SupabaseUser } from '@supabase/supabase-js';

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  apiKey: string;
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
   * Register a new user account using Supabase Auth
   */
  static async register(request: RegisterRequest): Promise<AuthResponse> {
    console.log('[AuthService] Registering user', { email: request.email, username: request.username });
    
    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: request.email,
        password: request.password,
        options: {
          data: {
            username: request.username
          }
        }
      });

      if (error) {
        console.error('[AuthService] Registration error:', error);
        return {
          success: false,
          error: this.getErrorMessage(error)
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: 'Registration failed. Please try again.'
        };
      }

      // Get user profile (created by trigger)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('[AuthService] Profile fetch error:', profileError);
        // Continue anyway, profile might not be created yet
      }

      // Save API key to database immediately after registration
      const { UserRepository } = await import('../repositories/UserRepository');
      const apiKeySaved = await UserRepository.saveApiKey(data.user.id, request.apiKey);
      
      if (!apiKeySaved) {
        console.error('[AuthService] Failed to save API key during registration');
        // Continue anyway - user can update it later via /apikey command
      }

      const user = new User(
        data.user.id,
        data.user.email || request.email,
        profile?.username || request.username,
        new Date(data.user.created_at)
      );

      const session = new Session(
        data.session.access_token,
        user,
        data.session.access_token,
        new Date(data.session.expires_at! * 1000),
        new Date()
      );

      return {
        success: true,
        session
      };
    } catch (error) {
      console.error('[AuthService] Unexpected registration error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  /**
   * Login with existing credentials using Supabase Auth
   */
  static async login(request: LoginRequest): Promise<AuthResponse> {
    console.log('[AuthService] Logging in user', { email: request.email });
    
    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: request.email,
        password: request.password
      });

      if (error) {
        console.error('[AuthService] Login error:', error);
        return {
          success: false,
          error: this.getErrorMessage(error)
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: 'Login failed. Please try again.'
        };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('[AuthService] Profile fetch error:', profileError);
      }

      const user = new User(
        data.user.id,
        data.user.email || request.email,
        profile?.username || data.user.email?.split('@')[0] || 'user',
        new Date(data.user.created_at)
      );

      const session = new Session(
        data.session.access_token,
        user,
        data.session.access_token,
        new Date(data.session.expires_at! * 1000),
        new Date()
      );

      return {
        success: true,
        session
      };
    } catch (error) {
      console.error('[AuthService] Unexpected login error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<void> {
    console.log('[AuthService] Logging out user');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthService] Logout error:', error);
        throw error;
      }
    } catch (error) {
      console.error('[AuthService] Unexpected logout error:', error);
      throw error;
    }
  }

  /**
   * Get current session from Supabase
   */
  static async getSession(): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[AuthService] Get session error:', error);
        return null;
      }

      if (!data.session) {
        return null;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      const user = new User(
        data.session.user.id,
        data.session.user.email || '',
        profile?.username || data.session.user.email?.split('@')[0] || 'user',
        new Date(data.session.user.created_at)
      );

      const session = new Session(
        data.session.access_token,
        user,
        data.session.access_token,
        new Date(data.session.expires_at! * 1000),
        new Date()
      );

      return session;
    } catch (error) {
      console.error('[AuthService] Unexpected get session error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null && !session.isExpired();
  }

  /**
   * Get current Supabase user
   */
  static async getCurrentUser(): Promise<SupabaseUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  /**
   * Validate session with backend
   */
  static async validateSession(session: Session): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        return false;
      }

      return !session.isExpired();
    } catch (error) {
      console.error('[AuthService] Session validation error:', error);
      return false;
    }
  }

  /**
   * Convert Supabase auth error to user-friendly message
   */
  private static getErrorMessage(error: AuthError): string {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password. Please try again.';
      case 'User already registered':
        return 'An account with this email already exists.';
      case 'Email not confirmed':
        return 'Please confirm your email address before logging in.';
      case 'Password should be at least 6 characters':
        return 'Password must be at least 6 characters long.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  }
}
