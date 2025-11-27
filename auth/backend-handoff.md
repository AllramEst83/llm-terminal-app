# Backend Auth & LLM Handoff

## Context

- Frontend now uses Supabase email/password auth via `AuthProvider` and route guards.
- Terminal UI only boots after `checkApiKey()` confirms the user’s encrypted Gemini key exists server-side.
- All LLM interactions were refactored to call Supabase Edge Functions; the browser never receives API keys.
- User settings are still hydrated locally but now attempt to sync against `/functions/v1/user-settings`.

## Required Edge Functions / REST Endpoints

### 1. `POST /functions/v1/save-api-key`

- **Purpose:** Store or update the user’s Gemini API key encrypted at rest.
- **Request body:** `{ "apiKey": "<raw-user-key>" }`
- **Response:** `204` on success. Frontend expects thrown errors to include a readable message string.
- **Auth:** Require Supabase session (cookie/JWT) and scope storage by `auth.user.id`.

### 2. `GET /functions/v1/save-api-key`

- **Purpose:** Report whether a key exists.
- **Response:** `{ "hasKey": true | false }`
- **Notes:** Frontend caches this boolean; return `401` if session invalid.

### 3. `DELETE /functions/v1/save-api-key`

- **Purpose:** Remove stored key when needed (future feature).

### 4. `POST /functions/v1/gemini-chat` (streaming)

- **Request body:**
  ```json
  {
    "history": [
      {
        "role": "user|model",
        "text": "...",
        "images": [{ "base64Data": "...", "mimeType": "image/png" }]
      }
    ],
    "message": "latest user text",
    "model": "gemini-2.5-flash",
    "thinkingSettings": { "enabled": true, "budget": 5000 },
    "images": [{ "base64Data": "...", "mimeType": "image/png" }]
  }
  ```
- **Response format:** NDJSON stream where each line is JSON:
  - `{ "type": "chunk", "text": "partial text" }`
  - `{ "type": "error", "text": "SYSTEM ERROR: ..." }`
  - `{ "type": "complete", "sources": [{ "title": "...", "uri": "..." }], "usage": { "promptTokenCount": 123 }, "warningMessage": "..." }`
- **Notes:** Frontend treats first `chunk` as start of model reply; `complete` must always be emitted.

### 5. `POST /functions/v1/gemini-search`

- **Request:** `{ "query": "...", "model": "gemini-2.5-flash" }`
- **Response:** `{ "text": "markdown summary", "sources": [{ "title": "...", "uri": "..." }] }`

### 6. `POST /functions/v1/gemini-grammar`

- **Request:** `{ "text": "raw user text", "model": "gemini-2.5-flash" }`
- **Response:** `{ "output": "improved text" }`

### 7. `POST /functions/v1/gemini-image`

- **Request:** `{ "prompt": "...", "aspectRatio": "16:9", "model": "nano-banana" }`
- **Response:** `{ "imageData": "<base64>", "usageMetadata": { "promptTokenCount": 100 } }`

### 8. `GET /functions/v1/user-settings`

- **Purpose:** Return per-user preferences after login.
- **Response:** `{ "settings": { "fontSize": 16, "themeName": "amber", "modelName": "gemini-2.5-flash", "thinkingSettings": {...}, "audioEnabled": true }, "version": "<hash>" }`
- Frontend merges this payload over local defaults and stores the returned version hash.

### 9. `POST /functions/v1/user-settings`

- **Request:** `{ "settings": { ...same schema as above... } }`
- **Response:** `{ "version": "<new-hash>" }`
- **Expectation:** Update Supabase table, return monotonically increasing or hashed version so the client can detect divergence.

## Security Requirements

- Every endpoint must validate the Supabase session (`getUser`/`getSession`) and scope operations to `user.id`.
- API keys should be encrypted using a KMS or symmetric key stored in Supabase Vault; only boolean state is ever returned to the client.
- Streaming endpoint must stop emitting chunks if Supabase session is invalidated mid-stream.

## Data & Domain Notes

- `thinkingSettings` mirrors the `Settings` entity: `{ [modelId]: { enabled: boolean, budget?: number, level?: 'low'|'high' } }`.
- Images arriving from the UI are base64 strings; backend should decode/forward them to Gemini Vision endpoints.
- Chat history currently filters to `user`/`model` roles; backend can trust the order provided.

## Outstanding Backend Tasks

1. Implement the nine functions above (likely as Supabase Edge Functions) and wire them to Google Gemini + Postgres tables.
2. Add a `user_settings` table keyed by `user_id` with JSONB payload + version hash (e.g., `md5(jsonb)`).
3. Provision secure storage (e.g., `user_api_keys` table) with encryption helpers; ensure DELETE cascades on account removal.
4. Enforce rate limits per user to prevent abuse; frontend shows toasts when HTTP errors propagate.
5. Optionally provide structured error responses `{ "error": "..." }` so UI messages stay informative.

## Testing Expectations

- Verify that calling `/functions/v1/save-api-key` via GET immediately after POST reflects the new boolean.
- Ensure chat streaming emits newline-delimited JSON; frontend ignores blank lines.
- Confirm all endpoints return `401/403` when the Supabase session cookie is missing or invalid.
