import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CommandNames, Message, Settings } from './domain';
import {
  ApiKeyService,
  ThemeService,
  CommandService,
  BootSequenceService,
  MessageService,
  TokenCountService
} from './infrastructure/services';
import {
  HandleCommandUseCase,
  SendMessageUseCase,
  ManageBootSequenceUseCase,
  ManageSettingsUseCase
} from './application';
import { getCurrentTimestamp } from './infrastructure/utils/date.utils';
import { playKeystrokeSound, playErrorBeep, playBootSound, unlockAudio } from './infrastructure/services/audio.service';
import {
  TerminalHeader,
  MessageList,
  TerminalInput,
  BootScreen,
  PressToBoot,
  ApiKeySelection,
  ApiKeyInput,
  type AttachedImage
} from './presentation/components/features';

// Tell TypeScript that hljs is available globally.
declare const hljs: any;

const loadingChars = ['|', '/', '-', '\\'];

// Detect if device is mobile
const isMobileDevice = (): boolean => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (window.visualViewport && window.visualViewport.height < window.innerHeight * 0.9) ||
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0);
};

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
  const [loadingCharIndex, setLoadingCharIndex] = useState<number>(0);
  const [inputTokenCount, setInputTokenCount] = useState<number>(0);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef<boolean>(false);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const clearCounterRef = useRef<number>(0);
  const messagesRef = useRef<Message[]>([]);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

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

      // Initialize token counting for the session
      TokenCountService.initializeSessionStorage();

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

  // Update input token count when model changes
  useEffect(() => {
    if (!isInitializedRef.current || !booted) {
      return;
    }

    // Only update token count from session storage when model switches
    // (not on every message change, as that will be handled by the callback)
    const usage = TokenCountService.getModelTokenUsage(settings.modelName);
    setInputTokenCount(usage.inputTokens);
  }, [settings.modelName, booted]);

  // Boot sequence trigger
  useEffect(() => {
    if (!isKeyReady || booting || booted) return;

    const startBootProcess = () => {
      // Unlock audio on user interaction
      unlockAudio();
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

    // Play boot sound when boot sequence starts
    playBootSound(settings.audioEnabled);

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
          const initialMessages = MessageService.getInitialMessages();
          setMessages(initialMessages);
          messagesRef.current = initialMessages;
        }, 500);
      }
    };

    runBootSequence();
    return () => clearTimeout(currentTimeout);
  }, [booting, settings.audioEnabled]);


  // Sync messages ref with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Syntax highlighting
  useEffect(() => {
    if (typeof hljs !== 'undefined' && !isStreaming) {
      scrollRef.current?.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [messages, isStreaming]);

  // Auto-scroll function
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      // Scroll within the message container, not the whole page
      // This prevents page scroll when keyboard is open on mobile
      const container = scrollRef.current;

      // Use requestAnimationFrame to ensure DOM has updated before scrolling
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Scroll all the way to the bottom by using scrollHeight
          // This ensures we always scroll to the absolute bottom, not just enough to show a target element
          const maxScrollTop = container.scrollHeight - container.clientHeight;

          container.scrollTo({
            top: maxScrollTop,
            behavior: 'smooth'
          });
        });
      });
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, bootSequence, isLoading, scrollToBottom]);

  // Handle mobile keyboard - adjust terminal height when keyboard opens
  useEffect(() => {
    // Only run viewport height adjustment on mobile devices
    if (!isMobileDevice()) {
      return;
    }

    const rootElement = document.documentElement;
    const updateViewportHeight = () => {
      // Use Visual Viewport API if available (modern browsers)
      if (window.visualViewport) {
        const vh = window.visualViewport.height;
        setViewportHeight(vh);
        // Set CSS custom property and root height
        rootElement.style.setProperty('--viewport-height', `${vh}px`);
        rootElement.style.height = `${vh}px`;
        document.body.style.height = `${vh}px`;
        const rootDiv = document.getElementById('root');
        if (rootDiv) {
          rootDiv.style.height = `${vh}px`;
        }
      } else {
        // Fallback to window.innerHeight
        const height = window.innerHeight;
        setViewportHeight(height);
        rootElement.style.setProperty('--viewport-height', `${height}px`);
        rootElement.style.height = `${height}px`;
        document.body.style.height = `${height}px`;
        const rootDiv = document.getElementById('root');
        if (rootDiv) {
          rootDiv.style.height = `${height}px`;
        }
      }
    };

    // Initial height
    updateViewportHeight();

    // Listen to visual viewport changes (keyboard open/close)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    } else {
      // Fallback to window resize
      window.addEventListener('resize', updateViewportHeight);
    }

    // Also listen to orientation changes
    const handleOrientationChange = () => {
      // Delay to allow orientation change to complete
      setTimeout(updateViewportHeight, 100);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      } else {
        window.removeEventListener('resize', updateViewportHeight);
      }
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Scroll input into view when keyboard opens (mobile only)
  useEffect(() => {
    if (!booted) return;

    // Only run on mobile devices
    if (!isMobileDevice()) {
      return;
    }

    const handleViewportChange = () => {
      if (!window.visualViewport) return;

      // Check if keyboard is likely open (viewport height reduced significantly)
      const isKeyboardOpen = window.visualViewport.height < window.innerHeight * 0.75;

      if (isKeyboardOpen) {
        // Small delay to ensure layout has updated
        setTimeout(() => {
          const input = document.querySelector('input');
          if (input) {
            // Scroll the input into view, but don't scroll the page
            input.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });

            // Also ensure the terminal container shows the input
            if (terminalContainerRef.current) {
              const inputRect = input.getBoundingClientRect();
              const containerRect = terminalContainerRef.current.getBoundingClientRect();

              // If input is below visible area, scroll it into view
              if (inputRect.bottom > containerRect.bottom) {
                input.scrollIntoView({ behavior: 'smooth', block: 'end' });
              }
            }
          }
        }, 150);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    }
  }, [booted]);

  // Loading animation
  useEffect(() => {
    if (isLoading) {
      const intervalId = setInterval(() => {
        setLoadingCharIndex((prevIndex) => (prevIndex + 1) % loadingChars.length);
      }, 80);
      return () => clearInterval(intervalId);
    } else {
      setLoadingCharIndex(0);
    }
  }, [isLoading]);

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

  const handleImageAttach = useCallback((image: AttachedImage) => {
    setAttachedImages(prev => [...prev, image]);
  }, []);

  const handleImageRemove = useCallback((index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleImageError = useCallback((errorMessage: string) => {
    const errorMsg = MessageService.createErrorMessage(`SYSTEM ERROR: ${errorMessage}`);
    setMessages(prev => [...prev, errorMsg]);
    playErrorBeep(settings.audioEnabled);
  }, [settings.audioEnabled]);

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if ((trimmedInput === '' && attachedImages.length === 0) || isLoading || isStreaming) return;

    const apiKey = await ApiKeyService.getApiKey();
    if (!apiKey) {
      const errorMsg = MessageService.createErrorMessage(
        "SYSTEM ERROR: API Key is missing. Please reset the app."
      );
      setMessages(prev => [...prev, errorMsg]);
      playErrorBeep(settings.audioEnabled);
      return;
    }

    // Convert attached images to MessageImage format
    const messageImages = attachedImages.length > 0
      ? attachedImages.map(img => ({
        base64Data: img.base64Data,
        mimeType: img.mimeType,
        fileName: img.fileName,
      }))
      : undefined;

    const userMessage = MessageService.createUserMessage(
      trimmedInput || (attachedImages.length > 0 ? `Analyze ${attachedImages.length === 1 ? 'this image' : 'these images'}` : ''),
      undefined,
      undefined,
      messageImages
    );
    const modelNameInUse = settings.modelName;

    // Add to history
    if (trimmedInput !== commandHistory[0]) {
      setCommandHistory(prev => [trimmedInput, ...prev].slice(0, 50));
    }
    setHistoryIndex(-1);

    // Handle commands
    if (CommandService.isCommand(trimmedInput)) {
      const parsed = CommandService.parseCommand(trimmedInput);
      if (!parsed) {
        return;
      }

      try {
        // Clear input immediately for all commands
        setInput('');

        // Track clear counter at command start to detect if clear happens during async execution
        const commandStartClearCounter = clearCounterRef.current;

        // Add command echo immediately (before async execution) for instant user feedback
        // Skip echo for CLEAR command since we're clearing everything anyway
        if (parsed.command !== CommandNames.CLEAR && 
            clearCounterRef.current === commandStartClearCounter) {
          const commandEchoMessage = MessageService.createCommandExecutionMessage(
            trimmedInput,
            parsed.command
          );
          setMessages(prev => [...prev, commandEchoMessage]);
        }

        // Execute command
        setIsLoading(true);
        const commandUseCase = new HandleCommandUseCase(settings, isStudioEnv);
        const result = await commandUseCase.execute(parsed.command, parsed.args);
        setIsLoading(false);

        // Handle command result
        if (!result.success) {
          playErrorBeep(settings.audioEnabled);
        }

        // Handle clear command - must happen before any other message updates
        if (result.shouldClearMessages) {
          clearCounterRef.current += 1;
          const initialMessages = MessageService.getInitialMessages();
          setMessages(() => initialMessages);
          messagesRef.current = initialMessages;
          setInputTokenCount(0);
          return;
        }

        // If a clear happened while this command was executing, don't add result messages
        if (clearCounterRef.current !== commandStartClearCounter) {
          return;
        }

        // Process command results
        if (result.shouldOpenKeySelector) {
          await handleSelectKey();
        }

        if (result.settingsUpdate) {
          const settingsUseCase = new ManageSettingsUseCase();
          const updatedSettings = await settingsUseCase.updateSettings(settings, result.settingsUpdate);
          setSettings(updatedSettings);
        }

        if (result.message) {
          setMessages(prev => [...prev, result.message!]);
        }
      } catch (error) {
        setIsLoading(false);
        console.error('Command execution error:', error);
        const errorMessage = MessageService.createErrorMessage(
          `SYSTEM ERROR: Command execution failed. ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        setMessages(prev => [...prev, errorMessage]);
        playErrorBeep(settings.audioEnabled);
      }

      return;
    }
    
    // Send message to Gemini
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedImages([]); // Clear attached images after sending
    setIsLoading(true);

    // Play keystroke sound
    playKeystrokeSound(settings.audioEnabled);

    try {
      const sendUseCase = new SendMessageUseCase(
        messages,
        settings,
        (newInputTokenCount) => {
          // Update token count in UI after tokens are counted
          setInputTokenCount(newInputTokenCount);
        }
      );
      await sendUseCase.execute(
        trimmedInput || (attachedImages.length > 0 ? `Analyze ${attachedImages.length === 1 ? 'this image' : 'these images'}` : ''),
        (chunkText, isFirstChunk) => {
          const isError = chunkText.startsWith('SYSTEM ERROR');
          const messageRole = isError ? 'system' : 'model';

          if (isFirstChunk) {
            setIsLoading(false);
            setIsStreaming(true);
            const messageId = (Date.now() + 1).toString();
            const newMessage = Message.create(
              messageRole,
              chunkText,
              getCurrentTimestamp(),
              undefined,
              undefined,
              messageRole === 'model' ? modelNameInUse : undefined
            );
            setMessages(prev => [...prev, newMessage]);

            // Play error beep if error
            if (isError) {
              playErrorBeep(settings.audioEnabled);
            }
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
        ({ sources, warningMessage } = {}) => {
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

          if (warningMessage) {
            setMessages(prev => [...prev, MessageService.createSystemMessage(warningMessage)]);
          }

          setIsLoading(false);
          setIsStreaming(false);
        },
        undefined,
        undefined,
        messageImages
      );
    } catch (error) {
      setIsLoading(false);
      setIsStreaming(false);
      // Error handling is done in the execute callbacks
    }
  }, [input, isLoading, isStreaming, messages, settings, isStudioEnv, commandHistory, handleSelectKey, attachedImages]);

  const handleSuggestionClick = useCallback((command: string) => {
    setInput(`/${command} `);
    setShowSuggestions(false);
  }, []);

  const handleInputChange = useCallback((value: string) => {
    // Unlock audio on user interaction
    unlockAudio();

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
    // Unlock audio on user interaction
    unlockAudio();

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
        ? <ApiKeySelection theme={theme} onSelectKey={handleSelectKey} />
        : <ApiKeyInput theme={theme} onApiKeySubmit={handleApiKeySubmit} />;
    }
    if (booting) return <BootScreen sequence={bootSequence} theme={theme} />;
    if (!booted) return <PressToBoot theme={theme} />;

    return (
      <>
        <MessageList messages={messages} isStreaming={isStreaming} theme={theme} endOfMessagesRef={endOfMessagesRef} fontSize={settings.fontSize} onImageLoad={scrollToBottom} />
        {isLoading && (
          <div className="flex items-center">
            <span className="mr-2" style={{ color: theme.accent, opacity: 0.6 }}>{getCurrentTimestamp()}</span>
            <span style={{ color: theme.prompt }}>{'>'} </span>
            <span className="ml-2">CONNECTING..... [<span className="loading-char">{loadingChars[loadingCharIndex]}</span>]</span>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </>
    );
  };

  const systemInfoVisible = isKeyReady && booted;

  return (
    <div
      className="flex flex-col p-2 sm:p-4"
      style={{
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        ref={terminalContainerRef}
        className="w-full shadow-lg flex flex-col relative border-4 crt-screen flex-1 min-h-0"
        style={{
          fontSize: `${settings.fontSize}px`,
          backgroundColor: theme.background,
          color: theme.text,
          borderColor: theme.accent,
          transition: 'height 0.2s ease-out, max-height 0.2s ease-out',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <TerminalHeader
          theme={theme}
          modelName={settings.modelName}
          thinkingEnabled={settings.getThinkingSettingsForModel(settings.modelName).enabled}
          inputTokenCount={inputTokenCount}
          systemInfoVisible={systemInfoVisible}
        />
        <div
          ref={scrollRef}
          className="flex-1 p-4 overflow-y-auto relative scan-lines min-h-0"
          style={{ overflowY: 'auto' }}
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
            attachedImages={attachedImages}
            onImageAttach={handleImageAttach}
            onImageRemove={handleImageRemove}
            maxImages={10}
            onError={handleImageError}
          />
        )}
      </div>
    </div>
  );
};
