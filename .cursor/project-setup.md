# Project Setup & Code Conventions

## Project Overview

This is an 80s-style terminal chatbot application built with React and TypeScript, integrated with Google Gemini AI. The project follows Clean Architecture principles with clear separation of concerns.

## Technology Stack

- **Framework**: React 19.2.0 with TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **Styling**: Tailwind CSS 4.1.17
- **AI Integration**: Google Gemini AI (@google/genai 1.29.1)
- **Language**: TypeScript with ES2022 target

## Project Structure

The project follows a Clean Architecture pattern with the following directory structure:

```
├── components/          # React UI components
├── domain/             # Domain models and business entities
├── services/           # Service layer (API, storage, utilities)
├── useCases/           # Business logic use cases
├── repositories/       # Data access layer
├── utils/              # Utility functions
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
└── vite.config.ts      # Vite configuration
```

### Directory Responsibilities

- **`components/`**: React functional components for UI rendering
- **`domain/`**: Core business entities (Message, Settings, Theme, Command) - immutable classes
- **`services/`**: Static service classes for cross-cutting concerns (API, storage, theming)
- **`useCases/`**: Business logic orchestration (SendMessage, HandleCommand, ManageSettings)
- **`repositories/`**: Data persistence layer
- **`utils/`**: Pure utility functions (date formatting, message helpers, theme utilities)

## Code Conventions

### TypeScript

- **Target**: ES2022
- **Module System**: ESNext with bundler resolution
- **JSX**: React JSX transform (`react-jsx`)
- **Type Checking**: Strict mode enabled
- **Path Aliases**: Use `@/` prefix for root-relative imports (e.g., `@/domain/Message`)

### Naming Conventions

- **Components**: PascalCase (e.g., `TerminalInput`, `MessageList`)
- **Classes**: PascalCase (e.g., `Message`, `MessageService`, `SendMessageUseCase`)
- **Functions/Methods**: camelCase (e.g., `handleSendMessage`, `createUserMessage`)
- **Variables**: camelCase (e.g., `isLoading`, `commandHistory`)
- **Constants**: camelCase or UPPER_SNAKE_CASE for true constants
- **Files**: PascalCase for components/classes, camelCase for utilities/services

### React Patterns

- **Component Style**: Functional components with hooks
- **State Management**: React `useState` and `useEffect` hooks
- **Props**: Explicit TypeScript interfaces for component props
- **Callbacks**: Use `useCallback` for event handlers passed to children
- **Refs**: Use `useRef` for DOM references and non-reactive values

Example component structure:

```typescript
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

export const Component: React.FC<ComponentProps> = ({ prop1, prop2 = 0 }) => {
  const [state, setState] = useState<string>("");
  const ref = useRef<HTMLDivElement>(null);

  const handleAction = useCallback(() => {
    // handler logic
  }, [dependencies]);

  return <div>...</div>;
};
```

### Domain Models

- **Immutable Classes**: Domain models are immutable classes with readonly properties
- **Factory Methods**: Use static factory methods (e.g., `Message.create()`, `Message.createUser()`)
- **Builder Pattern**: Use `with*` methods for creating modified copies (e.g., `message.withUpdatedText()`)
- **No Mutations**: Never mutate domain objects directly; always return new instances

Example domain model:

```typescript
export class Message {
  constructor(
    public readonly id: string,
    public readonly role: "user" | "model" | "system",
    public readonly text: string,
    public readonly timestamp?: string
  ) {}

  static create(role: string, text: string, timestamp?: string): Message {
    return new Message(Date.now().toString(), role, text, timestamp);
  }

  withUpdatedText(newText: string): Message {
    return new Message(this.id, this.role, newText, this.timestamp);
  }
}
```

### Services

- **Static Classes**: Services are static classes with static methods
- **Single Responsibility**: Each service handles one concern (e.g., `MessageService`, `ThemeService`)
- **Pure Functions**: Service methods should be pure when possible

Example service:

```typescript
export class MessageService {
  static createUserMessage(text: string): Message {
    return Message.createUser(text, getCurrentTimestamp());
  }

  static updateLastMessage(
    messages: Message[],
    updater: (message: Message) => Message
  ): Message[] {
    // immutable update logic
  }
}
```

### Use Cases

- **Class-Based**: Use cases are classes with instance methods
- **Dependency Injection**: Dependencies passed via constructor
- **Single Method**: Each use case has an `execute()` method
- **Async Operations**: Use cases handle async operations and callbacks

Example use case:

```typescript
export class SendMessageUseCase {
  constructor(private currentMessages: Message[], private apiKey: string) {}

  async execute(
    inputText: string,
    onStreamCallback: (chunk: string, isFirst: boolean) => void,
    onCompleteCallback: (sources?: Source[]) => void
  ): Promise<Message> {
    // business logic
  }
}
```

### Styling

- **Tailwind CSS**: Use Tailwind utility classes for styling
- **Theme System**: Dynamic theming via `ThemeService` with theme objects
- **Inline Styles**: Use inline styles for dynamic theme colors (e.g., `style={{ color: theme.text }}`)
- **CSS Classes**: Use Tailwind classes for layout, spacing, and static styles

### File Organization

- **One Component Per File**: Each component in its own file
- **Co-location**: Related types/interfaces in the same file as their usage
- **Barrel Exports**: Avoid barrel exports; use direct imports
- **Index Files**: Only use index files when necessary for complex module structures

### Import Organization

1. React imports
2. Third-party library imports
3. Domain imports
4. Service imports
5. Component imports
6. Utility imports
7. Type imports (use `import type` when importing only types)

Example:

```typescript
import React, { useState, useCallback } from "react";
import { Message } from "./domain/Message";
import { MessageService } from "./services/MessageService";
import { TerminalInput } from "./components/TerminalInput";
import { getCurrentTimestamp } from "./utils/dateUtils";
import type { ThemeColors } from "./domain/Theme";
```

### Error Handling

- **Error Messages**: Use descriptive error messages prefixed with "SYSTEM ERROR:" for system errors
- **User Feedback**: Display errors as system messages in the UI
- **Graceful Degradation**: Handle missing API keys and other failures gracefully

### Environment Variables

- **API Key**: Stored in `.env.local` as `GEMINI_API_KEY`
- **Vite Config**: Environment variables are injected via `vite.config.ts`
- **Studio Environment**: Detected via `ApiKeyService.isStudioEnvironment()`

## Development Workflow

### Running the Application

1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY` in `.env.local`
3. Run dev server: `npm run dev` (runs on port 3000)
4. Build for production: `npm run build`
5. Preview production build: `npm run preview`

### Key Features

- **Boot Sequence**: Animated terminal boot sequence on startup
- **Command System**: Slash commands (e.g., `/clear`, `/theme`, `/help`)
- **Message Streaming**: Real-time streaming of AI responses
- **Theme System**: Multiple 80s-style terminal themes
- **Command History**: Arrow key navigation through command history
- **Command Suggestions**: Autocomplete for slash commands

## Best Practices

1. **Immutability**: Always create new objects instead of mutating existing ones
2. **Type Safety**: Use explicit types; avoid `any` unless absolutely necessary
3. **Separation of Concerns**: Keep UI, business logic, and data access separate
4. **Single Responsibility**: Each class/function should have one clear purpose
5. **Composition**: Prefer composition over inheritance
6. **Error Handling**: Always handle errors gracefully with user-friendly messages
7. **Performance**: Use `useCallback` and `useMemo` appropriately to prevent unnecessary re-renders
8. **Accessibility**: Consider keyboard navigation and screen readers

## Common Patterns

### Creating Messages

```typescript
const userMessage = MessageService.createUserMessage(text);
const modelMessage = MessageService.createModelMessage(text);
const errorMessage = MessageService.createErrorMessage("Error text");
```

### Updating Messages Immutably

```typescript
const updatedMessages = MessageService.updateLastMessage(messages, (msg) =>
  msg.withUpdatedText(newText)
);
```

### Using Use Cases

```typescript
const useCase = new SendMessageUseCase(messages, apiKey);
await useCase.execute(input, onStream, onComplete);
```

### Theme Application

```typescript
const theme = ThemeService.getTheme(settings.themeName);
ThemeService.applyTheme(theme);
```
