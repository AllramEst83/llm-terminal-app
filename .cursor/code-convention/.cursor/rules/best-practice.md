---
description: Universal clean code principles and best practices (Uncle Bob, SOLID, DRY)
globs:
  - "**/*"
alwaysApply: true
---

# Code Convention - Best Practices

## When to Apply

**This file applies to ALL code in the repository** - both frontend (`src/`) and backend (`supabase/functions/`). These are universal principles that must be followed regardless of the codebase section.

## Core Architecture Principles

### 1. Clean Code (Uncle Bob's Principles)

- **Meaningful Names**: Use descriptive, intention-revealing names
  - Variables, functions, and classes should clearly express their purpose
  - Avoid abbreviations unless they're universally understood
  - Use searchable names (avoid magic numbers/strings)
- **Functions Should Do One Thing**: Single Responsibility Principle (SRP)
  - Functions should be small and focused
  - If a function does more than one thing, split it
  - Function names should describe what they do, not how
- **Don't Repeat Yourself (DRY)**
  - Extract common logic into reusable functions/utilities
  - Create shared modules for repeated patterns
  - Use composition over duplication
- **Comments Should Explain "Why", Not "What"**
  - Code should be self-documenting
  - Only comment when business logic or complex algorithms need explanation
  - Remove commented-out code before committing

### 2. SOLID Principles

#### Single Responsibility Principle (SRP)

- Each module/class/function should have one reason to change
- Separate concerns: UI, business logic, data access, etc.

#### Open/Closed Principle (OCP)

- Open for extension, closed for modification
- Use interfaces and abstractions
- Prefer composition over inheritance

#### Liskov Substitution Principle (LSP)

- Derived classes must be substitutable for their base classes
- Interfaces should be properly implemented

#### Interface Segregation Principle (ISP)

- Clients should not depend on interfaces they don't use
- Create specific, focused interfaces

#### Dependency Inversion Principle (DIP)

- Depend on abstractions, not concretions
- High-level modules should not depend on low-level modules

### 3. Code Organization

#### File Structure

- One main export per file (with exceptions for related utilities)
- Files should be organized by feature/domain, not by type
- Related code should be co-located

#### Import Organization

```typescript
// 1. External dependencies
import React from "react";
import { Octokit } from "octokit";

// 2. Internal absolute imports (from src/)
import { useAuth } from "@/context/AuthContext";

// 3. Relative imports
import { Component } from "./Component";
import { helper } from "../utils/helper";
```

#### Function Organization

```typescript
// 1. Type definitions and interfaces
interface Props { ... }

// 2. Constants
const DEFAULT_VALUE = 10;

// 3. Helper functions (private to module)
function helperFunction() { ... }

// 4. Main exported function/component
export function MainComponent() { ... }
```

### 4. TypeScript Best Practices

#### Strict Type Safety

- **NEVER use `any`** - Use `unknown` if type is truly unknown, then narrow it
- Use `as` assertions sparingly and only when absolutely necessary
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use discriminated unions for state management
- Leverage TypeScript's type inference where appropriate

#### Type Definitions

```typescript
// ✅ Good: Explicit, reusable interface
interface User {
  id: string;
  email: string;
  name: string;
}

// ❌ Bad: Inline object type
function processUser(user: { id: string; email: string; name: string }) { ... }

// ✅ Good: Discriminated union
type LoadingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };
```

#### Null Safety

- Always handle null/undefined explicitly
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Use type guards for runtime type checking

### 5. Error Handling

#### Principles

- Fail fast - validate inputs early
- Use specific error types, not generic Error
- Always handle errors at the appropriate level
- Never swallow errors silently

#### Error Handling Pattern

```typescript
// ✅ Good: Specific error handling
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  if (error instanceof ValidationError) {
    return { success: false, error: error.message };
  }
  console.error("Unexpected error:", error);
  return { success: false, error: "An unexpected error occurred" };
}

// ❌ Bad: Silent failure
try {
  await operation();
} catch (error) {
  // Swallowed error
}
```

### 6. Testing Principles

#### Test Structure

- Arrange-Act-Assert (AAA) pattern
- One assertion per test (when possible)
- Test behavior, not implementation
- Use descriptive test names: `should return error when user is not authenticated`

#### Test Coverage

- Test happy paths
- Test error cases
- Test edge cases (empty, null, boundary values)
- Test integration points

### 7. Performance Considerations

#### Optimization Rules

- Don't optimize prematurely
- Profile before optimizing
- Optimize for readability first, performance second
- Use memoization (React.memo, useMemo, useCallback) judiciously

#### Code Splitting

- Lazy load routes and heavy components
- Split vendor bundles
- Load code on demand

### 8. Security Best Practices

#### Input Validation

- Always validate and sanitize user input
- Use parameterized queries (when applicable)
- Validate on both client and server

#### Authentication & Authorization

- Never trust client-side validation alone
- Verify permissions server-side
- Use secure token storage
- Implement proper CORS policies

### 9. Code Review Checklist

Before submitting code, ensure:

- [ ] Code follows SOLID principles
- [ ] No code duplication (DRY)
- [ ] Meaningful names used throughout
- [ ] Functions are small and focused
- [ ] Error handling is comprehensive
- [ ] TypeScript types are strict (no `any`)
- [ ] Comments explain "why", not "what"
- [ ] Tests are included for new features
- [ ] No console.logs in production code
- [ ] No commented-out code
- [ ] Code is properly formatted
- [ ] Imports are organized

### 10. Refactoring Principles

#### When to Refactor

- When adding a feature (improve code structure first)
- When fixing a bug (improve surrounding code)
- When code review reveals issues
- When technical debt accumulates

#### Refactoring Rules

- **Always improve the solution** - Move or create files to improve architecture
- Extract common patterns into utilities
- Break down large functions
- Improve naming for clarity
- Remove dead code
- Simplify complex conditionals

#### Refactoring Safety

- Refactor in small, incremental steps
- Run tests after each refactoring step
- Keep code working throughout refactoring
- Use version control to track changes

### 11. Code Smells to Avoid

#### Common Code Smells

- **Long functions** (> 20 lines should be reviewed)
- **Large classes/components** (split into smaller pieces)
- **Duplicate code** (extract to shared utilities)
- **Magic numbers/strings** (use named constants)
- **Deep nesting** (extract functions, use early returns)
- **Feature envy** (function uses more of another object than its own)
- **Data clumps** (group related data into objects)
- **Primitive obsession** (use value objects for domain concepts)

### 12. Documentation Standards

#### Code Documentation

- Use JSDoc for public APIs
- Document complex algorithms
- Explain business rules and domain logic
- Keep README files updated

#### JSDoc Example

```typescript
/**
 * Fetches user repositories from GitHub API.
 *
 * @param owner - The repository owner's username
 * @param repo - The repository name
 * @param branch - Optional branch name, defaults to 'main'
 * @returns Promise resolving to repository data
 * @throws {AuthenticationError} When user is not authenticated
 * @throws {NotFoundError} When repository doesn't exist
 */
async function fetchRepository(
  owner: string,
  repo: string,
  branch: string = "main"
): Promise<Repository> {
  // Implementation
}
```

### 13. Git Commit Practices

#### Commit Messages

- Use clear, descriptive commit messages
- Follow conventional commits format when possible
- Reference issues/tickets when applicable

#### Commit Structure

```
type(scope): subject

body (optional)

footer (optional)
```

### 14. Continuous Improvement

#### Code Quality Metrics

- Cyclomatic complexity should be low
- Function length should be reasonable
- Test coverage should be maintained
- Technical debt should be tracked and addressed

#### Regular Maintenance

- Review and refactor code regularly
- Update dependencies
- Remove unused code
- Improve documentation
- Address linting warnings

## Enforcement

These principles are **MANDATORY** and must be followed in all code. The AI agent should:

1. Always apply these principles when writing or modifying code
2. Suggest refactoring when code violates these principles
3. Move or create files to improve solution architecture
4. Never compromise on code quality for speed
5. Always improve the solution, never degrade it

## References

- "Clean Code" by Robert C. Martin (Uncle Bob)
- "The Clean Coder" by Robert C. Martin
- "Refactoring" by Martin Fowler
- SOLID Principles
- Domain-Driven Design (DDD)
