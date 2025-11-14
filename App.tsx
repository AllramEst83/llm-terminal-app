import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Message } from './types';
import { sendMessageToGemini } from './services/geminiService';

// Tell TypeScript that hljs is available globally.
declare const hljs: any;

const getCurrentTimestamp = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `[${hours}:${minutes}:${seconds}]`;
};

const INITIAL_MESSAGE_DATA: Omit<Message, 'id' | 'timestamp'> = { role: 'system', text: '* Google Gemini v1.5 (Flash Edition) *\n* MEMORY: 640K RAM OK *\n* SYSTEM READY. *\n\nAwaiting your command...' };

const getInitialMessages = (): Message[] => [
    { ...INITIAL_MESSAGE_DATA, id: 'init1', timestamp: getCurrentTimestamp() }
];


const BOOT_MESSAGES = [
    { text: 'GEMINI BIOS v1.5.0 (c) 1988 Google AI Corp.', delay: 200 },
    { text: 'Initializing...', delay: 500 },
    { text: 'Checking Memory: 640K RAM...... OK', delay: 800 },
    { text: 'Initializing Network Card...', delay: 300 },
    { text: '  - MAC Address: 00:DE:AD:BE:EF:00', delay: 150 },
    { text: '  - Establishing connection to host...', delay: 1000 },
    { text: 'Connection Established.', delay: 200 },
    { text: 'Loading GEMINI OS...', delay: 600 },
    { text: 'Welcome.', delay: 400 },
];

const THEMES = {
  classic: { name: 'Classic', background: '#0D0D0D', text: '#00FF41', accent: '#00A800', prompt: '#00A800', headerBg: '#4A4A4A', headerText: '#00FF41', system: '#00FF41' },
  amber: { name: 'Amber', background: '#1A0B00', text: '#FFB000', accent: '#FFB000', prompt: '#FFB000', headerBg: '#4A2B00', headerText: '#FFD061', system: '#FFB000' },
  'mono-blue': { name: 'Monochrome Blue', background: '#000D1A', text: '#00BFFF', accent: '#00BFFF', prompt: '#00BFFF', headerBg: '#002C4A', headerText: '#61D9FF', system: '#00BFFF' },
  hacker: { name: 'Hacker', background: '#000000', text: '#39FF14', accent: '#39FF14', prompt: '#39FF14', headerBg: '#333333', headerText: '#39FF14', system: '#39FF14' },
  vt100: { name: 'VT100', background: '#000000', text: '#FFFFFF', accent: '#CCCCCC', prompt: '#FFFFFF', headerBg: '#4A4A4A', headerText: '#FFFFFF', system: '#FFFFFF' },
  unicorn: { name: '80s Unicorn', background: '#2c002c', text: '#ff79c6', accent: '#8be9fd', prompt: '#ff79c6', headerBg: '#1d1f4d', headerText: '#f1fa8c', system: '#8be9fd' },
  dos: { name: 'DOS', background: '#0000A8', text: '#FFFFFF', accent: '#CCCCCC', prompt: '#FFFF00', headerBg: '#000080', headerText: '#FFFFFF', system: '#FFFF00' },
  cga: { name: 'CGA', background: '#000000', text: '#55FFFF', accent: '#FF55FF', prompt: '#FFFFFF', headerBg: '#555555', headerText: '#FFFFFF', system: '#FF55FF' },
  'rose-pine': { name: 'Rosé Pine', background: '#191724', text: '#e0def4', accent: '#eb6f92', prompt: '#c4a7e7', headerBg: '#26233a', headerText: '#f0c6c6', system: '#9ccfd8' },
};
type Theme = typeof THEMES.classic;
type ThemeName = keyof typeof THEMES;


const COMMANDS = [
  { name: 'clear', description: 'Clears the terminal screen.' },
  { name: 'search', description: 'Searches the web (e.g., /search latest news).' },
  { name: 'settings', description: 'Displays current settings.' },
  { name: 'font', description: 'Sets font size (e.g., /font 18).' },
  { name: 'theme', description: 'Changes color scheme (e.g., /theme amber).' },
  { name: 'reset', description: 'Resets all settings to their default values.' },
  { name: 'help', description: 'Shows this list of commands.' },
];

const DEFAULT_FONT_SIZE = 16;
const DEFAULT_THEME_NAME: ThemeName = 'classic';

const MessageContent: React.FC<{ text: string }> = React.memo(({ text }) => {
  // Regex to split by code blocks (block and inline) first.
  const mainParts = text.split(/(```(?:[a-zA-Z0-9]+)?\n[\s\S]*?\n```|`[^`]+`)/g);

  // A function to parse a text string for simple markdown.
  const renderMarkdown = (markdownText: string, keyPrefix: string) => {
    // Regex to split by markdown, keeping the delimiters.
    // Handles: **bold**, __bold__, *italic*, _italic_, ~~strikethrough~~
    const mdParts = markdownText.split(/(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|~~.*?~~)/g);

    return mdParts.filter(Boolean).map((part, index) => {
      const key = `${keyPrefix}-${index}`;
      
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
        return <strong key={key}>{part.substring(2, part.length - 2)}</strong>;
      }
      if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
        return <em key={key}>{part.substring(1, part.length - 1)}</em>;
      }
      if (part.startsWith('~~') && part.endsWith('~~')) {
        return <s key={key}>{part.substring(2, part.length - 2)}</s>;
      }
      // It's just a plain text part.
      return part;
    });
  };

  return (
    <>
      {mainParts.filter(Boolean).map((part, index) => {
        const key = `main-${index}`;

        // Check for block code
        const blockMatch = part.match(/^```([a-zA-Z0-9]+)?\n([\s\S]*?)\n```$/);
        if (blockMatch) {
          const language = blockMatch[1] || 'plaintext';
          const code = blockMatch[2];
          return (
            <pre key={key} className="my-1">
              <code className={`language-${language}`}>{code}</code>
            </pre>
          );
        }
        
        // Check for inline code
        const inlineMatch = part.match(/^`([^`]+)`$/);
        if (inlineMatch) {
            return <code key={key} className="bg-green-900 text-yellow-300 px-1 py-0.5">{inlineMatch[1]}</code>
        }

        // Regular text part, process for markdown
        return <span key={key}>{renderMarkdown(part, `part-${index}`)}</span>;
      })}
    </>
  );
});

const TerminalHeader: React.FC<{ theme: Theme }> = ({ theme }) => (
  <div 
    className="p-2 flex items-center justify-between border-b-2 header-lines"
    style={{ backgroundColor: theme.headerBg, color: theme.headerText, borderColor: theme.accent }}
  >
    <span className="text-lg">C:\\> GEMINI_CHAT.EXE</span>
    <div className="flex space-x-2">
      <div className="w-4 h-4 border flex items-center justify-center text-xs" style={{ borderColor: theme.text }}>_</div>
      <div className="w-4 h-4 border flex items-center justify-center text-xs" style={{ borderColor: theme.text }}>[]</div>
      <div className="w-4 h-4 bg-red-500 border flex items-center justify-center text-xs text-white" style={{ borderColor: theme.text }}>X</div>
    </div>
  </div>
);

const CommandSuggestions: React.FC<{
  suggestions: typeof COMMANDS;
  activeIndex: number;
  onSelect: (command: string) => void;
  theme: Theme;
}> = ({ suggestions, activeIndex, onSelect, theme }) => (
    <div 
      className="absolute bottom-full left-0 right-0 border-2 p-1 mb-1 z-10"
      style={{ backgroundColor: theme.background, borderColor: theme.accent }}
    >
        <ul>
            {suggestions.map((suggestion, index) => {
                const isActive = index === activeIndex;
                const style = {
                    backgroundColor: isActive ? theme.text : 'transparent',
                    color: isActive ? theme.background : theme.text,
                };
                return (
                    <li
                        key={suggestion.name}
                        className={`cursor-pointer px-2 py-1 flex justify-between`}
                        style={style}
                        onClick={() => onSelect(suggestion.name)}
                    >
                       <span>/<span className="font-bold">{suggestion.name}</span></span>
                       <span style={{ opacity: isActive ? 1 : 0.6 }}>{suggestion.description}</span>
                    </li>
                );
            })}
        </ul>
    </div>
);

const BootScreen: React.FC<{ sequence: string[], theme: Theme }> = ({ sequence, theme }) => (
    <div className="p-4 whitespace-pre-wrap" style={{ color: theme.system }}>
        {sequence.map((line, index) => (
            <div key={index}>{line}</div>
        ))}
        <div className="flex items-center">
            <span style={{ backgroundColor: theme.text }} className="w-3 h-5 inline-block cursor-blink"></span>
        </div>
    </div>
);

const PressToBootUI: React.FC<{ theme: Theme }> = ({ theme }) => (
    <div className="p-4 whitespace-pre-wrap flex flex-col items-center justify-center h-full">
      <div style={{ color: theme.system }}>SYSTEM READY. API KEY DETECTED.</div>
      <div className="mt-4 flex items-center">
        <span style={{ color: theme.prompt }} className="mr-2">></span>
        <span className="uppercase">Press any key to boot</span>
        <span style={{ backgroundColor: theme.text }} className="w-3 h-5 inline-block cursor-blink ml-2"></span>
      </div>
    </div>
);

export const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  
  // Environment and API Key State
  const [isStudioEnv, setIsStudioEnv] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeyReady, setIsKeyReady] = useState(false);
  
  // Boot sequence state management
  const [booting, setBooting] = useState<boolean>(false);
  const [booted, setBooted] = useState<boolean>(false);
  const [bootSequence, setBootSequence] = useState<string[]>([]);
  
  const [fontSize, setFontSize] = useState<number>(() => {
    try {
        const saved = localStorage.getItem('terminal_fontSize');
        return saved ? JSON.parse(saved) : DEFAULT_FONT_SIZE;
    } catch { return DEFAULT_FONT_SIZE; }
  });
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    try {
        const saved = localStorage.getItem('terminal_themeName') as ThemeName;
        return saved && THEMES[saved] ? saved : DEFAULT_THEME_NAME;
    } catch { return DEFAULT_THEME_NAME; }
  });
  const [theme, setTheme] = useState<Theme>(() => THEMES[themeName]);
  
  const [suggestions, setSuggestions] = useState<typeof COMMANDS>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(0);
  
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // --- Effects for Local Storage Persistence ---
  useEffect(() => {
    localStorage.setItem('terminal_fontSize', JSON.stringify(fontSize));
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('terminal_themeName', themeName);
    setTheme(THEMES[themeName]);
  }, [themeName]);

  useEffect(() => {
    document.documentElement.style.setProperty('--scrollbar-thumb-color', theme.accent);
    document.documentElement.style.setProperty('--scrollbar-track-color', theme.headerBg);
  }, [theme]);

  useEffect(() => {
    if (!isStudioEnv && apiKey) {
        localStorage.setItem('terminal_apiKey', apiKey);
    }
  }, [apiKey, isStudioEnv]);

  // --- Effects for Boot Sequence and App Initialization ---
  useEffect(() => {
    const initApp = async () => {
      const isStudio = !!(window as any).aistudio;
      setIsStudioEnv(isStudio);

      if (isStudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setIsKeyReady(hasKey);
      } else {
        const savedKey = localStorage.getItem('terminal_apiKey');
        if (savedKey) {
          setApiKey(savedKey);
          setIsKeyReady(true);
        } else {
          setIsKeyReady(false);
        }
      }
    };
    initApp();
  }, []);
  
  // Effect to start boot sequence on user interaction if key is present on load
  useEffect(() => {
    if (!isKeyReady || booting || booted) return;

    const startBootProcess = () => {
        setBooting(true);
        window.removeEventListener('keydown', startBootProcess);
        window.removeEventListener('click', startBootProcess);
    }
    
    window.addEventListener('keydown', startBootProcess);
    window.addEventListener('click', startBootProcess);

    return () => {
        window.removeEventListener('keydown', startBootProcess);
        window.removeEventListener('click', startBootProcess);
    }
  }, [isKeyReady, booting, booted]);
  
  // Main boot sequence animation effect
  useEffect(() => {
    if (!booting) return;

    let currentTimeout: number;
    const runBootSequence = (index = 0) => {
        if (index < BOOT_MESSAGES.length) {
            currentTimeout = window.setTimeout(() => {
                setBootSequence(prev => [...prev, BOOT_MESSAGES[index].text]);
                runBootSequence(index + 1);
            }, BOOT_MESSAGES[index].delay);
        } else {
             currentTimeout = window.setTimeout(() => {
                setBooting(false);
                setBooted(true);
                setMessages(getInitialMessages());
            }, 500);
        }
    };
    runBootSequence();
    return () => clearTimeout(currentTimeout);
  }, [booting]);

  useEffect(() => {
    if (typeof hljs !== 'undefined') {
        // Don't highlight while streaming, as it's incomplete and inefficient.
        if (isStreaming) return;
        
        scrollRef.current?.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
             hljs.highlightElement(block as HTMLElement);
        });
    }
  }, [messages, isStreaming]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView();
  }, [messages, isStreaming, bootSequence]);
  
  useEffect(() => {
    if (!isLoading && !isStreaming) {
      inputRef.current?.focus();
    }
  }, [isLoading, isStreaming, messages, booted]);

  const handleSelectKey = async () => {
    await (window as any).aistudio.openSelectKey();
    setIsKeyReady(true);
    // User interaction has occurred, so we can start booting immediately.
    setBooting(true);
  };
  
  const handleApiKeySubmit = (submittedKey: string) => {
    setApiKey(submittedKey);
    setIsKeyReady(true);
    setBooting(true); // Start booting right away
  };


  const handleSendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if (trimmedInput === '' || isLoading || isStreaming) return;
    
    const keyForApi = isStudioEnv ? (process.env.API_KEY || '') : apiKey;
    if (!keyForApi) {
        const errorMsg: Message = { id: Date.now().toString(), role: 'system', text: "SYSTEM ERROR: API Key is missing. Please reset the app.", timestamp: getCurrentTimestamp() };
        setMessages(prev => [...prev, errorMsg]);
        return;
    }

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: trimmedInput, timestamp: getCurrentTimestamp() };
    
    // Always add to history, even commands
    if (trimmedInput !== commandHistory[0]) {
        setCommandHistory(prev => [trimmedInput, ...prev].slice(0, 50)); // Keep last 50
    }
    setHistoryIndex(-1);
    

    if (trimmedInput.startsWith('/')) {
      const parts = trimmedInput.substring(1).toLowerCase().split(' ');
      const command = parts[0];
      
      if (command !== 'search') {
        const args = parts.slice(1);
        let systemResponseText = '';

        if (command === 'clear') {
          setMessages(getInitialMessages());
          setInput('');
          return;
        } else if (command === 'settings') {
          systemResponseText = `CURRENT SETTINGS:
-----------------
FONT SIZE: ${fontSize}px
THEME:     ${themeName.toUpperCase()}`;
        } else if (command === 'font') {
          const size = parseInt(args[0], 10);
          if (!isNaN(size) && size >= 8 && size <= 48) {
            setFontSize(size);
            systemResponseText = `SYSTEM: Font size set to ${size}px.`;
          } else {
            systemResponseText = 'SYSTEM ERROR: Invalid font size. Use a number between 8 and 48. (e.g., /font 18)';
          }
        } else if (command === 'theme') {
          const requestedTheme = args[0] as ThemeName;
          if (requestedTheme && THEMES[requestedTheme]) {
              setThemeName(requestedTheme);
              systemResponseText = `SYSTEM: Theme set to ${requestedTheme.toUpperCase()}.`;
          } else if (!requestedTheme) {
              systemResponseText = `Available themes:\n${Object.keys(THEMES).join(', ')}\n\nUsage: /theme <theme_name>`;
          } else {
              systemResponseText = `SYSTEM ERROR: Theme "${requestedTheme}" not found.`;
          }
        } else if (command === 'reset') {
          localStorage.removeItem('terminal_fontSize');
          localStorage.removeItem('terminal_themeName');
          if (!isStudioEnv) {
              localStorage.removeItem('terminal_apiKey');
              setApiKey('');
              setIsKeyReady(false);
          }
          setFontSize(DEFAULT_FONT_SIZE);
          setThemeName(DEFAULT_THEME_NAME);
          systemResponseText = 'SYSTEM: All settings have been reset to default.';
          const responseMessage: Message = {
            id: Date.now().toString(),
            role: 'system',
            text: systemResponseText,
            timestamp: getCurrentTimestamp()
          };
          setMessages(prev => [...prev, userMessage, responseMessage]);
          setInput('');
          return;

        } else if (command === 'help' || command === '') {
          const commandList = COMMANDS.map(cmd => `  /${cmd.name.padEnd(15, ' ')} - ${cmd.description}`).join('\n');
          systemResponseText = `Available commands:\n${commandList}`;
        } else {
          systemResponseText = `COMMAND NOT FOUND: /${command}\nType /help for a list of commands.`;
        }

        if (systemResponseText) {
            const responseMessage: Message = {
                id: Date.now().toString(),
                role: 'system',
                text: systemResponseText,
                timestamp: getCurrentTimestamp()
            };
            setMessages(prev => [...prev, userMessage, responseMessage]);
        }
        setInput('');
        return;
      }
    }

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    await sendMessageToGemini(
        [...messages, userMessage],
        trimmedInput,
        keyForApi,
        (chunkText, isFirstChunk) => {
            if (isFirstChunk) {
                setIsLoading(false);
                setIsStreaming(true);
                const modelMessageId = (Date.now() + 1).toString();
                setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: chunkText, timestamp: getCurrentTimestamp() }]);
            } else {
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg?.role === 'model') {
                        lastMsg.text += chunkText;
                    }
                    return newMessages;
                });
            }
        },
        (sources) => {
            if (sources) {
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg?.role === 'model') {
                        lastMsg.sources = sources;
                    }
                    return newMessages;
                });
            }
            setIsLoading(false);
            setIsStreaming(false);
        }
    );
  }, [input, isLoading, isStreaming, messages, fontSize, themeName, commandHistory, apiKey, isStudioEnv]);

  const handleSuggestionClick = (command: string) => {
    setInput(`/${command} `);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setHistoryIndex(-1); // Reset history navigation on new input

    if (value.startsWith('/')) {
        const commandPart = value.substring(1).toLowerCase();
        const filtered = COMMANDS.filter(cmd => cmd.name.startsWith(commandPart));
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setActiveSuggestionIndex(0);
    } else {
        setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Command History Navigation
    if (commandHistory.length > 0 && !showSuggestions) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
            setHistoryIndex(newIndex);
            setInput(commandHistory[newIndex]);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newIndex = Math.max(historyIndex - 1, -1);
            setHistoryIndex(newIndex);
            setInput(newIndex === -1 ? '' : commandHistory[newIndex]);
        }
    }
    
    if (showSuggestions && suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Tab' || e.key === 'Enter') {
            if (activeSuggestionIndex >= 0) {
                 e.preventDefault();
                 handleSuggestionClick(suggestions[activeSuggestionIndex].name);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setShowSuggestions(false);
        }
    }

    if (e.key === 'Enter' && !showSuggestions) {
      handleSendMessage();
    }
  };
  
  const ApiKeySelectionUI = () => (
    <div className="p-4">
      <div className="whitespace-pre-wrap">
        SYSTEM: API Key not selected.
        {'\n'}
        Please select a Google AI Studio API Key to continue.
        {'\n\n'}
        This app uses the Gemini API. For more information on billing, see ai.google.dev/gemini-api/docs/billing.
      </div>
      <div className="mt-4 flex items-center">
        <span style={{ color: theme.prompt }} className="mr-2">></span>
        <button 
          onClick={handleSelectKey}
          style={{ backgroundColor: theme.accent, color: theme.background }}
          className="px-2 focus:outline-none uppercase"
        >
          Select API Key
        </button>
        <span style={{ backgroundColor: theme.text }} className="w-3 h-5 inline-block cursor-blink ml-2"></span>
      </div>
    </div>
  );
  
  const ApiKeyInputUI: React.FC<{ onApiKeySubmit: (key: string) => void; theme: Theme }> = ({ onApiKeySubmit, theme }) => {
    const [localApiKey, setLocalApiKey] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (localApiKey.trim()) {
            onApiKeySubmit(localApiKey.trim());
        }
    };
    
    return (
        <div className="p-4">
            <div className="whitespace-pre-wrap">
                SYSTEM: Google AI API Key not found.
                {'\n'}
                Please paste your API key below and press Enter.
                {'\n\n'}
                You can get a key from Google AI Studio.
                {'\n'}
                This app uses the Gemini API. For more information on billing, see ai.google.dev/gemini-api/docs/billing.
            </div>
            <form onSubmit={handleSubmit} className="mt-4 flex items-center">
                 <span style={{ color: theme.prompt }} className="mr-2">></span>
                 <input
                    ref={inputRef}
                    type="password"
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    className="bg-transparent border-none w-full focus:outline-none"
                    style={{ color: theme.text }}
                    autoFocus
                    placeholder="Paste your API key here..."
                 />
            </form>
        </div>
    );
  };

  const renderContent = () => {
    if (!isKeyReady) {
      return isStudioEnv 
        ? <ApiKeySelectionUI /> 
        : <ApiKeyInputUI onApiKeySubmit={handleApiKeySubmit} theme={theme} />;
    }
    if (booting) return <BootScreen sequence={bootSequence} theme={theme} />;
    if (!booted) return <PressToBootUI theme={theme} />;

    return (
        <>
          {messages.map((msg, index) => (
            <div key={msg.id} className="mb-2 whitespace-pre-wrap" style={msg.role === 'system' ? { color: theme.system } : {}}>
              <span className="mr-2" style={{ color: theme.accent, opacity: 0.6 }}>{msg.timestamp}</span>
              {msg.role === 'user' ? 
                <span style={{ color: theme.prompt }} > > </span>
                : <span className="mr-1"></span>
              }
              <MessageContent text={msg.text} />
              
              {msg.sources && msg.sources.length > 0 && index === messages.length - 1 && !isStreaming && (
                <div className="mt-2 text-sm" style={{ color: theme.accent }}>
                  <div>SOURCES:</div>
                  <ul className="list-none pl-4">
                    {msg.sources.map((source, i) => (
                      <li key={`${msg.id}-source-${i}`} className="truncate">
                        <span>[{i + 1}] </span>
                        <a
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:opacity-75"
                        >
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isStreaming && msg.role === 'model' && index === messages.length - 1 && (
                <span style={{ backgroundColor: theme.text }} className="w-3 h-5 inline-block cursor-blink ml-1 align-middle"></span>
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-center">
                <span className="mr-2" style={{ color: theme.accent, opacity: 0.6 }}>{getCurrentTimestamp()}</span>
                <span style={{ color: theme.prompt }}>> </span>
                <span className="ml-2">CONNECTING...</span>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </>
      );
  }

  return (
    <div className="h-full flex flex-col p-4 sm:p-8">
      <div 
        className="w-full h-full shadow-lg flex flex-col relative"
        style={{ 
          fontSize: `${fontSize}px`,
          backgroundColor: theme.background,
          color: theme.text,
          boxShadow: `0 0 15px ${theme.accent}33`
        }}
      >
        <TerminalHeader theme={theme} />
        <div 
          ref={scrollRef}
          className="flex-grow p-4 overflow-y-auto relative scan-lines"
          style={{ borderRight: `4px solid ${theme.accent}` }}
          onClick={() => booted && inputRef.current?.focus()}
        >
          {renderContent()}
        </div>
        {booted && (
          <div className="p-2 border-t-2 flex items-center relative" style={{ borderColor: theme.accent }}>
             {showSuggestions && suggestions.length > 0 && (
                <CommandSuggestions
                    suggestions={suggestions}
                    activeIndex={activeSuggestionIndex}
                    onSelect={handleSuggestionClick}
                    theme={theme}
                />
            )}
            <span style={{ color: theme.prompt }} className="mr-2">></span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none w-full focus:outline-none"
              style={{ color: theme.text }}
              autoFocus
              disabled={isLoading || isStreaming}
              autoComplete="off"
            />
          </div>
        )}
      </div>
    </div>
  );
};