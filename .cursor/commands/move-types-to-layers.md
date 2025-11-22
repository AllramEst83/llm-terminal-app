---
description: Command to move types and interfaces to appropriate Clean Architecture layers
---

# Move Types and Interfaces to Clean Code Layers

## Purpose

This command guides the AI agent to identify, categorize, and move types and interfaces to their appropriate Clean Architecture layers, ensuring proper separation of concerns and maintainability.

## When to Use

Use this command when you want to:

- Refactor types/interfaces that are defined inline in components, contexts, or function handlers
- Organize types according to Clean Architecture principles
- Improve code maintainability by centralizing type definitions
- Ensure types are in the correct layer (domain, application, or infrastructure)
- Create a consistent type organization structure

## Command Format

```
Move types and interfaces to appropriate clean code layers:
[File path or code selection]
[Optional: Specific type/interface names]
```

## Clean Architecture Layer Rules

### 1. Domain Layer (`_shared/domain/` or `src/types/domain/`)

**Purpose**: Core business logic, entities, and value objects

**Contains**:
- Domain entities (User, Repository, Branch, File, etc.)
- Value objects (Email, RepositoryName, etc.)
- Domain interfaces (Repository interfaces, Service interfaces)
- Business rules and domain models
- Pure TypeScript/JavaScript - NO framework dependencies

**Examples**:
```typescript
// ✅ Good: Domain entity
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export interface Repository {
  id: string;
  name: string;
  owner: string;
  isPrivate: boolean;
}

// ✅ Good: Value object
export interface Branch {
  name: string;
  sha: string;
  isDefault: boolean;
}

// ✅ Good: Domain interface
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
```

### 2. Application Layer (`_shared/application/` or `src/types/application/`)

**Purpose**: Use cases, DTOs, and application services

**Contains**:
- Request/Response DTOs (Data Transfer Objects)
- Use case interfaces
- Use case implementations (services)
- Type guards for request validation
- Application-level types
- Depends only on domain layer

**Examples**:
```typescript
// ✅ Good: Request DTO
export interface DeleteRepoRequest {
  owner: string;
  repo: string;
}

// ✅ Good: Response DTO
export interface DeleteRepoResponse {
  success: boolean;
  message: string;
}

// ✅ Good: Type guard
export function isValidDeleteRepoRequest(
  body: unknown
): body is DeleteRepoRequest {
  return (
    typeof body === "object" &&
    body !== null &&
    "owner" in body &&
    "repo" in body &&
    typeof (body as DeleteRepoRequest).owner === "string" &&
    typeof (body as DeleteRepoRequest).repo === "string"
  );
}

// ✅ Good: Use case interface
export interface DeleteRepoUseCase {
  execute(request: DeleteRepoRequest): Promise<DeleteRepoResponse>;
}
```

### 3. Infrastructure Layer (`_shared/infrastructure/` or `src/types/infrastructure/`)

**Purpose**: External services, framework-specific code, and implementations

**Contains**:
- External API types (GitHub API types, Supabase types)
- Repository implementations
- Framework-specific types (React component props that are infrastructure-specific)
- HTTP client types
- Database access types
- Implements interfaces from domain/application layers

**Examples**:
```typescript
// ✅ Good: External API type
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  // ... GitHub API specific fields
}

// ✅ Good: Supabase client type
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// ✅ Good: Infrastructure implementation
export class SupabaseUserRepository implements UserRepository {
  // Implementation
}
```

### 4. Frontend-Specific Types (`src/types/`)

**For React/UI components**, create a separate structure:

- `src/types/domain/` - Domain entities (shared with backend)
- `src/types/application/` - Application DTOs (shared with backend)
- `src/types/ui/` - UI-specific types (component props, context types)
- `src/types/infrastructure/` - Infrastructure types (shared with backend)

**UI Component Props**:
```typescript
// ✅ Good: UI-specific type
// src/types/ui/components.ts
export interface CodeEditorProps {
  content: string;
  onChange: (content: string) => void;
  language?: string;
  readOnly?: boolean;
}

export interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}
```

**Context Types**:
```typescript
// ✅ Good: Context type
// src/types/ui/context.ts
export interface GithubContextType {
  octokit: Octokit | null;
  user: GitHubUser | null;
  loading: boolean;
  error: string | null;
  initializing: boolean;
  currentBranch: string;
  branches: string[];
  setCurrentBranch: (branch: string) => void;
  fetchBranches: (owner: string, repo: string) => Promise<void>;
  createBranch: (owner: string, repo: string, newBranchName: string) => Promise<void>;
}
```

## Refactoring Process

### Step 1: Identify Types and Interfaces

1. **Scan the specified file(s)**:
   - Find all `interface` declarations
   - Find all `type` declarations
   - Find all inline type definitions
   - Note their current location and usage

2. **Categorize each type**:
   - **Domain**: Core business entities, value objects, domain interfaces
   - **Application**: Request/Response DTOs, use case interfaces, type guards
   - **Infrastructure**: External API types, framework-specific types
   - **UI**: Component props, context types (frontend only)

### Step 2: Determine Target Location

**For Backend Types** (`supabase/functions/`):
- Domain → `supabase/functions/_shared/domain/[entity-name].ts`
- Application → `supabase/functions/_shared/application/[use-case-name].ts`
- Infrastructure → `supabase/functions/_shared/infrastructure/[service-name].ts`

**For Frontend Types** (`src/`):
- Domain → `src/types/domain/[entity-name].ts`
- Application → `src/types/application/[use-case-name].ts`
- Infrastructure → `src/types/infrastructure/[service-name].ts`
- UI → `src/types/ui/[category].ts` (e.g., `components.ts`, `context.ts`)

**For Shared Types** (used by both frontend and backend):
- Create in backend `_shared/` and import in frontend
- Or create in `src/types/` and import in backend
- Prefer backend `_shared/` for domain/application types

### Step 3: Create Type Files

1. **Create the appropriate directory structure** if it doesn't exist:
   ```bash
   # Backend
   supabase/functions/_shared/domain/
   supabase/functions/_shared/application/
   supabase/functions/_shared/infrastructure/
   
   # Frontend
   src/types/domain/
   src/types/application/
   src/types/infrastructure/
   src/types/ui/
   ```

2. **Create type files** following naming conventions:
   - Use kebab-case for file names: `user.ts`, `delete-repo.ts`, `github-api.ts`
   - Use PascalCase for type/interface names: `User`, `DeleteRepoRequest`
   - Group related types in the same file
   - Export all types explicitly

3. **Write type definitions**:
   ```typescript
   // Example: supabase/functions/_shared/domain/user.ts
   export interface User {
     id: string;
     email: string;
     createdAt: Date;
   }
   
   export interface UserEntity {
     readonly id: string;
     readonly email: string;
     readonly createdAt: Date;
     
     isActive(): boolean;
   }
   ```

### Step 4: Move Types

1. **Extract types from source files**:
   - Remove type definitions from components, contexts, or function handlers
   - Keep only imports and usage

2. **Update source files**:
   ```typescript
   // Before: Type defined inline
   // src/components/CodeEditor.tsx
   interface CodeEditorProps {
     content: string;
     onChange: (content: string) => void;
   }
   
   export const CodeEditor: React.FC<CodeEditorProps> = ({ content, onChange }) => {
     // ...
   };
   
   // After: Type imported from appropriate layer
   // src/components/CodeEditor.tsx
   import type { CodeEditorProps } from '../types/ui/components';
   
   export const CodeEditor: React.FC<CodeEditorProps> = ({ content, onChange }) => {
     // ...
   };
   ```

3. **Update all imports**:
   - Find all files that use the moved types
   - Update import statements
   - Ensure no broken references

### Step 5: Handle Dependencies

1. **Check type dependencies**:
   - If a type depends on another type, ensure proper layer ordering
   - Domain types should not depend on application/infrastructure
   - Application types can depend on domain types
   - Infrastructure types can depend on domain/application types

2. **Create barrel exports** (optional but recommended):
   ```typescript
   // src/types/domain/index.ts
   export * from './user';
   export * from './repository';
   export * from './branch';
   
   // Usage
   import { User, Repository, Branch } from '../types/domain';
   ```

### Step 6: Verify and Test

1. **Check for TypeScript errors**:
   - Run TypeScript compiler
   - Fix any import errors
   - Ensure all types are properly exported

2. **Verify layer boundaries**:
   - Domain layer has no external dependencies
   - Application layer only depends on domain
   - Infrastructure layer can depend on domain/application
   - UI layer can depend on all layers

## Type Classification Guide

### Domain Types (Core Business Logic)

**Indicators**:
- Represents core business entities (User, Repository, Branch, File)
- Contains business rules or domain logic
- No framework dependencies
- Pure data structures with business meaning

**Examples**:
- `User`, `Repository`, `Branch`, `File`, `Commit`
- `Email`, `RepositoryName` (value objects)
- `UserRepository` (domain interface)

### Application Types (Use Cases & DTOs)

**Indicators**:
- Request/Response structures for operations
- Use case interfaces
- Type guards for validation
- Application-level orchestration types

**Examples**:
- `DeleteRepoRequest`, `DeleteRepoResponse`
- `CreateBranchRequest`, `CreateBranchResponse`
- `DeleteUserUseCase`, `FetchBranchesUseCase`
- `isValidDeleteRepoRequest()` (type guard)

### Infrastructure Types (External Services)

**Indicators**:
- Types from external APIs (GitHub, Supabase)
- Framework-specific types
- HTTP client types
- Database access types

**Examples**:
- `GitHubUser`, `GitHubRepository` (GitHub API types)
- `SupabaseConfig`, `SupabaseClient` (Supabase types)
- `Octokit` related types

### UI Types (Frontend Components)

**Indicators**:
- React component props
- Context types
- UI state types
- Form types

**Examples**:
- `CodeEditorProps`, `SidebarProps`
- `GithubContextType`, `AuthContextType`
- `Theme`, `ThemeContextType`

## Best Practices

### File Organization

- ✅ Group related types in the same file
- ✅ Use descriptive file names (kebab-case)
- ✅ Create barrel exports for convenience
- ✅ Keep files focused (one entity/use case per file when possible)

### Type Definitions

- ✅ Use `interface` for object shapes that might be extended
- ✅ Use `type` for unions, intersections, and computed types
- ✅ Export types explicitly
- ✅ Use descriptive, intention-revealing names
- ✅ Avoid `any` - use `unknown` and type guards instead

### Layer Dependencies

- ✅ Domain layer: NO dependencies
- ✅ Application layer: Can depend on domain
- ✅ Infrastructure layer: Can depend on domain/application
- ✅ UI layer: Can depend on all layers

### Naming Conventions

- ✅ Types/Interfaces: PascalCase (`User`, `DeleteRepoRequest`)
- ✅ Files: kebab-case (`user.ts`, `delete-repo.ts`)
- ✅ Type guards: `isValid*` or `is*` prefix
- ✅ DTOs: `*Request`, `*Response` suffix

## Example Refactoring

### Before: Types Defined Inline

```typescript
// src/context/GithubContext.tsx
interface GithubContextType {
  octokit: Octokit | null;
  user: any | null;
  loading: boolean;
  error: string | null;
  initializing: boolean;
  currentBranch: string;
  branches: string[];
  setCurrentBranch: (branch: string) => void;
  fetchBranches: (owner: string, repo: string) => Promise<void>;
  createBranch: (owner: string, repo: string, newBranchName: string) => Promise<void>;
}

// src/components/RepoList.tsx
interface Repo {
  id: string;
  name: string;
  owner: string;
  isPrivate: boolean;
}

interface RepoListProps {
  repos: Repo[];
  onSelect: (repo: Repo) => void;
}
```

### After: Types in Appropriate Layers

**Step 1: Create Domain Type**
```typescript
// src/types/domain/repository.ts
export interface Repository {
  id: string;
  name: string;
  owner: string;
  isPrivate: boolean;
}
```

**Step 2: Create UI Types**
```typescript
// src/types/ui/context.ts
import type { Octokit } from 'octokit';
import type { GitHubUser } from '../infrastructure/github';

export interface GithubContextType {
  octokit: Octokit | null;
  user: GitHubUser | null;
  loading: boolean;
  error: string | null;
  initializing: boolean;
  currentBranch: string;
  branches: string[];
  setCurrentBranch: (branch: string) => void;
  fetchBranches: (owner: string, repo: string) => Promise<void>;
  createBranch: (owner: string, repo: string, newBranchName: string) => Promise<void>;
}

// src/types/ui/components.ts
import type { Repository } from '../domain/repository';

export interface RepoListProps {
  repos: Repository[];
  onSelect: (repo: Repository) => void;
}
```

**Step 3: Update Source Files**
```typescript
// src/context/GithubContext.tsx
import type { GithubContextType } from '../types/ui/context';

const GithubContext = createContext<GithubContextType | undefined>(undefined);

// src/components/RepoList.tsx
import type { RepoListProps } from '../types/ui/components';
import type { Repository } from '../types/domain/repository';

export const RepoList: React.FC<RepoListProps> = ({ repos, onSelect }) => {
  // ...
};
```

## Verification Checklist

After moving types, verify:

- [ ] All types are in appropriate layers
- [ ] No types defined in components, contexts, or function handlers
- [ ] All imports are updated correctly
- [ ] No TypeScript errors
- [ ] Layer dependencies are correct (domain → application → infrastructure)
- [ ] Type names are descriptive and follow conventions
- [ ] Related types are grouped in the same file
- [ ] Barrel exports are created (if needed)
- [ ] All usages of moved types are updated
- [ ] No circular dependencies

## Common Patterns

### Shared Types Between Frontend and Backend

If a type is used in both frontend and backend:

1. **Option 1**: Define in backend `_shared/` and import in frontend
   ```typescript
   // supabase/functions/_shared/domain/repository.ts
   export interface Repository {
     id: string;
     name: string;
   }
   
   // src/types/domain/repository.ts (re-export or import)
   export type { Repository } from '../../../supabase/functions/_shared/domain/repository.ts';
   ```

2. **Option 2**: Create a shared types package (for larger projects)

3. **Option 3**: Define in frontend and import in backend (if frontend is source of truth)

### Type Guards

Always place type guards in the application layer:

```typescript
// supabase/functions/_shared/application/delete-repo.ts
export interface DeleteRepoRequest {
  owner: string;
  repo: string;
}

export function isValidDeleteRepoRequest(
  body: unknown
): body is DeleteRepoRequest {
  // Validation logic
}
```

### Component Props

Component props are UI-specific and should be in `src/types/ui/`:

```typescript
// src/types/ui/components.ts
export interface CodeEditorProps {
  content: string;
  onChange: (content: string) => void;
  language?: string;
}
```

## Troubleshooting

- **Circular dependencies**: Ensure proper layer ordering (domain → application → infrastructure)
- **Missing imports**: Check all files that use the moved types
- **Type errors**: Verify type definitions match their usage
- **Layer violations**: Ensure types don't depend on layers they shouldn't

