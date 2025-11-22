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

This guide provides best practices for React + TypeScript applications following Clean Architecture principles. The structure and patterns described here are adaptable to any React project, regardless of its specific domain or external dependencies.

## Technology Stack

Common technologies used in React + TypeScript projects (adapt to your project):

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite, Create React App, or Next.js
- **State Management**: React Context, Zustand, Redux, or Jotai (as needed)
- **Styling**: CSS Modules, Tailwind CSS, styled-components, or inline styles with CSS variables
- **UI Libraries**: Material-UI, Chakra UI, Ant Design, or custom components
- **HTTP Client**: Fetch API, Axios, or React Query
- **Form Handling**: React Hook Form, Formik, or controlled components
- **Routing**: React Router, Next.js Router, or TanStack Router

## Project Structure

This project follows **Clean Architecture** principles with a hybrid folder-by-layer approach. The structure is flexible and can be adapted based on project needs:

```
src/
├── domain/                    # Core business entities (NO framework dependencies)
│   ├── entities/             # Domain entities (e.g., User, Product, Order)
│   │   ├── user.ts
│   │   ├── product.ts
│   │   └── order.ts
│   ├── interfaces/           # Domain repository interfaces
│   │   ├── user-repository.interface.ts
│   │   └── product-repository.interface.ts
│   ├── services/             # Domain services (optional, pure business logic)
│   └── index.ts              # Barrel exports
│
├── application/              # Use cases and application services
│   ├── use-cases/            # Application use cases
│   │   ├── create-user.ts
│   │   ├── fetch-products.ts
│   │   ├── update-order.ts
│   │   └── delete-item.ts
│   ├── dto/                  # Data Transfer Objects (optional)
│   └── index.ts              # Barrel exports
│
├── infrastructure/           # External services and implementations
│   ├── api/                  # API clients (REST, GraphQL, etc.)
│   │   ├── api-client.ts
│   │   └── endpoints/
│   ├── storage/              # Storage implementations (localStorage, IndexedDB, etc.)
│   │   └── local-storage.ts
│   ├── auth/                 # Authentication implementations
│   │   └── auth-service.ts
│   ├── utils/                # Utility functions
│   │   ├── date-utils.ts
│   │   └── validation-utils.ts
│   └── index.ts              # Barrel exports
│
├── presentation/             # React-specific code (UI layer)
│   ├── components/
│   │   ├── common/           # Shared/reusable components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Layout.tsx
│   │   └── features/         # Feature-specific components
│   │       ├── UserProfile.tsx
│   │       ├── ProductList.tsx
│   │       └── OrderForm.tsx
│   ├── context/              # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── AppContext.tsx
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useApi.ts
│   └── pages/                # Page-level components
│       ├── Home.tsx
│       ├── Login.tsx
│       └── Dashboard.tsx
│
├── types/                    # TypeScript types organized by layer
│   ├── domain/               # Domain entity types
│   ├── application/          # Application DTOs and use case types
│   ├── infrastructure/       # External API types
│   │   └── api-types.ts
│   └── ui/                   # UI-specific types
│       ├── context.ts
│       └── component-props.ts
│
└── assets/                   # Static assets (images, icons, fonts)
```

**Note**: Not all projects need all layers. Smaller projects may combine layers or skip some. Adapt the structure to your project's complexity and needs.

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
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

// ❌ Bad: Inline types or any
function Button(props: any) { ... }
```

#### Context Types

```typescript
// ✅ Good: Types defined in src/types/ui/context.ts
// src/types/ui/context.ts
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
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
import { Button } from "../common/Button";
import { Spinner } from "../common/Spinner";

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

- Components: PascalCase (`UserProfile`, `ProductList`, `OrderForm`)
- Files: Match component name exactly (`UserProfile.tsx`)
- One component per file (with exceptions for related sub-components)
- Export as named export: `export const Component`

### Hooks Rules

#### useState

```typescript
// ✅ Good: Explicit type, meaningful name
const [userName, setUserName] = useState<string>("");
const [isLoading, setIsLoading] = useState<boolean>(false);
const [items, setItems] = useState<Item[]>([]);

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
export function useFetchData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch logic
  }, [url]);

  return { data, loading, error };
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

### Styling Approaches

Choose a styling approach that fits your project:

**Option 1: CSS Variables (Recommended for theme systems)**

```typescript
// Define in global CSS file (e.g., src/index.css)
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #000000;
  --text-secondary: #666666;
  --accent-color: #007bff;
  --danger-color: #dc3545;
  --border-color: #dee2e6;
}

// Use in components
const styles = {
  container: {
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    padding: "20px",
  },
};
```

**Option 2: CSS Modules**

```typescript
// Component.module.css
.container {
  background-color: var(--bg-primary);
  padding: 20px;
}

// Component.tsx
import styles from './Component.module.css';
<div className={styles.container}>...</div>
```

**Option 3: Styled Components / CSS-in-JS**

```typescript
import styled from "styled-components";

const Container = styled.div`
  background-color: ${(props) => props.theme.bgPrimary};
  padding: 20px;
`;
```

**Option 4: Utility-first (Tailwind CSS)**

```typescript
<div className="bg-white p-5 border border-gray-300">Content</div>
```

### Styling Rules

- Choose one primary styling approach and be consistent
- Keep styles co-located with components when possible
- Use theme system for dynamic theming (dark/light mode)
- Ensure accessibility (contrast ratios, focus states, ARIA labels)
- Prefer CSS variables for theme values
- Use responsive design patterns (mobile-first recommended)

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

- Use a notification library (react-hot-toast, react-toastify, etc.) or custom error UI
- Display errors in UI when appropriate
- Log errors to console for debugging (use proper logging in production)
- Never silently swallow errors
- Provide user-friendly error messages

## State Management

### Local State

- Use `useState` for component-local state
- Use `useReducer` for complex state logic
- Keep state as close to where it's used as possible

### Global State

- Use Context for global state (Auth, Theme, App-wide settings)
- Consider state management libraries (Zustand, Redux, Jotai) for complex state
- Don't overuse Context (avoid prop drilling, but prefer props for local state)
- Consider extracting to custom hooks for complex logic
- Keep global state minimal - only what truly needs to be shared

### State Patterns

```typescript
// ✅ Good: Clear state structure
interface FormState {
  values: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
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
// src/application/use-cases/fetch-user.ts
import type { User } from "../../domain/entities/user";
import type { UserRepository } from "../../domain/interfaces/user-repository.interface";

export class FetchUserUseCase {
  private userRepo: UserRepository;

  constructor(userRepo: UserRepository) {
    this.userRepo = userRepo;
  }

  async execute(request: { userId: string }): Promise<User> {
    const user = await this.userRepo.findById(request.userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }
}
```

**Infrastructure Implementation:**

```typescript
// ✅ Good: Infrastructure implements domain interface
// src/infrastructure/api/user-api-repository.ts
import type { UserRepository } from "../../domain/interfaces/user-repository.interface";
import type { User } from "../../domain/entities/user";

export class UserApiRepository implements UserRepository {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async findById(userId: string): Promise<User> {
    const response = await this.apiClient.get(`/users/${userId}`);
    return {
      id: response.data.id,
      email: response.data.email,
      name: response.data.name,
    };
  }
}
```

**Usage in Presentation Layer:**

```typescript
// ✅ Good: Component uses use case
// src/presentation/components/features/UserProfile.tsx
import { FetchUserUseCase } from "../../../application/use-cases/fetch-user";
import { UserApiRepository } from "../../../infrastructure/api/user-api-repository";
import { useApiClient } from "../../hooks/useApiClient";

const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const apiClient = useApiClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userRepo = new UserApiRepository(apiClient);
    const useCase = new FetchUserUseCase(userRepo);

    useCase.execute({ userId }).then(setUser).catch(console.error);
  }, [userId, apiClient]);

  return user ? <div>{user.name}</div> : <Spinner />;
};
```

### API Rules

- **Domain layer**: Define interfaces, NO API calls
- **Application layer**: Use cases orchestrate domain logic
- **Infrastructure layer**: Implement domain interfaces, handle external APIs
- **Presentation layer**: Use use cases, don't call infrastructure directly
- Always check for client/service existence before API calls
- Handle API errors gracefully with proper error types
- Use proper HTTP methods and status codes
- Implement request/response interceptors for common concerns (auth, errors)
- Consider using React Query or SWR for data fetching and caching
- Handle loading and error states consistently

## Data Operations

### Data Fetching Pattern

```typescript
const handleFetchData = async (id: string) => {
  setLoading(true);
  setError(null);

  try {
    const data = await apiService.fetchById(id);
    setData(data);
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("Failed to fetch data:", error);
    setError(error.message);
    // Show user-friendly error message
  } finally {
    setLoading(false);
  }
};
```

### Data Handling Best Practices

- Always handle loading and error states
- Validate data before using it
- Use type guards for runtime type checking
- Handle edge cases (empty data, null values, etc.)
- Implement proper error boundaries
- Consider caching strategies for frequently accessed data

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
import axios from "axios";
import { format } from "date-fns";

// 3. Domain layer (business entities)
import type { User, Product, Order } from "../../domain";
import type { UserRepository } from "../../domain/interfaces/user-repository.interface";

// 4. Application layer (use cases)
import { FetchUserUseCase } from "../../application/use-cases/fetch-user";
import { CreateOrderUseCase } from "../../application/use-cases/create-order";

// 5. Infrastructure layer (external services)
import { UserApiRepository } from "../../infrastructure/api/user-api-repository";
import { apiClient } from "../../infrastructure/api/api-client";
import {
  formatDate,
  validateEmail,
} from "../../infrastructure/utils/validation-utils";

// 6. Presentation layer (context, components)
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../common/Button";
import { Modal } from "../common/Modal";
import { UserCard } from "../features/UserCard";

// 7. Types (UI-specific types)
import type { AuthContextType } from "../../types/ui/context";
import type { ButtonProps } from "../../types/ui/component-props";
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

- External services: `src/infrastructure/api/`, `src/infrastructure/storage/`, `src/infrastructure/auth/`
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
- ❌ Don't use inline styles without a consistent styling approach
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
- [ ] Consistent styling approach used (CSS variables, CSS modules, etc.)
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
