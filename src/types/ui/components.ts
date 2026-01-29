/**
 * UI-specific types for React components
 */

import type { CommandDefinition } from '../../domain/entities/command';
import type { Message } from '../../domain/entities/message';
import type { QueueItem } from '../../domain/entities/queue-item';
import type { ThemeColors } from '../../domain/entities/theme';
import type { SystemPromptDefinition, SystemPromptId } from '../../domain/system.prompts';

/**
 * Represents an image attached to a message or queue item in the UI.
 * This type includes UI-specific fields like dataUrl for thumbnail display.
 */
export interface AttachedImage {
  base64Data: string;
  mimeType: string;
  fileName: string;
  dataUrl: string;
}

/**
 * Props for TerminalInput component
 */
export interface TerminalInputProps {
  input: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  suggestions: CommandDefinition[];
  showSuggestions: boolean;
  activeSuggestionIndex: number;
  onSuggestionSelect: (command: string) => void;
  onSuggestionIndexChange: (index: number) => void;
  onSuggestionsClose: () => void;
  commandShortcuts?: CommandDefinition[];
  showCommandToolbar?: boolean;
  theme: ThemeColors;
  disabled?: boolean;
  autoFocus?: boolean;
  attachedImages?: AttachedImage[];
  onImageAttach?: (image: AttachedImage) => void;
  onImageRemove?: (index: number) => void;
  maxImages?: number;
  onError?: (message: string) => void;
}

/**
 * Props for QueueDisplay component
 */
export interface QueueDisplayProps {
  queue: QueueItem[];
  onRemove: (itemId: string) => void;
  onClear: () => void;
  theme: ThemeColors;
}

/**
 * Props for TerminalHeader component
 */
export interface TerminalHeaderProps {
  theme: ThemeColors;
  modelName: string;
  thinkingEnabled: boolean;
  inputTokenCount: number;
  systemInfoVisible: boolean;
  systemPromptId: SystemPromptId;
  systemPromptOptions: SystemPromptDefinition[];
}

/**
 * Props for MessageList component
 */
export interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  theme: ThemeColors;
  endOfMessagesRef?: React.RefObject<HTMLDivElement>;
  fontSize: number;
  onImageLoad?: () => void;
}

/**
 * Props for MessageContent component
 */
export interface MessageContentProps {
  text: string;
  theme?: ThemeColors;
}

/**
 * Props for CodeBlock component
 */
export interface CodeBlockProps {
  code: string;
  language: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

/**
 * Props for ImageDisplay component
 */
export interface ImageDisplayProps {
  base64Image: string;
  prompt: string;
  theme?: ThemeColors;
  onImageLoad?: () => void;
  allImages?: Array<{ src: string; alt: string }>;
  currentImageIndex?: number;
}

/**
 * Props for TokenCounter component
 */
export interface TokenCounterProps {
  inputTokens: number;
  maxTokens: number;
  theme: ThemeColors;
}

/**
 * Props for PressToBoot component
 */
export interface PressToBootProps {
  theme: ThemeColors;
}

/**
 * Props for CommandSuggestions component
 */
export interface CommandSuggestionsProps {
  suggestions: CommandDefinition[];
  activeIndex: number;
  onSelect: (command: string) => void;
  theme: ThemeColors;
}

/**
 * Props for BootScreen component
 */
export interface BootScreenProps {
  sequence: string[];
  theme: ThemeColors;
}

/**
 * Props for ApiKeyInput component
 */
export interface ApiKeyInputProps {
  theme: ThemeColors;
  onApiKeySubmit: (key: string) => void;
}

/**
 * Props for ApiKeySelection component
 */
export interface ApiKeySelectionProps {
  theme: ThemeColors;
  onSelectKey: () => void;
}

/**
 * Props for Lightbox component
 */
export interface LightboxProps {
  slides: Array<{ src: string; alt: string }>;
  initialIndex?: number;
  onClose: () => void;
  theme?: ThemeColors;
}

/**
 * Represents a terminal tab in the UI.
 */
export interface TerminalTabItem {
  id: string;
  label: string;
}

/**
 * Props for TerminalTabs component
 */
export interface TerminalTabsProps {
  tabs: TerminalTabItem[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
  theme: ThemeColors;
}

/**
 * Props for TerminalSession component
 */
export interface TerminalSessionProps {
  sessionId: string;
  isActive: boolean;
  isStudioEnv: boolean;
  isKeyReady: boolean;
  apiKey: string;
  onApiKeySubmit: (key: string) => void;
  onSelectKey: () => Promise<void>;
  tabs: TerminalTabItem[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
}

