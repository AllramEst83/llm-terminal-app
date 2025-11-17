# Supabase Setup Instructions

This document contains instructions for setting up your Supabase database for the Gemini Terminal application.

## Step 1: Run the SQL Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/leiqocboxdfujixmwczk
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase_schema.sql` file
5. Paste into the SQL editor
6. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

This will create:
- `profiles` table (extends auth.users)
- `user_settings` table (stores user preferences)
- `api_keys` table (stores encrypted API keys)
- Row Level Security (RLS) policies
- Triggers for automatic profile creation
- Indexes for performance

## Step 2: Verify Tables Were Created

1. Go to **Table Editor** in the left sidebar
2. You should see three new tables:
   - `profiles`
   - `user_settings`
   - `api_keys`

## Step 3: Configure Email Authentication (Optional)

By default, Supabase requires email confirmation for new users.

### Option A: Disable Email Confirmation (For Development)
1. Go to **Authentication** → **Providers** → **Email**
2. Scroll down to **Confirm email**
3. Toggle it **OFF**
4. Click **Save**

### Option B: Configure Email Provider (For Production)
1. Go to **Authentication** → **Providers** → **Email**
2. Configure your email service (SMTP, SendGrid, etc.)
3. Customize email templates if needed

## Step 4: Test the Application

1. Run your application: `npm run dev`
2. Try to create a new account
3. Login with your credentials
4. Enter your Gemini API key
5. Verify everything works

## Database Schema Overview

### `profiles` Table
Extends Supabase auth.users with additional user data:
- `id` (UUID) - Primary key, references auth.users
- `username` (TEXT) - Unique username
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `user_settings` Table
Stores user preferences:
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to auth.users
- `font_size` (INTEGER)
- `theme_name` (TEXT)
- `model_name` (TEXT)
- `thinking_enabled` (BOOLEAN)
- `thinking_budget` (INTEGER, nullable)
- `audio_enabled` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `api_keys` Table
Stores API keys (should be encrypted in production):
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to auth.users
- `encrypted_key` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Security Notes

1. **Row Level Security (RLS)** is enabled on all tables
2. Users can only access their own data
3. API keys are stored in plain text currently - **TODO: Add encryption in production**
4. All sensitive data is protected by Supabase Auth

## Troubleshooting

### Issue: "relation does not exist" error
- Make sure you ran the SQL schema script
- Refresh the table editor page

### Issue: "row-level security policy violation" error
- Make sure RLS policies were created correctly
- Check that the user is authenticated before accessing data

### Issue: Can't create an account
- Check if email confirmation is disabled (if in development)
- Check browser console for errors
- Verify Supabase project URL and anon key are correct

### Issue: Settings not saving
- Check browser console for error messages
- Verify the user_settings table exists
- Check that RLS policies allow INSERT/UPDATE

## Next Steps

For production deployment, you should:

1. **Encrypt API Keys**: Implement proper encryption for API keys before storing them
2. **Add Password Reset**: Implement password reset flow
3. **Add Email Verification**: Enable and configure email verification
4. **Add Rate Limiting**: Prevent abuse with rate limiting
5. **Monitor Usage**: Set up monitoring and alerts in Supabase dashboard
6. **Backup Strategy**: Configure automatic backups

## API Key Encryption (TODO)

The API keys are currently stored in plain text. For production, implement encryption:

```typescript
// Example using Web Crypto API
async function encryptApiKey(apiKey: string, userId: string): Promise<string> {
  // Implement encryption logic
  // Use a key derived from user's credentials or a master key
  // Return encrypted string
}

async function decryptApiKey(encryptedKey: string, userId: string): Promise<string> {
  // Implement decryption logic
  // Return decrypted API key
}
```

Or use a backend service to handle encryption/decryption securely.
