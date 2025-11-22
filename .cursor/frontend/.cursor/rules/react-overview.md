---
description: React and TypeScript best practices for frontend development
globs:
  - "src/**/*.{ts,tsx,js,jsx}"
alwaysApply: false
---

# Frontend - React & TypeScript Overview

## When to Apply

**This file applies to ALL frontend code** in `src/` directory, including:

- React components (`src/presentation/components/`)
- Context providers (`src/presentation/context/`)
- Pages (`src/presentation/pages/`)
- Domain entities (`src/domain/`)
- Application use cases (`src/application/`)
- Infrastructure services (`src/infrastructure/`)
- Type definitions (`src/types/`)
- Main application files (`src/App.tsx`, `src/main.tsx`)

## Project Overview

This is a React 19.2.0 + TypeScript code editor application that allows users to browse, edit, and manage GitHub repositories through a web interface. It uses Supabase for authentication and Octokit for GitHub API interactions.

## Technology Stack

- **Frontend Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 7.2.4
- **Authentication**: Supabase (GitHub OAuth)
- **GitHub API**: Octokit 5.0.5
- **Code Editor**: Monaco Editor (@monaco-editor/react)
- **UI Icons**: Lucide React
- **Notifications**: react-hot-toast
- **Markdown**: react-markdown with react-syntax-highlighter

## Project Structure

This project follows **Clean Architecture** principles with a hybrid folder-by-layer approach:

```
src/
├── domain/                    # Core business entities (NO framework dependencies)
│   ├── entities/
│   │   ├── repository.ts      # Repository domain entity
│   │   ├── branch.ts          # Branch domain entity
│   │   ├── file.ts            # File domain entity
│   │   └── tree-node.ts       # TreeNode domain entity & utilities
│   ├── interfaces/
│   │   └── repository.interface.ts  # Domain repository interfaces
│   └── index.ts               # Barrel exports
│
├── application/              # Use cases and application services
│   ├── use-cases/
│   │   ├── fetch-repositories.ts
│   │   ├── fetch-branches.ts
│   │   ├── create-branch.ts
│   │   ├── fetch-file-tree.ts
│   │   ├── fetch-file-content.ts
│   │   ├── update-file-content.ts
│   │   └── delete-repository.ts
│   └── index.ts              # Barrel exports
│
├── infrastructure/           # External services and implementations
│   ├── github/
│   │   ├── github-client.ts
│   │   ├── github-repository.ts
│   │   ├── github-branch-repository.ts
│   │   ├── github-file-repository.ts
│   │   ├── github-repository-deletion.ts
│   │   └── index.ts
│   ├── supabase/
│   │   ├── supabase-client.ts
│   │   └── index.ts
│   ├── utils/
│   │   └── file-utils.ts      # File utility functions
│   └── index.ts              # Barrel exports
│
├── presentation/             # React-specific code (UI layer)
│   ├── components/
│   │   ├── common/            # Shared/reusable components
│   │   │   ├── Spinner.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── UserMenu.tsx
│   │   └── features/          # Feature-specific components
│   │       ├── RepoList.tsx
│   │       ├── FileTree.tsx
│   │       ├── CodeEditor.tsx
│   │       ├── BranchSelector.tsx
│   │       ├── CommitModal.tsx
│   │       ├── CreateBranchModal.tsx
│   │       ├── DeleteRepoModal.tsx
│   │       └── DeleteAccountModal.tsx
│   ├── context/              # React Context providers
│   │   ├── AuthContext.tsx    # Authentication state
│   │   ├── GithubContext.tsx  # GitHub API client and state
│   │   └── ThemeContext.tsx   # Theme management (dark/light)
│   ├── hooks/                # Custom React hooks (can be added here)
│   └── pages/                # Page-level components
│       ├── Login.tsx
│       ├── Profile.tsx
│       └── Settings.tsx
│
├── types/                    # TypeScript types organized by layer
│   ├── domain/               # Domain entity types
│   ├── application/          # Application DTOs and use case types
│   ├── infrastructure/       # External API types
│   │   └── github.ts         # GitHub API types
│   └── ui/                   # UI-specific types
│       ├── context.ts        # Context types
│       └── theme.ts          # Theme types
│
└── assets/                   # Static assets (images, icons)
```

### Architecture Layers

**Dependency Direction:**

```
presentation → application → domain
presentation → infrastructure → domain
application → domain
infrastructure → domain
```

**Layer Rules:**

- **Domain**: Pure business logic, NO React, NO external libraries
- **Application**: Use cases orchestrate domain logic, depends only on domain
- **Infrastructure**: Implements domain interfaces, handles external APIs
- **Presentation**: React components, can depend on all layers

## TypeScript Standards (Strict)

### Type Definitions

#### Component Props

```typescript
// ✅ Good: Explicit interface with clear naming
interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string | undefined) => void;
  path: string;
}

// ❌ Bad: Inline types or any
function CodeEditor(props: any) { ... }
```

#### Context Types

```typescript
// ✅ Good: Types defined in src/types/ui/context.ts
// src/types/ui/context.ts
import type { Session, User } from "@supabase/supabase-js";

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
}

// ✅ Good: Context implementation in presentation layer
// src/presentation/context/AuthContext.tsx
import type { AuthContextType } from "../../types/ui/context";

const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

#### Type Safety Rules

- **NEVER use `any`** - Use `unknown` and type guards if type is truly unknown
- Use `as` assertions only when absolutely necessary (prefer type guards)
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use discriminated unions for state management
- Always handle `null` and `undefined` explicitly

### Type Guards

```typescript
// ✅ Good: Type guard for runtime type checking
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "email" in value
  );
}
```

## React Component Patterns

### Component Structure (Strict Order)

```typescript
// 1. Imports (organized)
// External dependencies
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

// Internal imports
import { Component } from "./Component";

// 2. Type definitions
interface ComponentProps {
  // Props interface
}

// 3. Constants (if any)
const DEFAULT_VALUE = 10;

// 4. Component
export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 4a. Hooks (in order: useState, useEffect, useContext, custom hooks)
  const [state, setState] = useState<StateType>(initialValue);
  const { user } = useAuth();

  // 4b. Derived state (useMemo, useCallback)
  const memoizedValue = useMemo(() => computeValue(), [dependencies]);
  const memoizedCallback = useCallback(() => handleAction(), [dependencies]);

  // 4c. Effects
  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    };
  }, [dependencies]);

  // 4d. Event handlers
  const handleAction = () => {
    // Handler logic
  };

  // 4e. Render helpers (if complex)
  const renderContent = () => {
    // Render logic
  };

  // 4f. Early returns
  if (loading) return <Spinner />;
  if (error) return <ErrorDisplay error={error} />;

  // 4g. Main render
  return <div>{/* JSX */}</div>;
};
```

### Component Naming

- Components: PascalCase (`CodeEditor`, `RepoList`)
- Files: Match component name exactly (`CodeEditor.tsx`)
- One component per file (with exceptions for related sub-components)
- Export as named export: `export const Component`

### Hooks Rules

#### useState

```typescript
// ✅ Good: Explicit type, meaningful name
const [fileContent, setFileContent] = useState<string>("");
const [isDirty, setIsDirty] = useState<boolean>(false);

// ❌ Bad: Implicit any, unclear name
const [data, setData] = useState(null);
```

#### useEffect

```typescript
// ✅ Good: Clear dependencies, cleanup function
useEffect(() => {
  const subscription = subscribe();
  return () => {
    subscription.unsubscribe();
  };
}, [dependency]);

// ❌ Bad: Missing dependencies or cleanup
useEffect(() => {
  subscribe(); // Memory leak!
});
```

#### Custom Hooks

- Must start with `use` prefix
- Should be in separate files if reusable
- Should follow hook rules (only call other hooks at top level)

```typescript
// ✅ Good: Custom hook with clear purpose
export function useFileContent(filePath: string) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Fetch logic
  }, [filePath]);

  return { content, loading };
}
```

## Context Patterns

### Context Provider Structure

```typescript
// 1. Define context type
interface ContextType {
  value: string;
  setValue: (value: string) => void;
}

// 2. Create context
const Context = createContext<ContextType | undefined>(undefined);

// 3. Provider component
export const ContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [value, setValue] = useState<string>("");

  return (
    <Context.Provider value={{ value, setValue }}>{children}</Context.Provider>
  );
};

// 4. Custom hook with error handling
export const useContext = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useContext must be used within a ContextProvider");
  }
  return context;
};
```

### Context Usage Rules

- Always use custom hooks to access context (never `useContext` directly)
- Context hooks must throw errors if used outside provider
- Providers should handle loading and error states
- Keep context focused (one concern per context)

## Styling Standards

### CSS Variables (Theme System)

All styling uses CSS variables defined in `src/index.css`:

- `--bg-primary`, `--bg-secondary` - Background colors
- `--text-primary`, `--text-secondary` - Text colors
- `--accent-color` - Primary accent color
- `--danger-color` - Error/danger color
- `--border-color` - Border color

### Inline Styles Pattern

```typescript
// ✅ Good: Theme-aware inline styles
const styles = {
  container: {
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    padding: "20px",
  },
  button: {
    backgroundColor: "var(--accent-color)",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
  },
};

// Use theme hook for dynamic theming
const { theme } = useTheme();
const editorTheme = theme === "dark" ? "vs-dark" : "light";
```

### Styling Rules

- Use inline styles with CSS variables (not CSS modules)
- Keep styles co-located with components
- Use theme hook for dynamic theming
- Ensure accessibility (contrast, focus states)

## Error Handling Patterns

### Async Operations

```typescript
// ✅ Good: Comprehensive error handling
const handleAction = async () => {
  try {
    setLoading(true);
    setError(null);
    const result = await apiCall();
    setData(result);
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("Action failed:", error);
    setError(error.message);
    toast.error("Failed to perform action. Please try again.");
  } finally {
    setLoading(false);
  }
};
```

### Error Display

- Use `react-hot-toast` for user notifications
- Display errors in UI when appropriate
- Log errors to console for debugging
- Never silently swallow errors

## State Management

### Local State

- Use `useState` for component-local state
- Use `useReducer` for complex state logic
- Keep state as close to where it's used as possible

### Global State

- Use Context for global state (Auth, GitHub, Theme)
- Don't overuse Context (avoid prop drilling, but prefer props for local state)
- Consider extracting to custom hooks for complex logic

### State Patterns

```typescript
// ✅ Good: Clear state structure
interface FileState {
  content: string;
  originalContent: string;
  sha: string;
  isDirty: boolean;
  loading: boolean;
}

// Use discriminated unions for complex state
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };
```

## Component Patterns

### Modal Components

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading?: boolean;
  // Other props
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  loading,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {loading ? <Spinner /> : children}
      </div>
    </div>
  );
};
```

### List Components

- Handle loading states
- Handle empty states
- Handle error states
- Use consistent list item styling
- Implement proper key props

### Form Components

- Use controlled components
- Validate input
- Show validation errors
- Handle submission states

## API Integration

### Clean Architecture Approach

**Use Cases (Application Layer):**

```typescript
// ✅ Good: Use case in application layer
// src/application/use-cases/fetch-file-content.ts
import type { File } from "../../domain/entities/file";
import type { FileRepository } from "../../domain/interfaces/repository.interface";

export class FetchFileContentUseCase {
  private fileRepo: FileRepository;

  constructor(fileRepo: FileRepository) {
    this.fileRepo = fileRepo;
  }

  async execute(
    request: FetchFileContentRequest
  ): Promise<FetchFileContentResponse> {
    const file = await this.fileRepo.getFileContent(
      request.owner,
      request.repo,
      request.path,
      request.branch
    );
    return { file };
  }
}
```

**Infrastructure Implementation:**

```typescript
// ✅ Good: Infrastructure implements domain interface
// src/infrastructure/github/github-file-repository.ts
import type { FileRepository } from "../../domain/interfaces/repository.interface";
import type { File } from "../../domain/entities/file";

export class GitHubFileRepository implements FileRepository {
  private octokit: Octokit;

  constructor(octokit: Octokit) {
    this.octokit = octokit;
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    branch: string
  ): Promise<File> {
    const { data } = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if (!("content" in data)) {
      throw new Error("Invalid file data");
    }

    let content = Buffer.from(data.content, "base64").toString("utf-8");
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }

    return {
      path: data.path,
      name: data.name,
      type: "blob",
      sha: data.sha,
      content,
    };
  }
}
```

**Usage in Presentation Layer:**

```typescript
// ✅ Good: Component uses use case
// src/presentation/components/features/FileTree.tsx
import { FetchFileContentUseCase } from "../../../application/use-cases/fetch-file-content";
import { GitHubFileRepository } from "../../../infrastructure/github/github-file-repository";
import { useGithub } from "../../context/GithubContext";

const handleSelectFile = async (node: TreeNode) => {
  if (!octokit) return;

  const fileRepo = new GitHubFileRepository(octokit);
  const useCase = new FetchFileContentUseCase(fileRepo);

  const { file } = await useCase.execute({
    owner: selectedRepo.owner,
    repo: selectedRepo.name,
    path: node.path,
    branch: currentBranch,
  });

  setFileContent(file.content || "");
};
```

### API Rules

- **Domain layer**: Define interfaces, NO API calls
- **Application layer**: Use cases orchestrate domain logic
- **Infrastructure layer**: Implement domain interfaces, handle external APIs
- **Presentation layer**: Use use cases, don't call infrastructure directly
- Always check for client existence before API calls
- Handle API errors gracefully
- Use appropriate GitHub API scopes
- Base64 encode/decode file content using Buffer
- Track file SHA for updates

## File Operations

### File Loading Pattern

```typescript
const handleSelectFile = async (node: TreeNode) => {
  if (node.type === "tree") return;

  setLoadingFile(true);
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: selectedRepo.owner.login,
      repo: selectedRepo.name,
      path: node.path,
      ref: currentBranch,
    });

    if (!Array.isArray(data) && "content" in data) {
      let content = Buffer.from(data.content, "base64").toString("utf-8");
      // Strip BOM if present
      if (content.charCodeAt(0) === 0xfeff) {
        content = content.slice(1);
      }
      setFileContent(content);
      setOriginalContent(content);
      setFileSha(data.sha);
    }
  } catch (error) {
    console.error("Failed to load file:", error);
    toast.error("Failed to load file");
  } finally {
    setLoadingFile(false);
  }
};
```

### File Type Handling

- Check for binary files by extension
- Support markdown rendering for `.md` files
- Handle different language syntax highlighting
- Track dirty state for unsaved changes

## Performance Optimization

### React Optimization

```typescript
// ✅ Good: Memoization when appropriate
const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id;
});

const expensiveValue = useMemo(() => computeExpensiveValue(data), [data]);
const memoizedCallback = useCallback(() => handleAction(id), [id]);
```

### Optimization Rules

- Don't optimize prematurely
- Use React.memo for expensive components
- Use useMemo for expensive computations
- Use useCallback for stable function references
- Lazy load routes and heavy components

## Testing Considerations

### Component Testing

- Test component rendering
- Test user interactions
- Test error states
- Test loading states
- Test edge cases

### Test Structure

```typescript
describe("Component", () => {
  it("should render correctly", () => {
    // Arrange
    // Act
    // Assert
  });

  it("should handle user interaction", async () => {
    // Test user interaction
  });
});
```

## Code Organization Rules

### File Organization

- One main component per file
- Co-locate related components
- Extract utilities to separate files
- Group related functionality

### Import Organization

```typescript
// 1. React and React-related
import React, { useState, useEffect } from "react";

// 2. External libraries
import { Octokit } from "octokit";
import { Buffer } from "buffer";

// 3. Domain layer (business entities)
import type { Repository, Branch, File, TreeNode } from "../../domain";
import type { RepositoryRepository } from "../../domain/interfaces/repository.interface";

// 4. Application layer (use cases)
import { FetchRepositoriesUseCase } from "../../application/use-cases/fetch-repositories";

// 5. Infrastructure layer (external services)
import { GitHubRepository } from "../../infrastructure/github/github-repository";
import { supabase } from "../../infrastructure/supabase";
import {
  getLanguageFromPath,
  isBinaryFile,
} from "../../infrastructure/utils/file-utils";

// 6. Presentation layer (context, components)
import { useAuth } from "../../context/AuthContext";
import { useGithub } from "../../context/GithubContext";
import { Spinner } from "../common/Spinner";
import { Modal } from "../features/Modal";

// 7. Types (UI-specific types)
import type { AuthContextType } from "../../types/ui/context";
```

## Common Patterns

### Loading States

```typescript
if (loading || initializing) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Spinner />
    </div>
  );
}
```

### Conditional Rendering

```typescript
{
  user ? <AuthenticatedContent /> : <LoginPrompt />;
}
```

### Error Boundaries

- Consider implementing error boundaries for better error handling
- Catch and display errors gracefully

## Refactoring Guidelines

### When Refactoring Frontend Code

1. **Extract domain entities** - Move business logic to `src/domain/entities/`
2. **Create use cases** - Extract business operations to `src/application/use-cases/`
3. **Move infrastructure code** - External APIs to `src/infrastructure/`
4. **Organize components** - Common components to `presentation/components/common/`, feature components to `presentation/components/features/`
5. **Extract types** - Move types to appropriate layer in `src/types/`
6. **Improve type safety** - Remove `any`, add proper types
7. **Extract constants** - Magic numbers/strings to named constants
8. **Simplify complex conditionals** - Extract to functions
9. **Follow layer boundaries** - Respect dependency direction

### File Movement Rules

**Domain Layer (`src/domain/`):**

- Business entities: `src/domain/entities/`
- Domain interfaces: `src/domain/interfaces/`
- NO React, NO external libraries

**Application Layer (`src/application/`):**

- Use cases: `src/application/use-cases/`
- DTOs: Can be in use case files or separate `dto/` folder
- Depends only on domain layer

**Infrastructure Layer (`src/infrastructure/`):**

- External services: `src/infrastructure/github/`, `src/infrastructure/supabase/`
- Utilities: `src/infrastructure/utils/`
- Implements domain interfaces

**Presentation Layer (`src/presentation/`):**

- Common components: `src/presentation/components/common/`
- Feature components: `src/presentation/components/features/`
- Context: `src/presentation/context/`
- Pages: `src/presentation/pages/`
- Custom hooks: `src/presentation/hooks/`

**Types (`src/types/`):**

- Domain types: `src/types/domain/`
- Application types: `src/types/application/`
- Infrastructure types: `src/types/infrastructure/`
- UI types: `src/types/ui/`

## Avoid

- ❌ Don't use class components
- ❌ Don't bypass context hooks
- ❌ Don't use `any` types
- ❌ Don't ignore TypeScript errors
- ❌ Don't forget to handle loading/error states
- ❌ Don't use inline styles without CSS variables
- ❌ Don't create deeply nested components
- ❌ Don't duplicate code (extract to utilities)
- ❌ Don't use console.log in production code
- ❌ Don't commit commented-out code
- ❌ Don't import React or external libraries in domain layer
- ❌ Don't let domain depend on application/infrastructure
- ❌ Don't let application depend on infrastructure
- ❌ Don't call infrastructure directly from presentation (use use cases)
- ❌ Don't put business logic in components (move to use cases)

## Code Quality Checklist

Before submitting frontend code:

- [ ] Follows React best practices
- [ ] TypeScript types are strict (no `any`)
- [ ] Components follow structure pattern
- [ ] Error handling is comprehensive
- [ ] Loading states are handled
- [ ] Theme-aware styling used
- [ ] No code duplication
- [ ] Meaningful names used
- [ ] Functions are small and focused
- [ ] Proper hook dependencies
- [ ] No memory leaks (cleanup in useEffect)
- [ ] Accessible (keyboard navigation, ARIA)
- [ ] Clean Architecture layers respected
- [ ] Domain layer has no external dependencies
- [ ] Use cases in application layer
- [ ] Infrastructure implements domain interfaces
- [ ] Types organized by layer
- [ ] No business logic in presentation layer
