## Implement Frontend AUTH for this retro terminal app.

- Analyze project structure and code to understand the existing implementation of authentication.
- The signup and login screen have to adhere to the already existing UI/UX design. I want a mainframe terminal look and feel to the screens.
- The signup and login screen have to be responsive and work on all devices.
- The signup and login screen have to be accessible and follow WCAG 2.1 guidelines.
- Always follow best coding practices and principles.
- WebApp has to be production safe and secure when it comes to authentication.
- **Security Principle:** Always prefer the most secure option.
  - Client should never directly handle long-lived secrets or call Gemini APIs with raw API keys.

### UI

- Create a Signup and Login screen.
- Add signout command to commands list to logout user.
  - Push user to login screen when signout command is executed on successful logout.
- Show logout in far right of the header, next to token information.
- Implement Route guards to protect routes from unauthorized access.
- Show loading spinner when authentication is in progress.
- Show error message when authentication fails.
- Show success message when authentication succeeds.
  - Show warning message when authentication is not configured.
- **API Key Handling**: API key never leaves the server; frontend only receives boolean state.
  - On auth success call a `checkApiKey()` endpoint that returns existence status (`hasKey: true|false`).
  - Endpoint validates Supabase session, decrypts key server-side, and never returns raw secret.
  - Cache the boolean in memory; re-check whenever settings are reloaded or session changes.
  - Prompt user only when `hasKey` is false; keep prompt hidden otherwise.
  - This avoids leaking secrets and still prevents repetitive prompts.

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
