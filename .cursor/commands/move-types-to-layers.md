---
description: Move types and interfaces into the right Clean Architecture folders under src/
---

# Move types to layers (`src/`)

## When to use

- Types or interfaces live inline in components, hooks, or services and should be centralized.
- You are splitting UI types from domain or infrastructure concerns.

## Target layout

| Kind of type | Put it in |
|--------------|-----------|
| Domain entities / value objects (no React) | `src/domain/entities/` (or adjacent domain modules) |
| Use-case inputs/outputs, app-level DTOs | Next to the use case under `src/application/use-cases/`, or add `src/types/application/` if shared |
| Gemini/API/storage shapes | Next to the client under `src/infrastructure/`, or add `src/types/infrastructure/` if shared |
| Component props, context shapes | `src/types/ui/` (e.g. `components.ts`) |

**Rules:** Domain types must not import React or `@google/genai`. UI types may import domain types; avoid the reverse.

## Process

1. List `interface` / `type` declarations in the touched file(s) and classify them.
2. Create or reuse a file under the table above; use kebab-case filenames.
3. Replace inline definitions with `import type { ... } from '@/src/types/...'` (or relative imports consistent with nearby code).
4. Run `npm test` and fix imports.

## Checklist

- [ ] No circular imports (domain must not depend on presentation).
- [ ] `npm test` passes.
- [ ] Exports are explicit; names stay consistent with call sites.
