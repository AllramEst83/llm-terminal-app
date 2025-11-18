# API Key Flow Documentation

## Overview

The API key is now **required during account registration** and users cannot create an account without providing a valid Gemini API key. After registration, the only way to update the API key is via the `/apikey` command.

## Registration Flow

### New User Registration

When a user creates a new account, they must provide:
1. **Email** - Valid email address
2. **Username** - Minimum 3 characters
3. **Password** - Minimum 8 characters
4. **Confirm Password** - Must match password
5. **Gemini API Key** - Minimum 20 characters (required!)

The registration form includes:
- A link to [Google AI Studio](https://aistudio.google.com/app/apikey) to get an API key
- Show/hide toggle for both password and API key fields
- Validation that ensures all fields are filled before submission

### What Happens During Registration

1. User submits registration form with API key
2. Account is created in Supabase Auth
3. Profile is automatically created via database trigger
4. **API key is immediately saved to database** (Supabase `api_keys` table)
5. API key is cached in runtime memory
6. User is logged in automatically
7. Settings are loaded/synced from database
8. Terminal boot sequence starts immediately

### Code Changes

**RegisterScreen.tsx:**
- Added API key input field with show/hide toggle
- Added validation for API key (minimum 20 characters)
- Updated form submission to include API key
- Added link to Google AI Studio

**AuthService.ts:**
- Updated `RegisterRequest` interface to include `apiKey`
- Modified `register()` method to save API key to database after successful signup
- API key is saved via `UserRepository.saveApiKey()`

**App.tsx:**
- Updated `handleRegister()` to accept `apiKey` parameter
- After successful registration, API key is set and terminal boots immediately
- Removed the separate API key input screen for authenticated users

## Login Flow

### Existing User Login

When a user logs in:
1. User enters email and password
2. Supabase Auth validates credentials
3. User profile is fetched from database
4. Settings are loaded from database (if local storage is empty)
5. **API key is loaded from database to runtime memory**
6. Terminal is ready to use

The API key is:
- Never stored in local storage (only in database)
- Cached in runtime memory during the session
- Cleared from memory on logout

## Updating API Key

### Via /apikey Command

After registration, users can update their API key using:

```
/apikey YOUR_NEW_API_KEY_HERE
```

This is the **ONLY** way to update the API key after registration.

The command:
- Validates the new API key is provided
- Updates the key in the database
- Caches it in runtime memory
- Updates application settings
- Displays success message

### Edge Case: Missing API Key

If somehow an authenticated user doesn't have an API key (database error, etc.), they will see:

```
SYSTEM: API Key not found.

Please use the /apikey command to set your Gemini API key.

Type: /apikey YOUR_API_KEY

You can get a key from Google AI Studio
```

This ensures users always have a way to set/fix their API key via the `/apikey` command.

## Security Considerations

### Current Implementation

- ✅ API keys stored in database (not local storage)
- ✅ API keys cached in runtime memory during session
- ✅ API keys cleared from memory on logout
- ✅ Row Level Security (RLS) ensures users can only access their own keys
- ⚠️ **API keys are stored as plain text in database**

### Production Requirements

**IMPORTANT:** Before deploying to production, implement API key encryption:

```typescript
// TODO: Implement these functions
async function encryptApiKey(apiKey: string): Promise<string> {
  // Use Web Crypto API or server-side encryption
  // Encrypt API key before storing in database
}

async function decryptApiKey(encryptedKey: string): Promise<string> {
  // Decrypt API key after loading from database
}
```

Update `UserRepository.saveApiKey()` and `UserRepository.loadApiKey()` to use encryption/decryption.

## Database Schema

The `api_keys` table structure:

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_key TEXT NOT NULL,  -- Currently plain text, should be encrypted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## User Experience

### New User Journey

1. 🔐 User arrives at registration screen
2. 📝 Fills out email, username, password, and **API key**
3. 🔗 Can click link to get API key from Google AI Studio
4. ✅ Creates account (all data validated)
5. 🚀 Immediately logged in and terminal boots
6. 💬 Can start chatting right away

### Returning User Journey

1. 🔐 User logs in with email/password
2. 📥 Settings and API key loaded from database
3. 🚀 Terminal boots automatically
4. 💬 Can start chatting immediately

### Updating API Key

1. 💬 User is in terminal (already logged in)
2. ⌨️ Types `/apikey NEW_KEY`
3. ✅ Key updated in database and memory
4. 💬 Continues chatting with new key

## Benefits of This Approach

✅ **No orphaned accounts** - Every user has an API key from the start
✅ **Simpler flow** - No separate API key input screen after login
✅ **Consistent UX** - Clear path for both new and existing users
✅ **Secure** - API keys in database, not local storage
✅ **Flexible** - Users can still update keys via `/apikey` command
✅ **Cross-device sync** - API key synced across all user's devices

## Migration Notes

Existing users (if any) who were created before this change:
- Will need to set their API key via `/apikey` command on first login
- The app will show a message directing them to use the `/apikey` command
- This is a one-time setup for legacy users

New users:
- Must provide API key during registration
- Cannot proceed without a valid API key
- Immediate access to full terminal functionality
