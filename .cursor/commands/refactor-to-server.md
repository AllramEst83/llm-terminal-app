---
description: Command to refactor client-side code to Supabase Edge Functions while maintaining seamless user experience
---

# Refactor Code to Server (Supabase Edge Functions)

## Purpose

This command guides the AI agent to refactor specific code from the client (`src/`) to Supabase Edge Functions (`supabase/functions/`) while ensuring:

- **Zero disruption** to the user experience
- **Seamless migration** - client code is replaced with function calls
- **Best practices** for both client and server code are followed
- **Type safety** is maintained throughout
- **Error handling** is comprehensive on both sides

## When to Use

Use this command when you want to:

- Move sensitive operations (API keys, admin operations) to the server
- Reduce client bundle size by moving heavy logic server-side
- Improve security by hiding implementation details
- Centralize business logic in the backend
- Move operations that require service role keys or admin privileges

## Command Format

```
Refactor the following code to a Supabase Edge Function:
[File path or code selection]
[Optional: Specific lines or function names]
```

## Refactoring Process

### Step 1: Analyze the Code

1. **Identify the code to move**:

   - Read the specified file or code lines
   - Understand dependencies (imports, context, state)
   - Identify what data flows in and out
   - Note any side effects or external API calls

2. **Determine function requirements**:
   - What inputs does it need? (request body, query params)
   - What outputs does it produce? (response data, errors)
   - Does it need authentication? (most functions should)
   - Does it need admin privileges? (use service role key)
   - What external services does it call? (GitHub API, etc.)

### Step 2: Create the Edge Function

1. **Create function directory**:

   - Create `supabase/functions/[function-name]/index.ts`
   - Use kebab-case for function names (e.g., `delete-repo`, `fetch-branches`)

2. **Create types and interfaces in Clean Architecture layers**:

   **IMPORTANT**: Types and interfaces should NEVER be defined in the function handler. They must be placed in the appropriate Clean Architecture layer:

   - **Domain types** (entities, value objects, domain models) → `_shared/domain/[entity-name].ts`
   - **Application types** (request/response DTOs, use case interfaces) → `_shared/application/[use-case-name].ts`
   - **Infrastructure types** (external service types, repository interfaces) → `_shared/infrastructure/[service-name].ts`

   Example structure:

   ```typescript
   // _shared/application/delete-repo.ts
   export interface DeleteRepoRequest {
     owner: string;
     repo: string;
   }

   export interface DeleteRepoResponse {
     success: boolean;
     message: string;
   }

   // Type guard for validation
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
   ```

3. **Implement function handler** following the standard pattern:

```typescript
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// Import types from appropriate layer
import {
  DeleteRepoRequest,
  DeleteRepoResponse,
  isValidDeleteRepoRequest,
} from "../_shared/application/delete-repo.ts";

// Main handler - NO type definitions here!
export const handler = async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate user
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Request validation (using imported type guard)
    const body = await req.json();
    if (!isValidDeleteRepoRequest(body)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Business logic (moved from client)
    // ... implementation here ...

    // Success response
    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

Deno.serve(handler);
export default handler;
```

4. **Follow Clean Architecture** (MANDATORY):

   - **Domain layer** (`_shared/domain/`):

     - Domain entities and value objects
     - Business rules and domain models
     - Domain interfaces (repositories, services)
     - NO dependencies on external frameworks

   - **Application layer** (`_shared/application/`):

     - Request/Response DTOs (Data Transfer Objects)
     - Use case interfaces
     - Use case implementations (services)
     - Type guards for request validation
     - Depends only on domain layer

   - **Infrastructure layer** (`_shared/infrastructure/`):
     - External service implementations (Supabase, GitHub API, etc.)
     - Repository implementations
     - Framework-specific code
     - Implements interfaces from domain/application layers

   **Type Placement Rules**:

   - Request/Response types → Application layer
   - Domain entities → Domain layer
   - External API types → Infrastructure layer
   - NEVER define types in function handlers

5. **Handle external dependencies**:
   - If using GitHub API, you may need to pass the GitHub token from client
   - Or store it securely server-side if available
   - Use environment variables for secrets

### Step 3: Update Client Code

1. **Replace the original code** with a function call:

```typescript
// Before: Direct implementation
const handleOperation = async () => {
  try {
    // Complex logic here
    const result = await someComplexOperation();
    setData(result);
  } catch (error) {
    // Error handling
  }
};

// After: Call to Edge Function
const handleOperation = async () => {
  try {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("function-name", {
      body: {
        // Request parameters
      },
    });

    if (error) throw error;

    setData(data);
    toast.success("Operation completed successfully");
  } catch (error) {
    console.error("Operation failed:", error);
    toast.error("Operation failed. Please try again.");
  } finally {
    setLoading(false);
  }
};
```

2. **Maintain the same interface**:

   - Keep function names the same if possible
   - Keep the same parameters (now passed in request body)
   - Keep the same return shape (now in response data)
   - Maintain loading/error states

3. **Update imports**:

   - Remove unused imports from client code
   - Add `supabase` import if not already present: `import { supabase } from '../lib/supabase';`

4. **Preserve user experience**:
   - Keep the same loading indicators
   - Keep the same error messages (map server errors to user-friendly messages)
   - Keep the same success feedback
   - Maintain the same component state management

### Step 4: Handle Authentication

1. **Client-side**: The Supabase client automatically includes auth headers when calling functions
2. **Server-side**: Always validate authentication in the function handler
3. **GitHub tokens**: If the operation requires GitHub API:
   - Option A: Pass token from client (if stored client-side)
   - Option B: Retrieve from server-side storage (more secure)

### Step 5: Error Handling

1. **Server-side**:

   - Validate all inputs with type guards
   - Return appropriate HTTP status codes
   - Log detailed errors server-side
   - Return user-friendly error messages

2. **Client-side**:
   - Handle network errors
   - Handle function errors
   - Map server errors to user-friendly messages
   - Show appropriate UI feedback (toast, error state)

### Step 6: Type Safety

1. **Place types in Clean Architecture layers**:

   - **Request/Response DTOs** → `_shared/application/[use-case-name].ts`
   - **Domain entities** → `_shared/domain/[entity-name].ts`
   - **Infrastructure types** → `_shared/infrastructure/[service-name].ts`
   - **NEVER** define types in function handlers

2. **Type the function call** (client-side):

```typescript
// Import types from application layer (or duplicate for client if needed)
import type { DeleteRepoRequest, DeleteRepoResponse } from "../types/api"; // Client-side types

const { data, error } = await supabase.functions.invoke<DeleteRepoResponse>(
  "delete-repo",
  {
    body: {
      owner: "username",
      repo: "repo-name",
    } as DeleteRepoRequest,
  }
);
```

3. **Type guards in application layer**:
   - Type guards should be exported from the application layer
   - Function handlers import and use these type guards
   - Never define type guards in function handlers

## Best Practices Checklist

### Server-Side (Edge Function)

- [ ] Follows Clean Architecture principles (MANDATORY)
- [ ] Types/interfaces placed in appropriate layers (NOT in function handler)
- [ ] TypeScript types are strict (no `any`)
- [ ] Input validation with type guards (from application layer)
- [ ] Authentication/authorization checked
- [ ] CORS headers included
- [ ] Error handling comprehensive
- [ ] Environment variables validated
- [ ] Proper HTTP status codes
- [ ] No sensitive data in error messages
- [ ] Logs errors for debugging

### Client-Side

- [ ] Maintains same user experience
- [ ] Loading states preserved
- [ ] Error handling with user-friendly messages
- [ ] TypeScript types maintained
- [ ] No unused imports
- [ ] Proper error feedback (toast, UI)
- [ ] Handles network errors
- [ ] Handles function errors

## Example Refactoring

### Before (Client-Side)

```typescript
// src/components/SomeComponent.tsx
const handleDeleteRepo = async (repoName: string, owner: string) => {
  try {
    setDeleting(true);
    if (!octokit) throw new Error("GitHub client not initialized");

    await octokit.rest.repos.delete({
      owner,
      repo: repoName,
    });

    toast.success("Repository deleted successfully");
    onDeleteSuccess();
  } catch (error) {
    console.error("Failed to delete repository:", error);
    toast.error("Failed to delete repository");
  } finally {
    setDeleting(false);
  }
};
```

### After (Server-Side Function)

**Step 1: Create types in Application Layer**

```typescript
// supabase/functions/_shared/application/delete-repo.ts
export interface DeleteRepoRequest {
  owner: string;
  repo: string;
}

export interface DeleteRepoResponse {
  success: boolean;
  message: string;
}

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
```

**Step 2: Create Function Handler (NO types here!)**

```typescript
// supabase/functions/delete-repo/index.ts
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// Import types from application layer
import {
  DeleteRepoRequest,
  DeleteRepoResponse,
  isValidDeleteRepoRequest,
} from "../_shared/application/delete-repo.ts";

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    if (!isValidDeleteRepoRequest(body)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get GitHub token from user metadata or pass from client
    const githubToken = user.user_metadata?.provider_token;
    if (!githubToken) {
      return new Response(JSON.stringify({ error: "GitHub token not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Octokit or fetch to call GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${body.owner}/${body.repo}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete repository");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Repository deleted successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

Deno.serve(handler);
export default handler;
```

### After (Client-Side)

```typescript
// src/components/SomeComponent.tsx
import { supabase } from "../lib/supabase";

const handleDeleteRepo = async (repoName: string, owner: string) => {
  try {
    setDeleting(true);

    const { data, error } = await supabase.functions.invoke("delete-repo", {
      body: {
        owner,
        repo: repoName,
      },
    });

    if (error) throw error;

    toast.success("Repository deleted successfully");
    onDeleteSuccess();
  } catch (error) {
    console.error("Failed to delete repository:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete repository";
    toast.error(errorMessage);
  } finally {
    setDeleting(false);
  }
};
```

## Important Notes

1. **Type Placement (CRITICAL)**:

   - **NEVER** define types or interfaces in function handlers
   - **ALWAYS** place types in Clean Architecture layers:
     - Request/Response DTOs → `_shared/application/`
     - Domain entities → `_shared/domain/`
     - Infrastructure types → `_shared/infrastructure/`
   - Function handlers should only import and use types, never define them

2. **Seamless Migration**: The user should not notice any difference in functionality
3. **Error Messages**: Map server errors to the same user-friendly messages
4. **Loading States**: Maintain the same loading indicators
5. **State Management**: Keep the same component state structure
6. **Testing**: Test both client and server code after refactoring
7. **Environment Variables**: Ensure all required env vars are set for the function
8. **GitHub Tokens**: Handle GitHub OAuth tokens appropriately (store securely or pass securely)

## Common Patterns

### Passing GitHub Token

If the function needs GitHub API access:

- Option 1: Pass from client (if token is available client-side)
- Option 2: Store in user metadata and retrieve server-side
- Option 3: Use Supabase to store and retrieve securely

### Handling File Operations

If moving file read/write operations:

- Pass file paths and content in request body
- Handle base64 encoding/decoding if needed
- Consider file size limits for request bodies

### Database Operations

If moving database operations:

- Use Supabase client in the function
- Use admin client only when necessary
- Validate permissions server-side

## Verification Steps

After refactoring, verify:

1. [ ] **Types/interfaces are in Clean Architecture layers** (NOT in function handler)
2. [ ] Function handler only imports types, never defines them
3. [ ] Function can be invoked successfully
4. [ ] Authentication works correctly
5. [ ] Request validation works (using type guards from application layer)
6. [ ] Error handling works (test error cases)
7. [ ] Client code maintains same UX
8. [ ] Loading states work correctly
9. [ ] Error messages are user-friendly
10. [ ] No console errors in browser
11. [ ] No TypeScript errors
12. [ ] Function logs are appropriate

## Troubleshooting

- **CORS errors**: Ensure CORS headers are included in all responses
- **Authentication errors**: Verify auth header is passed correctly
- **Type errors**: Ensure request/response types match
- **Network errors**: Check function is deployed/running
- **Missing data**: Verify request body structure matches function expectations
