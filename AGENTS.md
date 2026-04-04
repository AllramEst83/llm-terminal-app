# Agent notes (llm-terminal-app)

## Goal

Ship focused changes for this React + TypeScript terminal chat app. Prefer matching existing patterns over introducing new abstractions.

## Where things live

- **Rules:** `.cursor/rules/` (foundation + `src/` frontend rule).
- **Commands:** `.cursor/commands/` (refactor helpers).

## Commands

- `npm run dev` — Vite dev server (port 3000).
- `npm test` — Vitest.
- `npm run build` / `npm run preview` — production build and preview.

## Constraints

- Do not assume Supabase or Edge Functions unless a `supabase/` tree exists in the repo.
- API key wiring uses `GEMINI_API_KEY` / Vite `define` (see `vite.config.ts`).

## Quality bar

- Respect layer boundaries under `src/` (see `.cursor/rules/react-terminal-app.mdc`).
- Keep diffs minimal and relevant to the requested task.
