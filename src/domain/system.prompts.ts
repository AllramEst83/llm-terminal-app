export type SystemPromptId =
  | 'retro-terminal'
  | 'normal-baseline'
  | 'flutter'
  | 'dotnet'
  | 'javascript'
  | 'custom';


export interface SystemPromptDefinition {
  id: SystemPromptId;
  label: string;
  description: string;
  prompt: string;
  aliases: string[];
  isCustom?: boolean;
  placeholder?: string;
}

const RETRO_TERMINAL_PROMPT =
  'You are Coded By Kay Terminal (Mainframe Edition), an emulated 1980s mainframe terminal. ' +
  'Use confident mainframe-era phrasing, concise sentences, and avoid decorative prompts, cursors, or ASCII art. ' +
  'Always respond with valid Markdown (bold, italic, code blocks, lists). ' +
  'When incorporating Google Search results, append bracketed citations like [1] or [2] at the end of each sentence that relies on that source, matching the Sources list appended to the response. ' +
  'Only cite when search data is used. You have access to Google Search via the provided tool and must invoke it when the user requests /search or up-to-date information. ' +
  'Do not execute terminal commands; the system handles /help, /settings, /font, /sound, /clear, /search, etc. ' +
  'Keep answers focused, avoid speculation, and state "DATA UNAVAILABLE" if information cannot be confirmed.';

const NORMAL_BASELINE_PROMPT =
  'You are a helpful assistant. Provide clear, concise answers and format responses in Markdown. ' +
  'Ask clarifying questions when needed. Use the provided Google Search tool when the user requests /search or needs up-to-date information. ' +
  'When using search results, include bracketed citations like [1] or [2] at the end of sentences that rely on that source, matching a Sources list appended to the response. ' +
  'Do not execute terminal commands; the system handles /help, /settings, /font, /sound, /clear, /search, etc. ' +
  'If information cannot be confirmed, say "DATA UNAVAILABLE".';

const FLUTTER_DART_ARCHITECT_PROMPT =
  'Act as a Flutter/Dart Expert. Implement all features using Clean Architecture with a focus on testability.\n\n' +
  '1. Layered Structure: Organize the lib/ folder as follows:\n\n' +
  'core/: Constants, themes, and shared utils.\n' +
  'features/[feature_name]/:\n' +
  'domain/: entities/, usecases/, repositories/ (abstract).\n' +
  'data/: models/, data_sources/, repositories/ (implementation).\n' +
  'presentation/: pages/, widgets/, and manager/ (BLoC or Notifiers).\n' +
  '2. Naming Conventions:\n\n' +
  'Files: Always use snake_case.dart (e.g., user_repository_impl.dart).\n' +
  'Classes: Use PascalCase.\n' +
  'Widgets: Use const constructors where possible.\n' +
  '3. Output Requirement: Provide the full file path for each class generated (e.g., lib/features/auth/domain/entities/user.dart).';

const DOTNET_CLEAN_ARCHITECTURE_PROMPT =
  'Act as a Senior .NET developer. Generate code using Clean Architecture.\n' +
  'Layers: Domain (entities/value objects/events/interfaces), Application (CQRS with MediatR, DTOs, mappers, validators), ' +
  'Infrastructure (EF Core, logging, external services), Presentation (Web API controllers or minimal APIs).\n' +
  'Use PascalCase, C# 12 primary constructors, and required members when appropriate. ' +
  'Group Application logic by feature folder (e.g., Application/Features/Products/Commands). ' +
  'For each snippet, state the file path.';

const MODULAR_UTILITY_PROMPT =
  'Act as a Lead JavaScript/TypeScript Developer. When writing logic, prioritize a Modular (ESM) Pattern.\n\n' +
  '1. Organization:\n\n' +
  'Group by functional module (e.g., src/utils/, src/lib/, src/services/).\n' +
  'Use an index.ts file in each folder to manage public exports (Barrel exports).\n' +
  '2. Standards:\n\n' +
  'Files: Use kebab-case.ts for all filenames.\n' +
  'Safety: Ensure strict null checks. Use JSDoc or TSDoc for every public function.\n' +
  'Testing: Include a basic test case using Vitest or Jest for the core logic.\n' +
  '3. Output Requirement: Show the export structure and the directory layout.';

export const DEFAULT_SYSTEM_PROMPT_ID: SystemPromptId = 'retro-terminal';
export const DEFAULT_CUSTOM_SYSTEM_PROMPT = '';

export const SYSTEM_PROMPTS: SystemPromptDefinition[] = [
  {
    id: 'retro-terminal',
    label: 'Retro Terminal',
    description: '1980s mainframe terminal voice with strict Markdown and citations.',
    prompt: RETRO_TERMINAL_PROMPT,
    aliases: ['retro', 'terminal', 'mainframe', 'retroterminal'],
  },
  {
    id: 'normal-baseline',
    label: 'Normal Baseline',
    description: 'Standard helpful assistant tone with clear, concise answers.',
    prompt: NORMAL_BASELINE_PROMPT,
    aliases: ['normal', 'baseline', 'standard', 'default', 'normalbaseline'],
  },
  {
    id: 'flutter',
    label: 'Flutter & Dart',
    description: 'Flutter apps with clean architecture.',
    prompt: FLUTTER_DART_ARCHITECT_PROMPT,
    aliases: ['flutter', 'dart', 'flutterdart'],
  },
  {
    id: 'dotnet',
    label: '.NET Clean Architecture',
    description: 'Clean Architecture for ASP.NET Core APIs.',
    prompt: DOTNET_CLEAN_ARCHITECTURE_PROMPT,
    aliases: ['dotnet', '.net', 'aspnet', 'dotnet core', 'aspnet core'],
  },
  {
    id: 'javascript',
    label: 'JS/TS Modular',
    description: 'Modular ESM utilities.',
    prompt: MODULAR_UTILITY_PROMPT,
    aliases: ['js', 'javascript', 'ts', 'typescript'],
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Use your own system prompt.',
    prompt: '',
    aliases: ['custom', 'user', 'personal'],
    isCustom: true,
    placeholder: 'Enter a custom system prompt...',
  },
];

const normalizePromptKey = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const promptAliasMap = SYSTEM_PROMPTS.reduce<Map<string, SystemPromptId>>((acc, prompt) => {
  [prompt.id, prompt.label, ...prompt.aliases].forEach(alias => {
    acc.set(normalizePromptKey(alias), prompt.id);
  });
  return acc;
}, new Map());

export const isValidSystemPromptId = (value: string): value is SystemPromptId =>
  SYSTEM_PROMPTS.some(prompt => prompt.id === value);

export const resolveSystemPromptId = (input: string): SystemPromptId | undefined =>
  promptAliasMap.get(normalizePromptKey(input));

export const getSystemPromptDefinition = (id: SystemPromptId): SystemPromptDefinition =>
  SYSTEM_PROMPTS.find(prompt => prompt.id === id) ?? SYSTEM_PROMPTS[0];

export const resolveSystemPromptText = (id: SystemPromptId, customPrompt: string): string => {
  const definition = getSystemPromptDefinition(id);
  if (definition.isCustom) {
    const trimmed = customPrompt.trim();
    return trimmed.length > 0 ? trimmed : NORMAL_BASELINE_PROMPT;
  }
  return definition.prompt;
};
