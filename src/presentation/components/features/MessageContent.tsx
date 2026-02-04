import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { MessageContentProps, CodeBlockProps } from '../../../types/ui/components';

declare const hljs: unknown;

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, accentColor, backgroundColor, textColor }) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const codeRef = useRef<HTMLElement>(null);

  // Fallback copy method using execCommand (for older browsers/mobile)
  const copyWithExecCommand = (text: string): boolean => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');
      textArea.setAttribute('aria-hidden', 'true');
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // For iOS Safari
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textArea.setSelectionRange(0, text.length);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return successful;
    } catch (err) {
      console.error('execCommand copy failed:', err);
      return false;
    }
  };

  // Copy text to clipboard with multiple fallback methods
  const copyToClipboard = async (text: string): Promise<boolean> => {
    // Method 1: Modern Clipboard API (preferred)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('Clipboard API failed, trying fallback:', err);
        // Fall through to fallback method
      }
    }
    
    // Method 2: execCommand fallback (for older browsers/mobile)
    return copyWithExecCommand(text);
  };

  // Handle copy button click/touch
  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const success = await copyToClipboard(code);
    
    if (success) {
      setCopied(true);
      
      // Clear existing timeout if any
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Reset to "Copy" state after 2 seconds
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } else {
      // Last resort: show code in alert for user to manually copy
      console.error('All copy methods failed');
      // Note: Alert is commented out as it's intrusive, but can be enabled if needed
      // alert('Copy failed. Please select and copy manually:\n\n' + code);
    }
  };

  // Apply syntax highlighting
  useEffect(() => {
    if (typeof hljs !== 'undefined' && codeRef.current && !codeRef.current.classList.contains('hljs')) {
      hljs.highlightElement(codeRef.current);
    }
  }, [code, language]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative my-3">
      <pre 
        className="rounded overflow-x-auto" 
        style={{ 
          backgroundColor: '#1a1a1a',
          border: `1px solid ${accentColor}40`,
          padding: '0.75rem'
        }}
      >
        <code 
          ref={codeRef}
          className={`language-${language}`} 
          style={{ 
            display: 'block',
            fontSize: '0.9em',
            lineHeight: '1.5'
          }}
        >
          {code}
        </code>
      </pre>
      <div className="flex justify-end mt-1">
        <button
          onClick={handleCopy}
          onTouchEnd={handleCopy}
          type="button"
          aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
          className="px-2 py-1 text-xs uppercase focus:outline-none transition-opacity hover:opacity-80 active:opacity-70"
          style={{
            backgroundColor: accentColor,
            color: backgroundColor,
            border: `1px solid ${accentColor}60`,
            cursor: 'pointer',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'manipulation',
            minWidth: '60px'
          }}
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

export const MessageContent: React.FC<MessageContentProps> = React.memo(({ text, theme }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Apply syntax highlighting after render
  useEffect(() => {
    if (typeof hljs !== 'undefined' && contentRef.current) {
      contentRef.current.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [text]);

  const textColor = theme?.text || '#00FF41';
  const accentColor = theme?.accent || '#00A800';
  const backgroundColor = theme?.background || '#0D0D0D';
  const promptColor = theme?.prompt || '#FFD700';

  // Helper to create styled components with consistent patterns
  const createHeader = (level: 1 | 2 | 3 | 4 | 5 | 6, className: string) => 
    ({ children }: { children: React.ReactNode }) => {
      const Component = `h${level}` as keyof JSX.IntrinsicElements;
      const hasBorder = level <= 2;
      return (
        <Component 
          className={`${className} ${hasBorder ? 'border-b pb-1' : ''}`} 
          style={{ 
            color: textColor, 
            ...(hasBorder && { borderColor: accentColor })
          }}
        >
          {children}
        </Component>
      );
    };

  return (
    <div ref={contentRef} className="message-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml={false}
        components={{
          // Headers
          h1: createHeader(1, 'text-2xl font-bold mb-2 mt-4 first:mt-0'),
          h2: createHeader(2, 'text-xl font-bold mb-2 mt-3 first:mt-0'),
          h3: createHeader(3, 'text-lg font-bold mb-1 mt-2 first:mt-0'),
          h4: createHeader(4, 'text-base font-bold mb-1 mt-2 first:mt-0'),
          h5: createHeader(5, 'text-sm font-bold mb-1 mt-2 first:mt-0'),
          h6: createHeader(6, 'text-xs font-bold mb-1 mt-2 first:mt-0'),
          
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2 leading-relaxed" style={{ color: textColor }}>
              {children}
            </p>
          ),
          
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-outside mb-2 ml-6 space-y-1" style={{ color: textColor }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1" style={{ color: textColor }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-2" style={{ color: textColor, display: 'list-item' }}>
              {children}
            </li>
          ),
          
          // Code blocks
          pre: ({ children }) => {
            const codeElement = React.Children.only(children) as React.ReactElement<any>;
            const codeProps = codeElement?.props || {};
            const className = codeProps.className || '';
            const language = className.replace('language-', '') || 'plaintext';
            const code = String(codeProps.children || '').replace(/\n$/, '');
            
            return (
              <CodeBlock
                code={code}
                language={language}
                accentColor={accentColor}
                backgroundColor={backgroundColor}
                textColor={textColor}
              />
            );
          },
          
          // Inline code
          code: ({ inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code 
                  className="px-1.5 py-0.5 rounded text-sm font-mono" 
                  style={{ 
                    backgroundColor: `${accentColor}20`,
                    color: promptColor,
                    border: `1px solid ${accentColor}40`
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <code className={className} {...props}>{children}</code>;
          },
          
          // Links
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              className="underline hover:opacity-75 transition-opacity"
              style={{ color: accentColor }}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote 
              className="border-l-4 pl-4 my-2 italic opacity-90" 
              style={{ 
                borderColor: accentColor,
                color: textColor
              }}
            >
              {children}
            </blockquote>
          ),
          
          // Horizontal rule
          hr: () => (
            <hr 
              className="my-4 border-0 border-t" 
              style={{ 
                borderTopColor: `${accentColor}60`
              }}
            />
          ),
          
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table 
                className="border-collapse w-full" 
                style={{ 
                  border: `1px solid ${accentColor}60`
                }}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{ backgroundColor: `${accentColor}20` }}>
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody>
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr 
              className="border-b" 
              style={{ 
                borderBottomColor: `${accentColor}40`
              }}
            >
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th 
              className="px-3 py-2 text-left font-bold border-r" 
              style={{ 
                color: textColor,
                borderRightColor: `${accentColor}40`
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td 
              className="px-3 py-2 border-r" 
              style={{ 
                color: textColor,
                borderRightColor: `${accentColor}40`
              }}
            >
              {children}
            </td>
          ),
          
          // Strong and emphasis
          strong: ({ children }) => (
            <strong className="font-bold" style={{ color: textColor }}>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic" style={{ color: textColor }}>
              {children}
            </em>
          ),
          
          // Strikethrough
          del: ({ children }) => (
            <del className="line-through opacity-70" style={{ color: textColor }}>
              {children}
            </del>
          ),
          
          // Text node handler - ensures markdown syntax is properly parsed
          text: ({ children }) => <>{children}</>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
});

MessageContent.displayName = 'MessageContent';
