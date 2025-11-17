import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://leiqocboxdfujixmwczk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaXFvY2JveGRmdWppeG13Y3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTEyNzAsImV4cCI6MjA3ODk2NzI3MH0.rFEtazqwDpUQ3RfV1_NqsWiCZQfyItpPKqSV8T3aUZU';

// Create a single supabase client for interacting with your database
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionUrl: true,
    storage: window.localStorage,
    storageKey: 'terminal_auth_session'
  }
});

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          font_size: number;
          theme_name: string;
          model_name: string;
          thinking_enabled: boolean;
          thinking_budget: number | null;
          audio_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          font_size?: number;
          theme_name?: string;
          model_name?: string;
          thinking_enabled?: boolean;
          thinking_budget?: number | null;
          audio_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          font_size?: number;
          theme_name?: string;
          model_name?: string;
          thinking_enabled?: boolean;
          thinking_budget?: number | null;
          audio_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          encrypted_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          encrypted_key: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          encrypted_key?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
