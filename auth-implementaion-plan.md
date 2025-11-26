## Implement AUTH for this retro terminal app.

- Analyze project structure and code to understand the existing implementation of authentication.
- The signup and login screen have to adhere to the already existing UI/UX design. I want a mainframe terminal look and feel to the screens.
- The signup and login screen have to be responsive and work on all devices.
- The signup and login screen have to be accessible and follow WCAG 2.1 guidelines.
- Always follow best coding practices and principles.
- WebApp has to be production safe and secure when it comes to authentication.

### Backend

- Use Supabase for authentication.
  - Supabase is already setup in this project.
  - Use the Supabase Auth API handle all authentication related tasks.
    - signup
    - login
    - logout
    - reset password
    - delete account
    - listen for auth state changes and direct user accordingly.
  - Use Supabase to to store the user set settings and preferences.
  - Enable row level security on `profiles`, `user_settings`, `api_keys`, and any future auth-related tables; define policies per role (anon vs authenticated vs service) and keep them versioned with migrations.
  - Create migrations scripts to update schemas when needed.
  - Use crypto to store api key in table instead of plain text.
    - Use 32 bit salt to decrypt api key before storing it and decrypt before using it. Stored in "supabase/.env.local", API_KEY_ENCRYPTION_SECRET.
    - Always use crypto to encrypt and decrypt data.
    - Never store api key in localStorage.
  - Check if user settings is in localStorage, if not, get it from Supabase.
    - Whne settings are changed, update localStorage and Supabase.

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

### UI

- Create a Signup and Login screen.
- Add signout command to commnads list to logout user.
  - Push user to login screen when signout command is executed on successfull logout.
- show logout in far right of the header, next to token infoirmation.
- Implement Route guards to protect routes from unauthorized access.
- Show loading spinner when authentication is in progress.
- Show error message when authentication fails.
- Show success message when authentication succeeds.
  - Show warning message when authentication is not configured.
  - Show warning message when authentication is not configured.

#### Auth state handling strategy

- Global store: wrap the app with `AuthProvider` (React context + Zustand) that exposes `{session, user, status, error}`.
- Route guards
  - `ProtectedRoute` component reads context and Supabase session; if unauthenticated, redirect to `/login`.
  - `PublicRoute` prevents logged-in users from seeing login/signup when already authenticated.
- Session persistence
  - On load, call `supabase.auth.getSession()` to hydrate context.
  - Mirror minimal session info in `sessionStorage` for reload resilience; fall back to Supabase when cache is missing or stale.
  - Subscribe to `supabase.auth.onAuthStateChange` to keep UI in sync; force logout if tokens mismatch or refresh fails.
- Settings sync
  - Fetch `user_settings` after login; cache in localStorage with version hash; on mismatch pull from Supabase and overwrite cache.

#### Error & UX flows

- Surfaces
  - Success toasts for signup/login/logout/reset/delete, tied to Supabase responses.
  - Warning banner when Supabase env vars are missing or auth disabled; disable form submit.
  - Error toast + inline validation for API failures; surface Supabase error codes when safe.
  - Confirmation modals before destructive actions (delete account, logout) with keyboard focus trap.
- Loading experience
  - Full-screen spinner while the initial session check runs.
  - Button-level spinners for individual actions (signup/login) with disabled states.
  - Skeleton placeholders while loading user settings/preferences.
- Accessibility
  - `aria-live` region for async status so screen readers announce changes.
  - Ensure all interactions work via keyboard only (tab order, Enter to submit, Esc to close).
  - Maintain minimum 4.5:1 contrast inside retro terminal palette.

### Documentaion

- Cerate a step by step guide how to run porject especially supabase with all the necessary steps and commands.

  - npx supabase start
  - npx supabase stop
  - npx supabase login
  - npx supabase link
  - npx supabase status
  - npx supabase functions deploy
  - npx supabase functions serve
  - npx supa base migrations list
  - npm supabase db push
  - npm supabase db reset
  - npm supabase db seed
  - npm supabase db generate

- Add prerequisites: Node version, npm, Supabase CLI install, Docker (for Postgres), env var setup steps.
- For each command above, include expected output snippets plus troubleshooting tips (e.g., port already in use, auth login failures).
- Document automated auth tests: `npm run test auth` for unit/mocks; integration tests require `npx supabase start`.
- Provide seeding guidance (`supabase/seed.sql`) for demo users/API keys and how to sanitize before committing logs.
- Include secret-sharing policy (internal vault) and revocation steps.
