---
description: Supabase Edge Functions and Deno best practices for backend development
globs:
  - "supabase/functions/**/*.{ts,js}"
alwaysApply: false
---

# Backend - Supabase Edge Functions Overview

## When to Apply
**This file applies to ALL backend code** in `supabase/functions/` directory, including:
- Edge function handlers (`supabase/functions/*/index.ts`)
- Shared utilities (`supabase/functions/_shared/`)
- Application layer (`supabase/functions/_shared/application/`)
- Domain layer (`supabase/functions/_shared/domain/`)
- Infrastructure layer (`supabase/functions/_shared/infrastructure/`)
- Test files (`supabase/functions/*/*.test.ts`)

## Project Overview

This project uses Supabase Edge Functions (Deno runtime) for backend functionality. Edge Functions are serverless functions that run on Deno Deploy, providing authentication, database access, and external API integration.

## Technology Stack

- **Runtime**: Deno (Supabase Edge Functions)
- **Language**: TypeScript (Deno-compatible)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **HTTP Framework**: Native Deno.serve
- **Package Manager**: JSR (JavaScript Registry) for Deno packages

## Project Structure

```
supabase/
├── functions/
│   ├── _shared/                    # Shared code across functions
│   │   ├── cors.ts                 # CORS headers configuration
│   │   ├── application/            # Application layer (use cases)
│   │   ├── domain/                 # Domain layer (business logic, entities)
│   │   └── infrastructure/         # Infrastructure layer (external services)
│   ├── delete-user/
│   │   └── index.ts                # Delete user function handler
│   └── ping/
│       ├── index.ts                # Ping function handler
│       └── ping.test.ts            # Test file
└── config.toml                      # Supabase configuration
```

## Architecture Principles

### Clean Architecture Layers

#### 1. Domain Layer (`_shared/domain/`)
- **Purpose**: Core business logic and entities
- **Rules**:
  - No dependencies on external frameworks
  - Pure TypeScript/JavaScript
  - Business rules and domain models
  - Value objects and entities

```typescript
// ✅ Good: Domain entity
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly createdAt: Date
  ) {}
  
  // Business logic methods
  public isActive(): boolean {
    // Domain logic
  }
}
```

#### 2. Application Layer (`_shared/application/`)
- **Purpose**: Use cases and application services
- **Rules**:
  - Orchestrates domain logic
  - Depends on domain layer
  - Defines use case interfaces
  - Handles application-level concerns

```typescript
// ✅ Good: Use case
export interface DeleteUserUseCase {
  execute(userId: string): Promise<void>;
}

export class DeleteUserService implements DeleteUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService
  ) {}
  
  async execute(userId: string): Promise<void> {
    // Application logic
    await this.userRepository.delete(userId);
    await this.authService.deleteUser(userId);
  }
}
```

#### 3. Infrastructure Layer (`_shared/infrastructure/`)
- **Purpose**: External services and implementations
- **Rules**:
  - Implements interfaces from application/domain layers
  - Handles Supabase client, external APIs
  - Database access, HTTP clients
  - Framework-specific code

```typescript
// ✅ Good: Infrastructure implementation
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { UserRepository } from '../domain/UserRepository';

export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly supabase: SupabaseClient) {}
  
  async delete(userId: string): Promise<void> {
    await this.supabase.auth.admin.deleteUser(userId);
  }
}
```

## TypeScript Standards (Strict)

### Type Definitions

#### Function Handlers
```typescript
// ✅ Good: Explicit handler type
type EdgeFunctionHandler = (req: Request) => Promise<Response>;

export const handler: EdgeFunctionHandler = async (req: Request): Promise<Response> => {
  // Implementation
};
```

#### Request/Response Types
```typescript
// ✅ Good: Typed request body
interface DeleteUserRequest {
  userId: string;
}

interface DeleteUserResponse {
  success: boolean;
  message: string;
}

// ✅ Good: Type guard
function isDeleteUserRequest(body: unknown): body is DeleteUserRequest {
  return (
    typeof body === 'object' &&
    body !== null &&
    'userId' in body &&
    typeof (body as DeleteUserRequest).userId === 'string'
  );
}
```

### Type Safety Rules
- **NEVER use `any`** - Use `unknown` and type guards
- Always validate request bodies with type guards
- Use discriminated unions for response types
- Handle `null` and `undefined` explicitly
- Use proper error types

## Edge Function Patterns

### Function Structure

```typescript
// 1. Imports
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// 2. Type definitions
interface RequestBody {
  // Request body interface
}

interface ResponseBody {
  // Response body interface
}

// 3. Type guards
function isValidRequest(body: unknown): body is RequestBody {
  // Validation logic
}

// 4. Helper functions (if needed)
async function processRequest(data: RequestBody): Promise<ResponseBody> {
  // Business logic
}

// 5. Main handler
export const handler = async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Request validation
    const body = await req.json();
    if (!isValidRequest(body)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Business logic
    const result = await processRequest(body);
    
    // Success response
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Error handling
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

// 6. Default export for Deno.serve
Deno.serve(handler);
export default handler;
```

### CORS Handling

```typescript
// ✅ Good: Consistent CORS headers
import { corsHeaders } from '../_shared/cors.ts';

// Handle preflight
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}

// Include in all responses
return new Response(
  JSON.stringify(data),
  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
);
```

## Authentication Patterns

### Supabase Client Setup

```typescript
// ✅ Good: Proper client initialization
import { createClient } from 'jsr:@supabase/supabase-js@2';

// User-scoped client (for user operations)
const authHeader = req.headers.get('Authorization');
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  { global: { headers: { Authorization: authHeader! } } }
);

// Admin client (for admin operations)
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);
```

### Authentication Validation

```typescript
// ✅ Good: Validate user authentication
const token = authHeader?.replace('Bearer ', '');
const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

if (userError) {
  console.error('Auth error:', userError);
  return new Response(
    JSON.stringify({ error: 'Authentication failed' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

if (!user) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

## Error Handling Patterns

### Error Response Structure

```typescript
// ✅ Good: Consistent error responses
interface ErrorResponse {
  error: string;
  details?: unknown;
}

function createErrorResponse(
  message: string,
  status: number,
  details?: unknown
): Response {
  const response: ErrorResponse = { error: message };
  if (details) {
    response.details = details;
  }
  
  return new Response(
    JSON.stringify(response),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
```

### Error Handling Best Practices

```typescript
// ✅ Good: Comprehensive error handling
try {
  // Operation
  const result = await performOperation();
  return new Response(
    JSON.stringify({ success: true, data: result }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
} catch (error) {
  // Log error for debugging
  console.error('Operation failed:', error);
  
  // Return user-friendly error
  const message = error instanceof Error ? error.message : 'Internal server error';
  return createErrorResponse(message, 500);
}
```

### Error Types

```typescript
// ✅ Good: Custom error types
export class ValidationError extends Error {
  constructor(message: string, public readonly field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}
```

## Request Validation

### Input Validation Pattern

```typescript
// ✅ Good: Type-safe validation
interface CreateUserRequest {
  email: string;
  name: string;
}

function validateCreateUserRequest(body: unknown): body is CreateUserRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  
  const request = body as Record<string, unknown>;
  
  return (
    typeof request.email === 'string' &&
    request.email.includes('@') &&
    typeof request.name === 'string' &&
    request.name.length > 0
  );
}

// Usage
const body = await req.json();
if (!validateCreateUserRequest(body)) {
  return createErrorResponse('Invalid request body', 400);
}
```

## Environment Variables

### Accessing Environment Variables

```typescript
// ✅ Good: Safe environment variable access
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required environment variables');
}
```

### Environment Variable Rules
- Always check for existence before use
- Provide meaningful error messages if missing
- Use `??` operator for defaults when appropriate
- Never hardcode sensitive values

## Testing Patterns

### Test Structure

```typescript
// ✅ Good: Test file structure
import { assertEquals } from 'jsr:@std/assert';
import { handler } from './index.ts';

Deno.test('handler returns pong', async () => {
  // Arrange
  const request = new Request('http://localhost/ping', {
    method: 'GET',
  });
  
  // Act
  const response = await handler(request);
  const text = await response.text();
  
  // Assert
  assertEquals(response.status, 200);
  assertEquals(text, 'pong');
});

Deno.test('handler handles CORS preflight', async () => {
  // Arrange
  const request = new Request('http://localhost/ping', {
    method: 'OPTIONS',
  });
  
  // Act
  const response = await handler(request);
  
  // Assert
  assertEquals(response.status, 200);
  assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
});
```

### Testing Rules
- Test happy paths
- Test error cases
- Test edge cases
- Test authentication/authorization
- Test input validation
- Use descriptive test names

## Code Organization

### Shared Code Organization

#### CORS Configuration (`_shared/cors.ts`)
```typescript
// ✅ Good: Centralized CORS configuration
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

#### Domain Models (`_shared/domain/`)
- Business entities
- Value objects
- Domain interfaces
- Business rules

#### Application Services (`_shared/application/`)
- Use case implementations
- Application-level interfaces
- Orchestration logic

#### Infrastructure (`_shared/infrastructure/`)
- Supabase client wrappers
- External API clients
- Repository implementations
- Framework-specific code

### Import Organization

```typescript
// 1. Deno standard library
import { assertEquals } from 'jsr:@std/assert';

// 2. JSR packages
import { createClient } from 'jsr:@supabase/supabase-js@2';

// 3. Shared code (relative imports)
import { corsHeaders } from '../_shared/cors.ts';
import { UserRepository } from '../_shared/domain/UserRepository.ts';
import { SupabaseUserRepository } from '../_shared/infrastructure/SupabaseUserRepository.ts';

// 4. Local imports (same directory)
import { validateRequest } from './validation.ts';
```

## Response Patterns

### Success Response

```typescript
// ✅ Good: Consistent success response
interface SuccessResponse<T> {
  success: true;
  data: T;
}

function createSuccessResponse<T>(data: T, status: number = 200): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
```

### Error Response

```typescript
// ✅ Good: Consistent error response
interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

function createErrorResponse(
  error: string,
  status: number = 400,
  details?: unknown
): Response {
  const response: ErrorResponse = { success: false, error };
  if (details) {
    response.details = details;
  }
  
  return new Response(
    JSON.stringify(response),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
```

## Security Best Practices

### Input Sanitization
- Always validate and sanitize user input
- Use type guards for request validation
- Never trust client-side validation
- Sanitize before database operations

### Authentication & Authorization
- Always verify user authentication
- Check user permissions before operations
- Use admin client only when necessary
- Never expose service role key

### Error Information
- Don't expose internal error details to clients
- Log detailed errors server-side
- Return generic error messages to clients
- Use proper HTTP status codes

## Refactoring Guidelines

### When Refactoring Backend Code
1. **Extract business logic** to domain layer
2. **Move use cases** to application layer
3. **Extract infrastructure** code to infrastructure layer
4. **Create shared utilities** in `_shared/`
5. **Improve type safety** - remove any, add proper types
6. **Extract validation** to separate functions
7. **Create reusable services** for common operations
8. **Improve error handling** - use custom error types

### File Movement Rules
- Move domain logic to `_shared/domain/`
- Move use cases to `_shared/application/`
- Move external service code to `_shared/infrastructure/`
- Extract common patterns to `_shared/`
- Group related functionality together

## Common Patterns

### Function Template

```typescript
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    // Validate user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Business logic here
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

Deno.serve(handler);
export default handler;
```

## Avoid

- ❌ Don't use `any` types
- ❌ Don't skip input validation
- ❌ Don't expose internal error details
- ❌ Don't hardcode environment variables
- ❌ Don't skip authentication checks
- ❌ Don't use admin client unnecessarily
- ❌ Don't ignore TypeScript errors
- ❌ Don't forget CORS headers
- ❌ Don't swallow errors silently
- ❌ Don't mix concerns (keep layers separate)

## Code Quality Checklist

Before submitting backend code:
- [ ] Follows Clean Architecture principles
- [ ] TypeScript types are strict (no `any`)
- [ ] Input validation implemented
- [ ] Authentication/authorization checked
- [ ] Error handling comprehensive
- [ ] CORS headers included
- [ ] Environment variables validated
- [ ] No code duplication
- [ ] Meaningful names used
- [ ] Functions are small and focused
- [ ] Proper layer separation
- [ ] Tests included for new functions
