import { User } from '../domain/User';
import { Settings } from '../domain/Settings';
import { supabase } from '../services/supabaseClient';

export interface UserSettings {
  userId: string;
  settings: Settings;
  apiKey: string;
  updatedAt: Date;
}

export class UserRepository {
  /**
   * Save user settings to Supabase database
   */
  static async saveUserSettings(userId: string, settings: Settings, apiKey: string): Promise<boolean> {
    console.log('[UserRepository] Saving user settings', {
      userId,
      fontSize: settings.fontSize,
      themeName: settings.themeName,
      modelName: settings.modelName,
      thinkingEnabled: settings.thinkingEnabled,
      audioEnabled: settings.audioEnabled,
      apiKeyLength: apiKey.length
    });
    
    try {
      // Upsert user settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          font_size: settings.fontSize,
          theme_name: settings.themeName,
          model_name: settings.modelName,
          thinking_enabled: settings.thinkingEnabled,
          thinking_budget: settings.thinkingBudget,
          audio_enabled: settings.audioEnabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (settingsError) {
        console.error('[UserRepository] Settings save error:', settingsError);
        return false;
      }

      // Save API key if provided
      if (apiKey && apiKey.length > 0) {
        await this.saveApiKey(userId, apiKey);
      }

      console.log('[UserRepository] Settings saved successfully');
      return true;
    } catch (error) {
      console.error('[UserRepository] Unexpected save error:', error);
      return false;
    }
  }

  /**
   * Load user settings from Supabase database
   */
  static async loadUserSettings(userId: string): Promise<UserSettings | null> {
    console.log('[UserRepository] Loading user settings', { userId });
    
    try {
      // Fetch user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (settingsError) {
        if (settingsError.code === 'PGRST116') {
          // No settings found - this is normal for new users
          console.log('[UserRepository] No settings found for user');
          return null;
        }
        console.error('[UserRepository] Settings load error:', settingsError);
        return null;
      }

      if (!settingsData) {
        return null;
      }

      // Fetch API key
      const apiKey = await this.loadApiKey(userId) || '';

      const settings = new Settings(
        settingsData.font_size,
        settingsData.theme_name,
        apiKey,
        settingsData.model_name,
        settingsData.thinking_enabled,
        settingsData.thinking_budget,
        settingsData.audio_enabled
      );

      return {
        userId,
        settings,
        apiKey,
        updatedAt: new Date(settingsData.updated_at)
      };
    } catch (error) {
      console.error('[UserRepository] Unexpected load error:', error);
      return null;
    }
  }

  /**
   * Save API key to Supabase database
   * Note: In production, you should encrypt the API key before storing
   */
  static async saveApiKey(userId: string, apiKey: string): Promise<boolean> {
    console.log('[UserRepository] Saving API key', {
      userId,
      apiKeyLength: apiKey.length
    });
    
    try {
      // Upsert API key
      // TODO: Encrypt API key before storing in production
      const { error } = await supabase
        .from('api_keys')
        .upsert({
          user_id: userId,
          encrypted_key: apiKey, // In production, encrypt this!
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[UserRepository] API key save error:', error);
        return false;
      }

      console.log('[UserRepository] API key saved successfully');
      return true;
    } catch (error) {
      console.error('[UserRepository] Unexpected API key save error:', error);
      return false;
    }
  }

  /**
   * Load API key from Supabase database
   * Note: In production, you should decrypt the API key after loading
   */
  static async loadApiKey(userId: string): Promise<string | null> {
    console.log('[UserRepository] Loading API key', { userId });
    
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('encrypted_key')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No API key found - this is normal for new users
          console.log('[UserRepository] No API key found for user');
          return null;
        }
        console.error('[UserRepository] API key load error:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // TODO: Decrypt API key in production
      return data.encrypted_key;
    } catch (error) {
      console.error('[UserRepository] Unexpected API key load error:', error);
      return null;
    }
  }

  /**
   * Get user by ID from Supabase
   */
  static async getUserById(userId: string): Promise<User | null> {
    console.log('[UserRepository] Getting user by ID', { userId });
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[UserRepository] Get user error:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Get auth user for email
      const { data: { user: authUser } } = await supabase.auth.getUser();

      return new User(
        data.id,
        authUser?.email || '',
        data.username,
        new Date(data.created_at)
      );
    } catch (error) {
      console.error('[UserRepository] Unexpected get user error:', error);
      return null;
    }
  }

  /**
   * Update user profile in Supabase
   */
  static async updateUser(user: User): Promise<boolean> {
    console.log('[UserRepository] Updating user', {
      userId: user.id,
      email: user.email,
      username: user.username
    });
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: user.username,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('[UserRepository] Update user error:', error);
        return false;
      }

      console.log('[UserRepository] User updated successfully');
      return true;
    } catch (error) {
      console.error('[UserRepository] Unexpected update user error:', error);
      return false;
    }
  }

  /**
   * Delete user account from Supabase
   * Note: This only deletes the profile. The auth user should be deleted separately.
   */
  static async deleteUser(userId: string): Promise<boolean> {
    console.log('[UserRepository] Deleting user', { userId });
    
    try {
      // Delete profile (cascade will delete settings and API key)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('[UserRepository] Delete user error:', error);
        return false;
      }

      console.log('[UserRepository] User deleted successfully');
      return true;
    } catch (error) {
      console.error('[UserRepository] Unexpected delete user error:', error);
      return false;
    }
  }
}
