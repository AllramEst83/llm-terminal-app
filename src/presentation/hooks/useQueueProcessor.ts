import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Message,
  MessageType,
  QueueItem,
  Settings,
} from '../../domain';
import {
  ApiKeyService,
  CommandService,
  MessageService,
  QueueService,
  TokenCountService,
} from '../../infrastructure/services';
import {
  HandleCommandUseCase,
  SendMessageUseCase,
  ManageSettingsUseCase,
} from '../../application';
import { getCurrentTimestamp } from '../../domain/utils';

export interface QueueProcessorCallbacks {
  onApiKeySubmit: (key: string) => void;
  onSelectKey: () => Promise<void>;
}

export function useQueueProcessor(
  sessionId: string,
  settings: Settings,
  setSettings: React.Dispatch<React.SetStateAction<Settings>>,
  isStudioEnv: boolean,
  bootedRef: React.RefObject<boolean>,
  callbacks: QueueProcessorCallbacks
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputTokenCount, setInputTokenCount] = useState(0);

  const messagesRef = useRef<Message[]>([]);
  const queueRef = useRef<QueueItem[]>([]);
  const clearCounterRef = useRef(0);
  const currentProcessingItemIdRef = useRef<string | null>(null);
  const queueProcessingAbortRef = useRef<boolean | null>(null);

  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  const bootedValue = bootedRef.current;
  useEffect(() => {
    if (!bootedValue) return;
    const usage = TokenCountService.getModelTokenUsage(settings.modelName, sessionId);
    setInputTokenCount(usage.inputTokens);
  }, [settings.modelName, bootedValue, sessionId]);

  const initMessages = useCallback((msgs: Message[]) => {
    setMessages(msgs);
    messagesRef.current = msgs;
  }, []);

  const enqueue = useCallback((item: QueueItem) => {
    setQueue(prev => QueueService.addItem(prev, item));
  }, []);

  const removeFromQueue = useCallback((itemId: string) => {
    setQueue(prev => {
      const item = prev.find(q => q.id === itemId);
      if (item?.isProcessing()) {
        queueProcessingAbortRef.current = true;
        currentProcessingItemIdRef.current = null;
      }
      return QueueService.removeItem(prev, itemId);
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue(prev => {
      if (prev.some(item => item.isProcessing())) {
        queueProcessingAbortRef.current = true;
        currentProcessingItemIdRef.current = null;
      }
      return QueueService.clearQueue(prev);
    });
  }, []);

  const markCompleteAndRemove = useCallback((itemId: string) => {
    setQueue(prev => {
      const updated = QueueService.updateItemStatus(prev, itemId, 'completed');
      return QueueService.removeCompletedItems(updated);
    });
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingQueue) return;
    if (queueProcessingAbortRef.current === null) {
      queueProcessingAbortRef.current = false;
    } else if (queueProcessingAbortRef.current === true) {
      return;
    }

    const currentQueue = queueRef.current;
    if (QueueService.hasProcessingItems(currentQueue)) return;

    setIsProcessingQueue(true);
    queueProcessingAbortRef.current = false;

    let shouldContinue = true;
    let iterationCount = 0;
    const MAX_ITERATIONS = 1000;

    while (shouldContinue && iterationCount < MAX_ITERATIONS) {
      iterationCount++;

      if (queueProcessingAbortRef.current) {
        queueProcessingAbortRef.current = false;
        break;
      }

      const currentQ = queueRef.current;

      if (QueueService.hasProcessingItems(currentQ)) {
        await new Promise(r => setTimeout(r, 50));
        if (QueueService.hasProcessingItems(queueRef.current)) break;
        continue;
      }

      const nextItem = QueueService.getNextPendingItem(currentQ);
      if (!nextItem) {
        await new Promise(r => setTimeout(r, 100));
        if (!QueueService.getNextPendingItem(queueRef.current)) break;
        continue;
      }

      const verified = queueRef.current.find(i => i.id === nextItem.id);
      if (!verified || !verified.isPending()) continue;

      setQueue(prev => {
        if (!prev.some(i => i.id === nextItem.id && i.isPending())) return prev;
        return QueueService.updateItemStatus(prev, nextItem.id, 'processing');
      });
      await new Promise(r => setTimeout(r, 0));

      if (!queueRef.current.find(i => i.id === nextItem.id && i.isProcessing())) continue;

      currentProcessingItemIdRef.current = nextItem.id;

      if (queueProcessingAbortRef.current) {
        setQueue(prev => QueueService.updateItemStatus(prev, nextItem.id, 'cancelled'));
        queueProcessingAbortRef.current = false;
        break;
      }

      const trimmedInput = nextItem.text.trim();
      const storedApiKey = await ApiKeyService.getApiKey();

      if (!storedApiKey) {
        callbacksRef.current.onApiKeySubmit('');
        markCompleteAndRemove(nextItem.id);
        continue;
      }

      const messageImages = nextItem.attachedImages.length > 0
        ? nextItem.attachedImages.map(img => ({ base64Data: img.base64Data, mimeType: img.mimeType, fileName: img.fileName }))
        : undefined;

      const currentSettings = settingsRef.current;
      const modelNameInUse = currentSettings.modelName;

      if (CommandService.isCommand(trimmedInput)) {
        await processCommand(nextItem, trimmedInput, currentSettings, messageImages);
        currentProcessingItemIdRef.current = null;
        continue;
      }

      const itemExists = queueRef.current.some(i => i.id === nextItem.id && i.isProcessing());
      if (!itemExists) break;

      shouldContinue = await processMessage(
        nextItem, trimmedInput, currentSettings, modelNameInUse, messageImages
      );
      currentProcessingItemIdRef.current = null;
    }

    setIsProcessingQueue(false);
    currentProcessingItemIdRef.current = null;
    queueProcessingAbortRef.current = null;
  }, [isProcessingQueue]);

  async function processCommand(
    nextItem: QueueItem,
    trimmedInput: string,
    currentSettings: Settings,
    _messageImages: Array<{ base64Data: string; mimeType: string; fileName: string }> | undefined
  ) {
    const parsed = CommandService.parseCommand(trimmedInput);
    if (!parsed) {
      markCompleteAndRemove(nextItem.id);
      return;
    }

    try {
      const commandStartClearCounter = clearCounterRef.current;

      if (!queueRef.current.some(i => i.id === nextItem.id)) return;
      if (queueProcessingAbortRef.current || currentProcessingItemIdRef.current !== nextItem.id) {
        setQueue(prev => QueueService.updateItemStatus(prev, nextItem.id, 'cancelled'));
        queueProcessingAbortRef.current = false;
        return;
      }

      if ((parsed.command as string) !== 'clear' && clearCounterRef.current === commandStartClearCounter) {
        const echo = MessageService.createCommandExecutionMessage(trimmedInput, parsed.command);
        setMessages(prev => [...prev, echo]);
      }

      setIsLoading(true);
      const result = await new HandleCommandUseCase(currentSettings, isStudioEnv, sessionId).execute(parsed.command, parsed.args);
      setIsLoading(false);

      if (!queueRef.current.some(i => i.id === nextItem.id)) return;
      if (queueProcessingAbortRef.current || currentProcessingItemIdRef.current !== nextItem.id) {
        setQueue(prev => QueueService.updateItemStatus(prev, nextItem.id, 'cancelled'));
        queueProcessingAbortRef.current = false;
        return;
      }

      if (result.shouldClearMessages) {
        clearCounterRef.current += 1;
        const initial = MessageService.getInitialMessages();
        setMessages(() => initial);
        messagesRef.current = initial;
        setInputTokenCount(0);
        markCompleteAndRemove(nextItem.id);
        return;
      }

      if (clearCounterRef.current !== commandStartClearCounter) {
        markCompleteAndRemove(nextItem.id);
        return;
      }

      if (result.shouldOpenKeySelector) {
        await callbacksRef.current.onSelectKey();
      }

      if (result.settingsUpdate) {
        const settingsUseCase = new ManageSettingsUseCase(sessionId);
        const updated = await settingsUseCase.updateSettings(
          currentSettings, result.settingsUpdate, { applyTheme: false }
        );
        setSettings(updated);
        if (result.settingsUpdate.apiKey) {
          callbacksRef.current.onApiKeySubmit(result.settingsUpdate.apiKey);
        }
      }

      if (result.message) {
        setMessages(prev => [...prev, result.message!]);
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Command execution error:', error);
      setMessages(prev => [...prev, MessageService.createErrorMessage(
        `SYSTEM ERROR: Command execution failed. ${error instanceof Error ? error.message : 'Unknown error'}`
      )]);
    }

    markCompleteAndRemove(nextItem.id);
  }

  async function processMessage(
    nextItem: QueueItem,
    trimmedInput: string,
    currentSettings: Settings,
    modelNameInUse: string,
    messageImages: Array<{ base64Data: string; mimeType: string; fileName: string }> | undefined
  ): Promise<boolean> {
    const userMessage = MessageService.createUserMessage(
      trimmedInput || (nextItem.attachedImages.length > 0
        ? `Analyze ${nextItem.attachedImages.length === 1 ? 'this image' : 'these images'}`
        : ''),
      undefined, undefined, messageImages
    );

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    if (queueProcessingAbortRef.current || currentProcessingItemIdRef.current !== nextItem.id) {
      setIsLoading(false);
      setQueue(prev => QueueService.updateItemStatus(prev, nextItem.id, 'cancelled'));
      queueProcessingAbortRef.current = false;
      return false;
    }

    let streamingCompleted = false;
    let streamingError = false;

    try {
      const sendUseCase = new SendMessageUseCase(
        messagesRef.current, currentSettings,
        (newCount) => setInputTokenCount(newCount),
        sessionId
      );
      await sendUseCase.execute(
        trimmedInput || (nextItem.attachedImages.length > 0
          ? `Analyze ${nextItem.attachedImages.length === 1 ? 'this image' : 'these images'}`
          : ''),
        (chunkText, isFirstChunk) => {
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
              messageRole, messageType, chunkText, getCurrentTimestamp(),
              undefined, undefined, messageRole === 'model' ? modelNameInUse : undefined
            );
            setMessages(prev => [...prev, newMessage]);
          } else {
            setMessages(prev => MessageService.updateLastMessage(prev, msg => {
              if (msg.role === messageRole || (isError && msg.role === 'system')) {
                return msg.withUpdatedText(msg.text + chunkText);
              }
              return msg;
            }));
          }
        },
        ({ sources, warningMessage } = {}) => {
          if (queueProcessingAbortRef.current || currentProcessingItemIdRef.current !== nextItem.id) {
            streamingError = true;
            return;
          }

          if (sources) {
            setMessages(prev => MessageService.updateLastMessage(prev, msg =>
              msg.role === 'model' ? msg.withSources(sources) : msg
            ));
          }

          if (warningMessage) {
            setMessages(prev => [...prev, MessageService.createSystemMessage(warningMessage)]);
          }

          setIsLoading(false);
          setIsStreaming(false);
          streamingCompleted = true;
        },
        undefined, undefined, messageImages
      );
    } catch {
      setIsLoading(false);
      setIsStreaming(false);
      streamingError = true;
    }

    if (streamingError) {
      if (queueProcessingAbortRef.current || currentProcessingItemIdRef.current !== nextItem.id) {
        setQueue(prev => QueueService.updateItemStatus(prev, nextItem.id, 'cancelled'));
        queueProcessingAbortRef.current = false;
        return false;
      }
      setQueue(prev => QueueService.updateItemStatus(prev, nextItem.id, 'cancelled'));
      return true;
    }

    if (!streamingCompleted) {
      setQueue(prev => QueueService.updateItemStatus(prev, nextItem.id, 'cancelled'));
      return true;
    }

    markCompleteAndRemove(nextItem.id);
    return true;
  }

  useEffect(() => {
    if (!bootedRef.current || isProcessingQueue) return;
    if (!QueueService.hasPendingItems(queueRef.current)) return;

    const id = setTimeout(() => {
      if (!isProcessingQueue && QueueService.hasPendingItems(queueRef.current)) {
        processQueue();
      }
    }, 100);

    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length, isProcessingQueue, processQueue]);

  return {
    messages,
    setMessages,
    initMessages,
    queue,
    enqueue,
    removeFromQueue,
    clearQueue,
    isProcessingQueue,
    isLoading,
    isStreaming,
    inputTokenCount,
  };
}
