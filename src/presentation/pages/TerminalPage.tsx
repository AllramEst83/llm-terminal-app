import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CommandNames, Message, Settings } from '../../domain';
import {
  ThemeService,
  CommandService,
  BootSequenceService,
  MessageService,
  TokenCountService,
} from '../../infrastructure/services';
import { HandleCommandUseCase, SendMessageUseCase, ManageSettingsUseCase } from '../../application';
import { getCurrentTimestamp } from '../../infrastructure/utils/date.utils';
import {
  playKeystrokeSound,
  playErrorBeep,
  playBootSound,
  unlockAudio,
} from '../../infrastructure/services/audio.service';
import {
  TerminalHeader,
  MessageList,
  TerminalInput,
  BootScreen,
  PressToBoot,
  SecureApiKeyPrompt,
  type AttachedImage,
} from '../components/features';
import { useAuth } from '../context/AuthProvider';
import { useNavigate } from 'react-router-dom';

declare const hljs: any;

const loadingChars = ['|', '/', '-', '\\'];

const isMobileDevice = (): boolean => {
  return (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (window.visualViewport && window.visualViewport.height < window.innerHeight * 0.9) ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
};

export const TerminalPage: React.FC = () => {
  const { hasApiKey, checkApiKey, isCheckingApiKey, logout, user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const [booting, setBooting] = useState<boolean>(false);
  const [booted, setBooted] = useState<boolean>(false);
  const [bootSequence, setBootSequence] = useState<string[]>([]);

  const [settings, setSettings] = useState<Settings>(Settings.createDefault());
  const [theme, setTheme] = useState(ThemeService.getDefaultTheme());

  const [suggestions, setSuggestions] = useState<
    typeof CommandService.getAllCommands extends () => infer R ? R : never
  >([]);
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
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutReason, setLogoutReason] = useState<'user' | 'command'>('user');
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const keyReady = hasApiKey === true;
  const handleConfirmLogout = useCallback(async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    const initApp = async () => {
      const loadedSettings = await new ManageSettingsUseCase().loadSettings();
      setSettings(loadedSettings);
      const loadedTheme = ThemeService.getTheme(loadedSettings.themeName);
      setTheme(loadedTheme);
      ThemeService.applyTheme(loadedTheme);

      TokenCountService.initializeSessionStorage();

      isInitializedRef.current = true;
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    checkApiKey();
  }, [user, checkApiKey]);

  useEffect(() => {
    if (!showLogoutConfirm) {
      return;
    }
    confirmButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowLogoutConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLogoutConfirm]);

  useEffect(() => {
    if (!isInitializedRef.current) {
      return;
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

  useEffect(() => {
    if (!isInitializedRef.current || !booted) {
      return;
    }
    const usage = TokenCountService.getModelTokenUsage(settings.modelName);
    setInputTokenCount(usage.inputTokens);
  }, [settings.modelName, booted]);

  useEffect(() => {
    if (!keyReady || booting || booted) return;

    const startBootProcess = () => {
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
  }, [keyReady, booting, booted]);

  useEffect(() => {
    if (!booting) return;

    playBootSound(settings.audioEnabled);

    const bootMessages = BootSequenceService.getBootMessages();
    let currentTimeout: number;

    const runBootSequence = (index = 0) => {
      if (index < bootMessages.length) {
        currentTimeout = window.setTimeout(() => {
          setBootSequence((prev) => [...prev, bootMessages[index].text]);
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
  }, [booting, settings.audioEnabled]);

  useEffect(() => {
    if (typeof hljs !== 'undefined' && !isStreaming) {
      scrollRef.current?.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [messages, isStreaming]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const maxScrollTop = container.scrollHeight - container.clientHeight;
          container.scrollTo({
            top: maxScrollTop,
            behavior: 'smooth',
          });
        });
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, bootSequence, isLoading, scrollToBottom]);

  useEffect(() => {
    if (!isMobileDevice()) {
      return;
    }

    const rootElement = document.documentElement;
    const updateViewportHeight = () => {
      if (window.visualViewport) {
        const vh = window.visualViewport.height;
        setViewportHeight(vh);
        rootElement.style.setProperty('--viewport-height', `${vh}px`);
        rootElement.style.height = `${vh}px`;
        document.body.style.height = `${vh}px`;
        const rootDiv = document.getElementById('root');
        if (rootDiv) {
          rootDiv.style.height = `${vh}px`;
        }
      } else {
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

    updateViewportHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    } else {
      window.addEventListener('resize', updateViewportHeight);
    }

    const handleOrientationChange = () => {
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

  useEffect(() => {
    if (!booted) return;

    if (!isMobileDevice()) {
      return;
    }

    const handleViewportChange = () => {
      if (!window.visualViewport) return;

      const isKeyboardOpen = window.visualViewport.height < window.innerHeight * 0.75;

      if (isKeyboardOpen) {
        setTimeout(() => {
          const input = document.querySelector('input');
          if (input) {
            input.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });

            if (terminalContainerRef.current) {
              const inputRect = input.getBoundingClientRect();
              const containerRect = terminalContainerRef.current.getBoundingClientRect();

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

  const handleImageAttach = useCallback((image: AttachedImage) => {
    setAttachedImages((prev) => [...prev, image]);
  }, []);

  const handleImageRemove = useCallback((index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleImageError = useCallback(
    (errorMessage: string) => {
      const errorMsg = MessageService.createErrorMessage(`SYSTEM ERROR: ${errorMessage}`);
      setMessages((prev) => [...prev, errorMsg]);
      playErrorBeep(settings.audioEnabled);
    },
    [settings.audioEnabled]
  );

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if ((trimmedInput === '' && attachedImages.length === 0) || isLoading || isStreaming) return;

    const messageImages =
      attachedImages.length > 0
        ? attachedImages.map((img) => ({
            base64Data: img.base64Data,
            mimeType: img.mimeType,
            fileName: img.fileName,
          }))
        : undefined;

    const userMessage = MessageService.createUserMessage(
      trimmedInput ||
        (attachedImages.length > 0 ? `Analyze ${attachedImages.length === 1 ? 'this image' : 'these images'}` : ''),
      undefined,
      undefined,
      messageImages
    );
    const modelNameInUse = settings.modelName;

    if (CommandService.isCommand(trimmedInput)) {
      const parsed = CommandService.parseCommand(trimmedInput);
      if (parsed) {
        setInput('');

        if (parsed.command !== CommandNames.CLEAR) {
          const commandEchoMessage = MessageService.createCommandExecutionMessage(trimmedInput, parsed.command);
          setMessages((prev) => [...prev, commandEchoMessage]);
        }

        setIsLoading(true);

        const commandUseCase = new HandleCommandUseCase(settings, {
          hasRemoteApiKey: hasApiKey ?? false,
        });
        const result = await commandUseCase.execute(parsed.command, parsed.args);

        setIsLoading(false);

        if (!result.success) {
          playErrorBeep(settings.audioEnabled);
        }

        if (result.shouldClearMessages) {
          setMessages(MessageService.getInitialMessages());
          setInputTokenCount(0);
          return;
        }

        if (result.settingsUpdate) {
          const settingsUseCase = new ManageSettingsUseCase();
          const updatedSettings = await settingsUseCase.updateSettings(settings, result.settingsUpdate);
          setSettings(updatedSettings);
        }

        if (result.message) {
          setMessages((prev) => [...prev, result.message!]);
        }

        if (result.shouldRefreshApiKeyStatus) {
          await checkApiKey();
        }

        if (result.shouldSignOut) {
          setLogoutReason('command');
          setShowLogoutConfirm(true);
        }

        return;
      }
    }

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachedImages([]);
    setIsLoading(true);

    playKeystrokeSound(settings.audioEnabled);

    try {
      const sendUseCase = new SendMessageUseCase(messages, settings, (newInputTokenCount) => {
        setInputTokenCount(newInputTokenCount);
      });
      await sendUseCase.execute(
        trimmedInput ||
          (attachedImages.length > 0 ? `Analyze ${attachedImages.length === 1 ? 'this image' : 'these images'}` : ''),
        (chunkText, isFirstChunk) => {
          const isError = chunkText.startsWith('SYSTEM ERROR');
          const messageRole = isError ? 'system' : 'model';

          if (isFirstChunk) {
            setIsLoading(false);
            setIsStreaming(true);
            const newMessage = Message.create(
              messageRole,
              chunkText,
              getCurrentTimestamp(),
              undefined,
              undefined,
              messageRole === 'model' ? modelNameInUse : undefined
            );
            setMessages((prev) => [...prev, newMessage]);

            if (isError) {
              playErrorBeep(settings.audioEnabled);
            }
          } else {
            setMessages((prev) => {
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
            setMessages((prev) => {
              return MessageService.updateLastMessage(prev, (msg) => {
                if (msg.role === 'model') {
                  return msg.withSources(sources);
                }
                return msg;
              });
            });
          }

          if (warningMessage) {
            setMessages((prev) => [...prev, MessageService.createSystemMessage(warningMessage)]);
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
    }
  }, [input, isLoading, isStreaming, messages, settings, attachedImages, commandHistory, hasApiKey, checkApiKey]);

  const handleSuggestionClick = useCallback((command: string) => {
    setInput(`/${command} `);
    setShowSuggestions(false);
  }, []);

  const handleInputChange = useCallback((value: string) => {
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      unlockAudio();

      if (!showSuggestions && commandHistory.length > 0) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const newIndex = historyIndex === -1 ? 0 : Math.min(historyIndex + 1, commandHistory.length - 1);
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
    },
    [commandHistory, historyIndex, showSuggestions]
  );

  const handleApiKeyStored = useCallback(async () => {
    await checkApiKey();
  }, [checkApiKey]);

  const renderContent = () => {
    if (hasApiKey === null || isCheckingApiKey) {
      return (
        <div className="p-4">
          <div className="whitespace-pre-wrap">
            SYSTEM: Performing secure key check...
            {'\n'}
            Please wait while we verify your encrypted credentials.
          </div>
        </div>
      );
    }

    if (hasApiKey === false) {
      return <SecureApiKeyPrompt theme={theme} onSuccess={handleApiKeyStored} />;
    }
    if (booting) return <BootScreen sequence={bootSequence} theme={theme} />;
    if (!booted) return <PressToBoot theme={theme} />;

    return (
      <>
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          theme={theme}
          endOfMessagesRef={endOfMessagesRef}
          fontSize={settings.fontSize}
          onImageLoad={scrollToBottom}
        />
        {isLoading && (
          <div className="flex items-center">
            <span className="mr-2" style={{ color: theme.accent, opacity: 0.6 }}>
              {getCurrentTimestamp()}
            </span>
            <span style={{ color: theme.prompt }}>{'>'} </span>
            <span className="ml-2">
              CONNECTING..... [<span className="loading-char">{loadingChars[loadingCharIndex]}</span>]
            </span>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </>
    );
  };

  const systemInfoVisible = keyReady && booted;

  return (
    <div
      className="flex flex-col p-2 sm:p-4"
      style={{
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
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
          overflow: 'hidden',
        }}
      >
        <TerminalHeader
          theme={theme}
          modelName={settings.modelName}
          thinkingEnabled={settings.getThinkingSettingsForModel(settings.modelName).enabled}
          inputTokenCount={inputTokenCount}
          systemInfoVisible={systemInfoVisible}
          onLogoutClick={() => {
            setLogoutReason('user');
            setShowLogoutConfirm(true);
          }}
          userEmail={user?.email ?? null}
          apiKeyReady={hasApiKey}
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
      {showLogoutConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
          <div
            className="w-full max-w-sm border-4 p-6 space-y-4"
            style={{ borderColor: theme.accent, backgroundColor: theme.background, color: theme.text }}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg tracking-[0.3em]">
              {logoutReason === 'command' ? 'SIGNOUT REQUESTED' : 'CONFIRM LOGOUT'}
            </h2>
            <p className="text-sm">
              This action will terminate your Supabase session and return you to the login screen.
              Continue?
            </p>
            <div className="flex space-x-3">
              <button
                ref={confirmButtonRef}
                onClick={handleConfirmLogout}
                className="flex-1 border px-3 py-2 uppercase tracking-widest"
                style={{ borderColor: theme.accent, color: theme.accent }}
              >
                Logout
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border px-3 py-2 uppercase tracking-widest"
                style={{ borderColor: theme.text, color: theme.text }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

