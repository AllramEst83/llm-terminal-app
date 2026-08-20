import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  QueueItem,
  SYSTEM_PROMPTS,
} from '../../../domain';
import {
  ThemeService,
  CommandService,
  MessageService,
} from '../../../infrastructure/services';
import { getCurrentTimestamp } from '../../../domain/utils';
import {
  TerminalHeader,
  MessageList,
  TerminalInput,
  TerminalTabs,
  BootScreen,
  PressToBoot,
  QueueDisplay
} from './';
import { useSessionSettings } from '../../hooks/useSessionSettings';
import { useBootSequence } from '../../hooks/useBootSequence';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { useQueueProcessor } from '../../hooks/useQueueProcessor';
import type { AttachedImage, TerminalSessionProps } from '../../../types/ui/components';

const loadingChars = ['|', '/', '-', '\\'];

const isMobileDevice = (): boolean => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (window.visualViewport && window.visualViewport.height < window.innerHeight * 0.9) ||
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0);
};

export const TerminalSession: React.FC<TerminalSessionProps> = ({
  sessionId,
  isActive,
  isStudioEnv,
  isKeyReady,
  apiKey,
  onApiKeySubmit,
  onSelectKey,
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
}) => {
  const { settings, setSettings, theme } = useSessionSettings(sessionId, apiKey);
  const bootedRef = useRef(false);

  const handleSelectKey = useCallback(async () => {
    await onSelectKey();
  }, [onSelectKey]);

  const {
    messages, setMessages, initMessages, queue, enqueue,
    removeFromQueue, clearQueue, stopCurrentStreaming,
    isLoading, isStreaming, inputTokenCount,
  } = useQueueProcessor(sessionId, settings, setSettings, isStudioEnv, bootedRef, {
    onApiKeySubmit,
    onSelectKey: handleSelectKey,
  });

  const onBooted = useCallback((initialMessages: typeof messages) => {
    bootedRef.current = true;
    initMessages(initialMessages);
  }, [initMessages]);

  const { booting, booted, bootSequence, startBoot } = useBootSequence(
    isActive, isKeyReady, onBooted
  );

  useEffect(() => { bootedRef.current = booted; }, [booted]);

  const { scrollRef, scrollToBottom } = useAutoScroll(
    isActive ? [messages, isStreaming, bootSequence, isLoading] : []
  );

  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<ReturnType<typeof CommandService.getAllCommands>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const commandShortcuts = useMemo(
    () => {
      const all = CommandService.getAllCommands().sort((a, b) => a.name.localeCompare(b.name));
      if (!isKeyReady) {
        return all.filter(cmd => cmd.name === 'apikey');
      }
      return all;
    },
    [isKeyReady]
  );

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loadingCharIndex, setLoadingCharIndex] = useState(0);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const keyboardBaselineHeightRef = useRef<number | null>(null);

  // Apply theme when active
  useEffect(() => {
    if (!isActive) return;
    ThemeService.applyTheme(theme);
  }, [isActive, theme]);

  // Loading animation
  useEffect(() => {
    if (!isLoading) { setLoadingCharIndex(0); return; }
    const id = setInterval(() => setLoadingCharIndex(prev => (prev + 1) % loadingChars.length), 80);
    return () => clearInterval(id);
  }, [isLoading]);

  // Mobile keyboard handling
  useEffect(() => {
    if (!isActive) return;
    const rootElement = document.documentElement;
    const bodyElement = document.body;
    const rootDiv = document.getElementById('root');

    const unlockViewport = () => {
      bodyElement.style.position = '';
      bodyElement.style.top = '';
      bodyElement.style.left = '';
      bodyElement.style.width = '';
      bodyElement.style.overflow = '';
      bodyElement.style.removeProperty('overscroll-behavior');
      rootElement.style.removeProperty('overscroll-behavior');
      if (rootDiv) {
        rootDiv.style.position = '';
        rootDiv.style.top = '';
        rootDiv.style.left = '';
        rootDiv.style.right = '';
        rootDiv.style.transform = '';
        rootDiv.style.willChange = '';
      }
    };

    if (!isMobileDevice()) {
      setIsKeyboardVisible(false);
      keyboardBaselineHeightRef.current = null;
      rootElement.style.removeProperty('--viewport-height');
      rootElement.style.removeProperty('--viewport-offset-top');
      rootElement.style.removeProperty('--viewport-offset-left');
      rootElement.style.height = '';
      bodyElement.style.height = '';
      if (rootDiv) rootDiv.style.height = '';
      unlockViewport();
      return;
    }

    const updateViewportHeight = () => {
      const viewport = window.visualViewport;
      const visualHeight = viewport ? viewport.height : window.innerHeight;
      const offsetTop = viewport ? viewport.offsetTop : 0;
      const offsetLeft = viewport ? viewport.offsetLeft : 0;
      const layoutHeight = window.innerHeight;
      const baselineCandidate = Math.max(visualHeight, layoutHeight);

      rootElement.style.setProperty('--viewport-height', `${visualHeight}px`);
      rootElement.style.setProperty('--viewport-offset-top', `${offsetTop}px`);
      rootElement.style.setProperty('--viewport-offset-left', `${offsetLeft}px`);
      rootElement.style.height = `${visualHeight}px`;
      bodyElement.style.height = `${visualHeight}px`;
      if (rootDiv) rootDiv.style.height = `${visualHeight}px`;

      if (keyboardBaselineHeightRef.current === null || baselineCandidate > keyboardBaselineHeightRef.current) {
        keyboardBaselineHeightRef.current = baselineCandidate;
      }

      const isKeyboardOpen = keyboardBaselineHeightRef.current
        ? visualHeight < keyboardBaselineHeightRef.current * 0.75
        : false;
      setIsKeyboardVisible(isKeyboardOpen);

      if (isKeyboardOpen) {
        bodyElement.style.position = 'fixed';
        bodyElement.style.top = '0';
        bodyElement.style.left = '0';
        bodyElement.style.width = '100%';
        bodyElement.style.overflow = 'hidden';
        bodyElement.style.setProperty('overscroll-behavior', 'none');
        rootElement.style.setProperty('overscroll-behavior', 'none');
        if (rootDiv) {
          rootDiv.style.position = 'fixed';
          rootDiv.style.top = '0';
          rootDiv.style.left = '0';
          rootDiv.style.right = '0';
          rootDiv.style.transform = `translate(${offsetLeft}px, ${offsetTop}px)`;
          rootDiv.style.willChange = 'transform';
        }
      } else {
        unlockViewport();
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
      unlockViewport();
    };
  }, [isActive]);

  // Scroll input into view when keyboard opens (mobile)
  useEffect(() => {
    if (!isActive || !booted || !isMobileDevice()) return;

    const handleViewportChange = () => {
      if (!window.visualViewport) return;
      if (window.visualViewport.height < window.innerHeight * 0.75) {
        setTimeout(() => {
          const inputEl = document.querySelector('input');
          if (inputEl) {
            inputEl.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
          }
        }, 150);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => window.visualViewport?.removeEventListener('resize', handleViewportChange);
    }
  }, [booted, isActive]);



  const handleImageAttach = useCallback((image: AttachedImage) => {
    setAttachedImages(prev => [...prev, image]);
  }, []);

  const handleImageRemove = useCallback((index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleImageError = useCallback((errorMessage: string) => {
    const errorMsg = MessageService.createErrorMessage(`SYSTEM ERROR: ${errorMessage}`);
    setMessages(prev => [...prev, errorMsg]);
  }, [setMessages]);

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if (trimmedInput === '' && attachedImages.length === 0) return;

    const isCommand = CommandService.isCommand(trimmedInput);
    const queueItem = QueueItem.create(
      trimmedInput || (attachedImages.length > 0
        ? `Analyze ${attachedImages.length === 1 ? 'this image' : 'these images'}`
        : ''),
      isCommand ? 'command' : 'message',
      [...attachedImages]
    );

    enqueue(queueItem);

    if (trimmedInput !== commandHistory[0]) {
      setCommandHistory(prev => [trimmedInput, ...prev].slice(0, 50));
    }
    setHistoryIndex(-1);
    setInput('');
    setAttachedImages([]);
  }, [input, attachedImages, commandHistory, enqueue]);

  const handleSuggestionClick = useCallback((command: string) => {
    setInput(`/${command} `);
    setShowSuggestions(false);
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    setHistoryIndex(-1);
    if (value.startsWith('/')) {
      const commandPart = value.substring(1).toLowerCase();
      let filtered = CommandService.findMatchingCommands(commandPart);
      if (!isKeyReady) {
        filtered = filtered.filter(cmd => cmd.name === 'apikey');
      }
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setActiveSuggestionIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, [isKeyReady]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
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
  }, [commandHistory, historyIndex, showSuggestions]);

  const renderContent = () => {
    if (booting) return <BootScreen sequence={bootSequence} theme={theme} />;
    if (!booted) return <PressToBoot theme={theme} />;

    return (
      <>
        <MessageList messages={messages} isStreaming={isStreaming} theme={theme} fontSize={settings.fontSize} onImageLoad={scrollToBottom} />
        {isLoading && (
          <div className="flex items-center">
            <span className="mr-2" style={{ color: theme.accent, opacity: 0.6 }}>{getCurrentTimestamp()}</span>
            <span style={{ color: theme.prompt }}>{'> '}</span>
            <span className="ml-2">CONNECTING..... [<span className="loading-char">{loadingChars[loadingCharIndex]}</span>]</span>
          </div>
        )}
      </>
    );
  };

  const systemInfoVisible = booted;

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ display: isActive ? 'flex' : 'none', height: '100%' }}
      aria-hidden={!isActive}
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
        <TerminalTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={onSelectTab}
          onCloseTab={onCloseTab}
          onNewTab={onNewTab}
          theme={theme}
        />
        <TerminalHeader
          theme={theme}
          modelName={settings.modelName}
          thinkingEnabled={settings.getThinkingSettingsForModel(settings.modelName).enabled}
          inputTokenCount={inputTokenCount}
          systemInfoVisible={systemInfoVisible}
          systemPromptId={settings.systemPromptId}
          systemPromptOptions={SYSTEM_PROMPTS}
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
              disabled={!isActive}
              autoFocus={isActive}
              attachedImages={attachedImages}
              onImageAttach={handleImageAttach}
              onImageRemove={handleImageRemove}
              maxImages={10}
              onError={handleImageError}
              isStreaming={isStreaming}
              onStopStreaming={stopCurrentStreaming}
            />
          </>
        )}
      </div>
    </div>
  );
};
