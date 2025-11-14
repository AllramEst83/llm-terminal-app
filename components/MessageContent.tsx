import React from 'react';

interface MessageContentProps {
  text: string;
}

export const MessageContent: React.FC<MessageContentProps> = React.memo(({ text }) => {
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

