import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CommandNames, Message, MessageType, Settings, QueueItem } from './domain';
import {
  ApiKeyService,
  ThemeService,
  CommandService,
  BootSequenceService,
  MessageService,
  TokenCountService,
  QueueService
} from './infrastructure/services';
import {
  HandleCommandUseCase,
  SendMessageUseCase,
  ManageBootSequenceUseCase,
  ManageSettingsUseCase
} from './application';
import { getCurrentTimestamp } from './infrastructure/utils/date.utils';
import {
  TerminalHeader,
  MessageList,
  TerminalInput,
  BootScreen,
  PressToBoot,
  ApiKeySelection,
  ApiKeyInput,
  QueueDisplay
} from './presentation/components/features';
import type { AttachedImage } from './types/ui/components';

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
  const commandShortcuts = useMemo(() => {
    return CommandService.getAllCommands().sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [loadingCharIndex, setLoadingCharIndex] = useState<number>(0);
  const [inputTokenCount, setInputTokenCount] = useState<number>(0);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef<boolean>(false);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const clearCounterRef = useRef<number>(0);
  const messagesRef = useRef<Message[]>([]);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
  const currentProcessingItemIdRef = useRef<string | null>(null);
  const queueProcessingAbortRef = useRef<boolean | null>(null);
  const queueRef = useRef<QueueItem[]>([]);
  const keyboardBaselineHeightRef = useRef<number | null>(null);

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
          const initialMessages = MessageService.getInitialMessages();
          setMessages(initialMessages);
          messagesRef.current = initialMessages;
        }, 500);
      }
    };

    runBootSequence();
    return () => clearTimeout(currentTimeout);
  }, [booting]);


  // Sync messages ref with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Sync queue ref with state
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

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
      setIsKeyboardVisible(false);
      keyboardBaselineHeightRef.current = null;
      return;
    }

    const rootElement = document.documentElement;
    const updateViewportHeight = () => {
      const visualHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const layoutHeight = window.innerHeight;
      const baselineCandidate = Math.max(visualHeight, layoutHeight);

      setViewportHeight(visualHeight);
      // Set CSS custom property and root height
      rootElement.style.setProperty('--viewport-height', `${visualHeight}px`);
      rootElement.style.height = `${visualHeight}px`;
      document.body.style.height = `${visualHeight}px`;
      const rootDiv = document.getElementById('root');
      if (rootDiv) {
        rootDiv.style.height = `${visualHeight}px`;
      }

      if (
        keyboardBaselineHeightRef.current === null ||
        baselineCandidate > keyboardBaselineHeightRef.current
      ) {
        keyboardBaselineHeightRef.current = baselineCandidate;
      }

      const baselineHeight = keyboardBaselineHeightRef.current;
      const isKeyboardOpen = baselineHeight ? visualHeight < baselineHeight * 0.75 : false;
      setIsKeyboardVisible(isKeyboardOpen);
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
      keyboardBaselineHeightRef.current = null;
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
  }, []);

  const removeFromQueue = useCallback((itemId: string) => {
    setQueue(prev => {
      const item = prev.find(q => q.id === itemId);
      if (item?.isProcessing()) {
        // If item is currently processing, mark for cancellation
        queueProcessingAbortRef.current = true;
        currentProcessingItemIdRef.current = null;
      }
      return QueueService.removeItem(prev, itemId);
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue(prev => {
      // If any item is processing, mark for cancellation
      if (prev.some(item => item.isProcessing())) {
        queueProcessingAbortRef.current = true;
        currentProcessingItemIdRef.current = null;
      }
      return QueueService.clearQueue(prev);
    });
  }, []);

  const processQueue = useCallback(async () => {
    // Prevent concurrent processing
    if (isProcessingQueue) return;
    
    // Use a ref to track if we're processing to prevent race conditions
    if (queueProcessingAbortRef.current === null) {
      queueProcessingAbortRef.current = false;
    } else if (queueProcessingAbortRef.current === true) {
      // Already processing, skip
      return;
    }

    // Additional check: if there's already a processing item, don't start new processing
    const currentQueue = queueRef.current;
    if (QueueService.hasProcessingItems(currentQueue)) {
      return;
    }

    setIsProcessingQueue(true);
    queueProcessingAbortRef.current = false;

    // Process queue items one at a time
    let shouldContinue = true;
    let iterationCount = 0;
    const MAX_ITERATIONS = 1000; // Safety limit to prevent infinite loops
    
    while (shouldContinue && iterationCount < MAX_ITERATIONS) {
      iterationCount++;
      // Check if queue was cleared or processing was aborted
      if (queueProcessingAbortRef.current) {
        queueProcessingAbortRef.current = false;
        shouldContinue = false;
        break;
      }

      // Get current queue state from ref (re-read in each iteration)
      const currentQueue = queueRef.current;
      
      // Prevent processing if there's already a processing item (prevent duplicates)
      if (QueueService.hasProcessingItems(currentQueue)) {
        // Wait a bit and check again
        await new Promise(resolve => setTimeout(resolve, 50));
        const recheckQueue = queueRef.current;
        if (QueueService.hasProcessingItems(recheckQueue)) {
          // Still processing, exit
          shouldContinue = false;
          break;
        }
        // Processing finished, continue
        continue;
      }
      
      const nextItem = QueueService.getNextPendingItem(currentQueue);

      if (!nextItem) {
        // No more pending items - check one more time after a brief delay
        // in case items were added while we were processing
        await new Promise(resolve => setTimeout(resolve, 100));
        const finalCheck = queueRef.current;
        const stillNoItems = !QueueService.getNextPendingItem(finalCheck);
        if (stillNoItems) {
          shouldContinue = false;
          break;
        }
        // Items were added, continue loop
        continue;
      }

      // Double-check that item still exists and is still pending (prevent processing removed items)
      const verifyQueue = queueRef.current;
      const verifiedItem = verifyQueue.find(item => item.id === nextItem.id);
      if (!verifiedItem || !verifiedItem.isPending()) {
        // Item was removed or is no longer pending, skip it
        continue;
      }

      // Mark item as processing (only if it's still in the queue and pending)
      setQueue(prev => {
        const itemExists = prev.some(item => item.id === nextItem.id && item.isPending());
        if (!itemExists) {
          return prev; // Item was removed, don't update
        }
        return QueueService.updateItemStatus(prev, nextItem.id, 'processing');
      });
      // Wait for state update to propagate to ref
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Verify item still exists after state update
      const postMarkQueue = queueRef.current;
      const itemStillPending = postMarkQueue.find(item => item.id === nextItem.id && item.isProcessing());
      if (!itemStillPending) {
        // Item was removed or status changed, skip processing
        continue;
      }
      
      currentProcessingItemIdRef.current = nextItem.id;

      // Check again if aborted after marking as processing
      if (queueProcessingAbortRef.current) {
        setQueue(prev => QueueService.updateItemStatus(prev, nextItem.id, 'cancelled'));
        queueProcessingAbortRef.current = false;
        shouldContinue = false;
        break;
      }

      const trimmedInput = nextItem.text.trim();
      const apiKey = await ApiKeyService.getApiKey();

      if (!apiKey) {
        const errorMsg = MessageService.createErrorMessage(
          "SYSTEM ERROR: API Key is missing. Please reset the app."
        );
        setMessages(prev => [...prev, errorMsg]);
        setQueue(prev => {
          const updated = QueueService.updateItemStatus(prev, nextItem.id, 'completed');
          return QueueService.removeCompletedItems(updated);
        });
        continue;
      }

      // Convert attached images to MessageImage format
      const messageImages = nextItem.attachedImages.length > 0
        ? nextItem.attachedImages.map(img => ({
          base64Data: img.base64Data,
          mimeType: img.mimeType,
          fileName: img.fileName,
        }))
        : undefined;

      const modelNameInUse = settings.modelName;

      // Handle commands
      if (CommandService.isCommand(trimmedInput)) {
        const parsed = CommandService.parseCommand(trimmedInput);
        if (!parsed) {
          setQueue(prev => {
            const updated = QueueService.updateItemStatus(prev, nextItem.id, 'completed');
            return QueueService.removeCompletedItems(updated);
          });
          continue;
        }

        try {
          // Track clear counter at command start
          const commandStartClearCounter = clearCounterRef.current;

          // Check if item still exists in queue before processing (fix for removed items still executing)
          const currentQueueCheck = queueRef.current;
          const itemStillExists = currentQueueCheck.some(item => item.id === nextItem.id);
          if (!itemStillExists) {
            // Item was removed, skip processing
            shouldContinue = false;
            break;
          }

          // Check if cancelled before executing
          if (queueProcessingAbortRef.current || currentProcessingItemIdRef.current !== nextItem.id) {
            setQueue(prev => QueueService.updateItemStatus(prev, nextItem.id, 'cancelled'));
            queueProcessingAbortRef.current = false;
            shouldContinue = false;
            break;
          }

          // Add command echo immediately (before async execution) - show user what they typed
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

          // Check if item still exists after execution
          const postExecutionQueueCheck = queueRef.current;
          const itemStillExistsAfter = postExecutionQueueCheck.some(item => item.id === nextItem.id);
          if (!itemStillExistsAfter) {
            // Item was removed during execution, skip adding result
            shouldContinue = false;
            break;
          }

          // Check if cancelled after execution
          if (queueProcessingAbortRef.current || currentProcessingItemIdRef.current !== nextItem.id) {
            setQueue(prev => QueueService.updateItemStatus(prev, nextItem.id, 'cancelled'));
            queueProcessingAbortRef.current = false;
            shouldContinue = false;
            break;
          }

          // Handle command result
          // Handle clear command
          if (result.shouldClearMessages) {
            clearCounterRef.current += 1;
            const initialMessages = MessageService.getInitialMessages();
            setMessages(() => initialMessages);
            messagesRef.current = initialMessages;
            setInputTokenCount(0);
            setQueue(prev => {
              const updated = QueueService.updateItemStatus(prev, nextItem.id, 'completed');
              return QueueService.removeCompletedItems(updated);
            });
            continue;
          }

          // If a clear happened while this command was executing, don't add result messages
          if (clearCounterRef.current !== commandStartClearCounter) {
            setQueue(prev => {
              const updated = QueueService.updateItemStatus(prev, nextItem.id, 'completed');
              return QueueService.removeCompletedItems(updated);
            });
            continue;
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

          // For commands that don't use Gemini, the result.message already contains the output
          // Don't add command echo separately - the result message is sufficient
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
        }

        // Mark as completed and remove
        setQueue(prev => {
          const updated = QueueService.updateItemStatus(prev, nextItem.id, 'completed');
          return QueueService.removeCompletedItems(updated);
        });
        currentProcessingItemIdRef.current = null;
        continue;
      }

      // Verify item still exists before processing message (prevent processing removed items)
      const preMessageQueue = queueRef.current;
      const itemExistsForMessage = preMessageQueue.some(item => item.id === nextItem.id && item.isProcessing());
      if (!itemExistsForMessage) {
        // Item was removed, skip processing
        shouldContinue = false;
        break;
      }

      // Send message to Gemini
      const userMessage = MessageService.createUserMessage(
        trimmedInput || (nextItem.attachedImages.length > 0 ? `Analyze ${nextItem.attachedImages.length === 1 ? 'this image' : 'these images'}` : ''),
        undefined,
        undefined,
        messageImages
      );

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      // Check if cancelled before sending
      if (queueProcessingAbortRef.current || currentProcessingItemIdRef.current !== nextItem.id) {
        setIsLoading(false);
        setQueue(prev => QueueService.updateItemStatus(prev, nextItem.id, 'cancelled'));
        queueProcessingAbortRef.current = false;
        break;
      }

      let streamingCompleted = false;
      let streamingError = false;

      try {
        const sendUseCase = new SendMessageUseCase(
          messagesRef.current,
          settings,
          (newInputTokenCount) => {
            setInputTokenCount(newInputTokenCount);
          }
        );
        await sendUseCase.execute(
          trimmedInput || (nextItem.attachedImages.length > 0 ? `Analyze ${nextItem.attachedImages.length === 1 ? 'this image' : 'these images'}` : ''),
          (chunkText, isFirstChunk) => {
            // Check if cancelled during streaming
            if (queueProcessingAbortRef.current || currentProcessingItemIdRef.current !== nextItem.id) {
              streamingError = true;
              return;
            }

            const isError = chunkText.startsWith('SYSTEM ERROR');
            const messageRole = isError ? 'system' : 'model';
            const messageType = messageRole === 'model' ? MessageType.AI : MessageType.USER;

            if (isFirstChunk) {
              setIsLoading(false);
              setIsStreaming(true);
              const newMessage = Message.create(
                messageRole,
                messageType,
                chunkText,
                getCurrentTimestamp(),
                undefined,
                undefined,
                messageRole === 'model' ? modelNameInUse : undefined
              );
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
          ({ sources, warningMessage } = {}) => {
            // Check if cancelled during completion
            if (queueProcessingAbortRef.current || currentProcessingItemIdRef.current !== nextItem.id) {
              streamingError = true;
              return;
            }

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
            streamingCompleted = true;
          },
          undefined,
          undefined,
          messageImages
        );
      } catch (error) {
        setIsLoading(false);
        setIsStreaming(false);
        streamingError = true;
        // Error handling is done in the execute callbacks
      }

      // Handle streaming errors and cancellations
      if (streamingError) {
        // If streaming was cancelled (aborted), mark as cancelled
        if (queueProcessingAbortRef.current || currentProcessingItemIdRef.current !== nextItem.id) {
          setQueue(prev => QueueService.updateItemStatus(prev, nextItem.id, 'cancelled'));
          queueProcessingAbortRef.current = false;
          shouldContinue = false;
          break;
        } else {
          // Real error occurred (not aborted) - mark as cancelled and log error
          console.error('Streaming error occurred for queue item:', nextItem.id);
          setQueue(prev => QueueService.updateItemStatus(prev, nextItem.id, 'cancelled'));
          // Continue to next item instead of breaking
          currentProcessingItemIdRef.current = null;
          continue;
        }
      }

      // Only mark as completed if streaming actually completed successfully
      if (!streamingCompleted) {
        // Streaming didn't complete - this shouldn't happen normally, but handle it
        console.warn('Streaming did not complete for queue item:', nextItem.id);
        setQueue(prev => QueueService.updateItemStatus(prev, nextItem.id, 'cancelled'));
        currentProcessingItemIdRef.current = null;
        continue;
      }

      // Mark as completed and remove
      setQueue(prev => {
        const updated = QueueService.updateItemStatus(prev, nextItem.id, 'completed');
        return QueueService.removeCompletedItems(updated);
      });
      currentProcessingItemIdRef.current = null;
    }

    setIsProcessingQueue(false);
    currentProcessingItemIdRef.current = null;
    queueProcessingAbortRef.current = null; // Reset to allow future processing
    
    // Safety check - if we hit max iterations, log a warning
    if (iterationCount >= MAX_ITERATIONS) {
      console.warn('Queue processing hit max iterations limit. This may indicate an infinite loop.');
    }
  }, [isProcessingQueue, settings, isStudioEnv, handleSelectKey]);

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    // Allow adding to queue even while processing (isLoading/isStreaming)
    // Only prevent if input is empty
    if (trimmedInput === '' && attachedImages.length === 0) return;

    // Determine if it's a command or message
    const isCommand = CommandService.isCommand(trimmedInput);
    const queueItemType: QueueItem['type'] = isCommand ? 'command' : 'message';

    // Create queue item
    const queueItem = QueueItem.create(
      trimmedInput || (attachedImages.length > 0 ? `Analyze ${attachedImages.length === 1 ? 'this image' : 'these images'}` : ''),
      queueItemType,
      [...attachedImages]
    );

    // Add to queue
    setQueue(prev => QueueService.addItem(prev, queueItem));

    // Add to history
    if (trimmedInput !== commandHistory[0]) {
      setCommandHistory(prev => [trimmedInput, ...prev].slice(0, 50));
    }
    setHistoryIndex(-1);

    // Clear input and attached images
    setInput('');
    setAttachedImages([]);

    // Queue processing will be triggered by useEffect when queue state changes
  }, [input, attachedImages, commandHistory]);

  // Trigger queue processing when items are added and queue is not processing
  useEffect(() => {
    // Only trigger if app is booted
    if (!booted) return;
    
    // Check if we're already processing - if so, don't trigger again
    if (isProcessingQueue) return;
    
    // Check if there are pending items using the ref (more reliable than state)
    const hasPending = QueueService.hasPendingItems(queueRef.current);
    if (!hasPending) return;
    
    // Use a small delay to ensure state is settled and prevent rapid re-triggers
    const timeoutId = setTimeout(() => {
      // Double-check conditions before starting
      if (!isProcessingQueue && QueueService.hasPendingItems(queueRef.current)) {
        processQueue();
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [queue.length, isProcessingQueue, booted, processQueue]); // Include processQueue to avoid stale closure

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
          <>
            <QueueDisplay
              queue={queue}
              onRemove={removeFromQueue}
              onClear={clearQueue}
              theme={theme}
            />
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
              commandShortcuts={commandShortcuts}
              showCommandToolbar={isKeyboardVisible}
              theme={theme}
              disabled={false}
              autoFocus={true}
              attachedImages={attachedImages}
              onImageAttach={handleImageAttach}
              onImageRemove={handleImageRemove}
              maxImages={10}
              onError={handleImageError}
            />
          </>
        )}
      </div>
    </div>
  );
};
