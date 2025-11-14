import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from './domain/Message';
import { Settings } from './domain/Settings';
import { ApiKeyService } from './services/ApiKeyService';
import { ThemeService } from './services/ThemeService';
import { CommandService } from './services/CommandService';
import { BootSequenceService } from './services/BootSequenceService';
import { MessageService } from './services/MessageService';
import { HandleCommandUseCase } from './useCases/HandleCommandUseCase';
import { SendMessageUseCase } from './useCases/SendMessageUseCase';
import { ManageBootSequenceUseCase } from './useCases/ManageBootSequenceUseCase';
import { ManageSettingsUseCase } from './useCases/ManageSettingsUseCase';
import { TerminalHeader } from './components/TerminalHeader';
import { MessageList } from './components/MessageList';
import { TerminalInput } from './components/TerminalInput';
import { BootScreen } from './components/BootScreen';
import { PressToBootUI } from './components/PressToBootUI';
import { ApiKeySelectionUI } from './components/ApiKeySelectionUI';
import { ApiKeyInputUI } from './components/ApiKeyInputUI';
import { getCurrentTimestamp } from './utils/dateUtils';

// Tell TypeScript that hljs is available globally.
declare const hljs: any;

export const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  
  const [isStudioEnv, setIsStudioEnv] = useState(false);
  const [isKeyReady, setIsKeyReady] = useState(false);
  
  const [booting, setBooting] = useState<boolean>(false);
  const [booted, setBooted] = useState<boolean>(false);
  const [bootSequence, setBootSequence] = useState<string[]>([]);
  
  const [settings, setSettings] = useState<Settings>(Settings.createDefault());
  const [theme, setTheme] = useState(ThemeService.getDefaultTheme());
  
  const [suggestions, setSuggestions] = useState<typeof CommandService.getAllCommands extends () => infer R ? R : never>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(0);
  
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const scrollRef = useRef<HTMLDivElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Initialize app
  useEffect(() => {
    const initApp = async () => {
      const isStudio = ApiKeyService.isStudioEnvironment();
      setIsStudioEnv(isStudio);

      const hasKey = await ApiKeyService.hasApiKey();
      setIsKeyReady(hasKey);

      const loadedSettings = await new ManageSettingsUseCase().loadSettings();
      setSettings(loadedSettings);
      const loadedTheme = ThemeService.getTheme(loadedSettings.themeName);
      setTheme(loadedTheme);
      ThemeService.applyTheme(loadedTheme);
      
      // Mark as initialized after loading settings
      isInitializedRef.current = true;
    };
    initApp();
  }, []);

  // Save settings when they change (but only after initialization)
  useEffect(() => {
    if (!isInitializedRef.current) {
      return; // Don't save during initial load
    }
    
    const saveSettings = async () => {
      const settingsUseCase = new ManageSettingsUseCase();
      await settingsUseCase.saveSettings(settings);
      const updatedTheme = ThemeService.getTheme(settings.themeName);
      setTheme(updatedTheme);
      ThemeService.applyTheme(updatedTheme);
    };
    saveSettings();
  }, [settings]);

  // Boot sequence trigger
  useEffect(() => {
    if (!isKeyReady || booting || booted) return;

    const startBootProcess = () => {
      setBooting(true);
      window.removeEventListener('keydown', startBootProcess);
      window.removeEventListener('click', startBootProcess);
    };
    
    window.addEventListener('keydown', startBootProcess);
    window.addEventListener('click', startBootProcess);

    return () => {
      window.removeEventListener('keydown', startBootProcess);
      window.removeEventListener('click', startBootProcess);
    };
  }, [isKeyReady, booting, booted]);
  
  // Boot sequence animation
  useEffect(() => {
    if (!booting) return;

    const bootMessages = BootSequenceService.getBootMessages();
    let currentTimeout: number;
    
    const runBootSequence = (index = 0) => {
      if (index < bootMessages.length) {
        currentTimeout = window.setTimeout(() => {
          setBootSequence(prev => [...prev, bootMessages[index].text]);
          runBootSequence(index + 1);
        }, bootMessages[index].delay);
      } else {
        currentTimeout = window.setTimeout(() => {
          setBooting(false);
          setBooted(true);
          setMessages(MessageService.getInitialMessages());
        }, 500);
      }
    };
    
    runBootSequence();
    return () => clearTimeout(currentTimeout);
  }, [booting]);

  // Syntax highlighting
  useEffect(() => {
    if (typeof hljs !== 'undefined' && !isStreaming) {
      scrollRef.current?.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [messages, isStreaming]);

  // Auto-scroll
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView();
  }, [messages, isStreaming, bootSequence]);

  const handleSelectKey = useCallback(async () => {
    await ApiKeyService.openKeySelector();
    setIsKeyReady(true);
    setBooting(true);
  }, []);
  
  const handleApiKeySubmit = useCallback((submittedKey: string) => {
    const newSettings = settings.withApiKey(submittedKey);
    setSettings(newSettings);
    setIsKeyReady(true);
    setBooting(true);
  }, [settings]);

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if (trimmedInput === '' || isLoading || isStreaming) return;
    
    const apiKey = await ApiKeyService.getApiKey();
    if (!apiKey) {
      const errorMsg = MessageService.createErrorMessage(
        "SYSTEM ERROR: API Key is missing. Please reset the app."
      );
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    const userMessage = MessageService.createUserMessage(trimmedInput);
    
    // Add to history
    if (trimmedInput !== commandHistory[0]) {
      setCommandHistory(prev => [trimmedInput, ...prev].slice(0, 50));
    }
    setHistoryIndex(-1);

    // Handle commands
    if (CommandService.isCommand(trimmedInput)) {
      const parsed = CommandService.parseCommand(trimmedInput);
      if (parsed && parsed.command !== 'search') {
        const commandUseCase = new HandleCommandUseCase(settings, isStudioEnv);
        const result = await commandUseCase.execute(parsed.command, parsed.args);

        if (result.shouldClearMessages) {
          setMessages(MessageService.getInitialMessages());
          setInput('');
          return;
        }

        if (result.shouldOpenKeySelector) {
          await handleSelectKey();
        }

        if (result.settingsUpdate) {
          const settingsUseCase = new ManageSettingsUseCase();
          const updatedSettings = await settingsUseCase.updateSettings(settings, result.settingsUpdate);
          setSettings(updatedSettings);
        }

        if (result.message) {
          // Only add the system response, not the user command message
          // Commands should not be part of the conversation history sent to the LLM
          setMessages(prev => [...prev, result.message!]);
        }

        setInput('');
        return;
      }
    }

    // Send message to Gemini
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const sendUseCase = new SendMessageUseCase(messages, settings);
    await sendUseCase.execute(
      trimmedInput,
      (chunkText, isFirstChunk) => {
        const isError = chunkText.startsWith('SYSTEM ERROR');
        const messageRole = isError ? 'system' : 'model';
        
        if (isFirstChunk) {
          setIsLoading(false);
          setIsStreaming(true);
          const messageId = (Date.now() + 1).toString();
          const newMessage = Message.create(messageRole, chunkText, getCurrentTimestamp());
          setMessages(prev => [...prev, newMessage]);
        } else {
          setMessages(prev => {
            return MessageService.updateLastMessage(prev, (msg) => {
              if (msg.role === messageRole || (isError && msg.role === 'system')) {
                return msg.withUpdatedText(msg.text + chunkText);
              }
              return msg;
            });
          });
        }
      },
      (sources) => {
        if (sources) {
          setMessages(prev => {
            return MessageService.updateLastMessage(prev, (msg) => {
              if (msg.role === 'model') {
                return msg.withSources(sources);
              }
              return msg;
            });
          });
        }
        setIsLoading(false);
        setIsStreaming(false);
      }
    );
  }, [input, isLoading, isStreaming, messages, settings, isStudioEnv, commandHistory, handleSelectKey]);

  const handleSuggestionClick = useCallback((command: string) => {
    setInput(`/${command} `);
    setShowSuggestions(false);
  }, []);
  
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    setHistoryIndex(-1);

    if (value.startsWith('/')) {
      const commandPart = value.substring(1).toLowerCase();
      const filtered = CommandService.findMatchingCommands(commandPart);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setActiveSuggestionIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Command History Navigation (only when suggestions are not shown)
    if (!showSuggestions && commandHistory.length > 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newIndex = historyIndex === -1 
          ? 0 
          : Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setInput('');
        }
      }
    }
  }, [commandHistory, historyIndex, showSuggestions]);

  const renderContent = () => {
    if (!isKeyReady) {
      return isStudioEnv 
        ? <ApiKeySelectionUI theme={theme} onSelectKey={handleSelectKey} /> 
        : <ApiKeyInputUI theme={theme} onApiKeySubmit={handleApiKeySubmit} />;
    }
    if (booting) return <BootScreen sequence={bootSequence} theme={theme} />;
    if (!booted) return <PressToBootUI theme={theme} />;

    return (
      <>
        <MessageList messages={messages} isStreaming={isStreaming} theme={theme} endOfMessagesRef={endOfMessagesRef} fontSize={settings.fontSize} />
        {isLoading && (
          <div className="flex items-center">
            <span className="mr-2" style={{ color: theme.accent, opacity: 0.6 }}>{getCurrentTimestamp()}</span>
            <span style={{ color: theme.prompt }}>{'>'} </span>
            <span className="ml-2">CONNECTING...</span>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </>
    );
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-8">
      <div 
        className="w-full h-full shadow-lg flex flex-col relative border-4 crt-screen"
        style={{ 
          fontSize: `${settings.fontSize}px`,
          backgroundColor: theme.background,
          color: theme.text,
          borderColor: theme.accent
        }}
      >
        <TerminalHeader theme={theme} />
        <div 
          ref={scrollRef}
          className="flex-grow p-4 overflow-y-auto relative scan-lines"
          onClick={() => booted && document.querySelector('input')?.focus()}
        >
          {renderContent()}
        </div>
        {booted && (
          <TerminalInput
            input={input}
            onChange={handleInputChange}
            onSend={handleSendMessage}
            onKeyDown={handleKeyDown}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            activeSuggestionIndex={activeSuggestionIndex}
            onSuggestionSelect={handleSuggestionClick}
            onSuggestionIndexChange={setActiveSuggestionIndex}
            onSuggestionsClose={() => setShowSuggestions(false)}
            theme={theme}
            disabled={isLoading || isStreaming}
            autoFocus={true}
          />
        )}
      </div>
    </div>
  );
};
