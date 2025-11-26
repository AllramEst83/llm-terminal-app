## Implement Backend AUTH for this retro terminal app.

- Analyze project structure and code to understand the existing implementation of authentication.
- Always follow best coding practices and principles.
- WebApp has to be production safe and secure when it comes to authentication.
- **Security Principle:** Always prefer the most secure option.
  - Default to server-side execution (Supabase Edge Functions) for anything involving secrets, tokens, or third-party APIs.
  - When in doubt, move logic to a function and keep the client as thin as possible.

### Backend

- Use Supabase for authentication.
  - Supabase is already setup in this project.
  - Use the Supabase Auth API handle all authentication related tasks.
    - signup
    - login
    - logout
    - reset password
    - delete account (via secure Edge Function - server-side only)
    - listen for auth state changes and direct user accordingly.
  - Use Supabase to to store the user set settings and preferences.
  - Enable row level security on `profiles`, `user_settings`, `api_keys`, and any future auth-related tables; define policies per role (anon vs authenticated vs service) and keep them versioned with migrations.
  - Create migrations scripts to update schemas when needed.
  - Use crypto to store api key in table instead of plain text.
    - Use 32 bit salt to decrypt api key before storing it and decrypt before using it. Stored in "supabase/.env.local", API_KEY_ENCRYPTION_SECRET.
    - Always use crypto to encrypt and decrypt data.
    - Never store api key in localStorage unencrypted.
  - Check if user settings is in localStorage, if not, get it from Supabase.
    - When settings are changed, update localStorage and Supabase.
  - **CRITICAL**: Load settings (including API key) BEFORE checking if API key exists.
    - This ensures authenticated users don't get prompted for API key on every login.
    - Order: Load settings from Supabase → Decrypt API key → Then check if key ready.

#### Gemini API Security (Edge Functions)

- **ALL Gemini API interactions MUST happen server-side via Supabase Edge Functions**.
  - Never call Gemini API directly from client - API keys must never be exposed to browser.
  - Create Edge Functions for all Gemini operations:
    - `gemini-chat` - Handle chat conversations with streaming
    - `gemini-image` - Generate images
    - `gemini-search` - Web search functionality
    - `gemini-grammar` - Text improvement
  - Edge Functions will:
    - Authenticate user via JWT token
    - Retrieve encrypted API key from database
    - Decrypt API key server-side using environment secrets
    - Make API call to Gemini
    - Stream response back to client
    - Never log or expose decrypted API keys
  - Client services should call Edge Functions, not Gemini API directly.
  - Implement rate limiting to prevent abuse.
  - Track usage server-side for analytics.

#### Server-Side Operations

- **Delete User Account** - Must use Edge Function (`delete-user`)
  - Client calls Edge Function with JWT token
  - Server verifies authentication
  - Server uses service role to delete user account
  - Handles cascading deletion of all user data
  - Returns success/error to client
  - Never allow client-side user deletion

#### Supabase environment clarity

- Providers & scopes
  - Email/password is the default;
  - Scopes: read/write on `profiles`, `user_settings`, and `api_keys`; never expose elevated policies to the client.
- Environment variables
  - `supabase/.env.local`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `API_KEY_ENCRYPTION_SECRET` (32-byte hex), `API_KEY_ENCRYPTION_SALT`.
  - `.env.local` (React app root): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
  - For now, single environment setup; can expand to multi-env (dev/test/prod) with `.env.[env].local` and `dotenv-flow` later if needed.
  - Never commit `.env*` files; document how to pull secrets from the internal vault.
- Migrations
  - Use `supabase/migrations/<timestamp>_<slug>.sql` naming to guarantee chronological order.
  - Run `npx supabase db diff` to create migration drafts, review in PR, then `npx supabase db push`.
  - Keep `supabase/migrations/README.md` updated with checksum list so we can verify drift.

#### API key crypto workflow

- Algorithm: AES-256-GCM via Node `crypto`.
- Encryption flow
  1. When user saves an API key, generate a 12-byte IV (per row) and store it alongside the ciphertext.
  2. Derive a 256-bit key from `API_KEY_ENCRYPTION_SECRET` + per-environment salt using `scrypt`.
  3. Encrypt, persist `{ciphertext, iv, auth_tag}`; store auth tag in the same row.
  4. Never log raw keys.
- Decryption flow mirrors encryption: derive key, decrypt with IV + auth tag, return plaintext only in-memory.
- Key rotation: version secrets via `API_KEY_ENCRYPTION_SECRET_V2`; keep both secrets available while migrating stored keys.

### Documentation

- Create a step by step guide how to run project especially supabase with all the necessary steps and commands.
- Document Edge Functions setup and deployment.
- Include security considerations for API key handling.
- Document the importance of server-side operations for sensitive data.

  - npx supabase start
  - npx supabase stop
  - npx supabase login
  - npx supabase link
  - npx supabase status
  - npx supabase functions deploy [function-name]
  - npx supabase functions serve
  - npx supabase functions logs [function-name]
  - npx supabase migrations list
  - npx supabase db push
  - npx supabase db reset
  - npx supabase db seed
  - npx supabase secrets set KEY=value

- Add prerequisites: Node version, npm, Supabase CLI install, Docker (for Postgres), env var setup steps.
- For each command above, include expected output snippets plus troubleshooting tips (e.g., port already in use, auth login failures).
- Document Edge Functions deployment and testing procedures.
- Document automated auth tests: `npm run test auth` for unit/mocks; integration tests require `npx supabase start`.
- Provide seeding guidance (`supabase/seed.sql`) for demo users/API keys and how to sanitize before committing logs.
- Include secret-sharing policy (internal vault) and revocation steps.
- Document server-side API key handling and why client should never call Gemini API directly.
- Include Edge Functions guide with migration steps for moving Gemini API calls to server-side.
- Explain API key detection flow: Settings load → Decrypt API key → Check existence → Only prompt if missing.
