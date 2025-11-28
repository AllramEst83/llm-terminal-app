import React from 'react';
import type { ImageDisplayProps } from '../../../types/ui/components';

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ base64Image, prompt, theme, onImageLoad }) => {
  const imageUrl = `data:image/png;base64,${base64Image}`;
  const textColor = theme?.text || '#00FF41';
  const accentColor = theme?.accent || '#00A800';
  const backgroundColor = theme?.background || '#0D0D0D';

  const extractPrompt = (text: string): string => {
    const match = text.match(/Generated image for: "(.+)"/);
    return match ? match[1] : text;
  };

  const actualPrompt = extractPrompt(prompt);

  const handleDownload = (): void => {
    const link = document.createElement('a');
    link.href = imageUrl;
    const safePrompt = actualPrompt.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safePrompt.slice(0, 30) || 'generated'}-image.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="mt-2 p-2 border rounded max-w-sm"
      style={{
        borderColor: accentColor,
        backgroundColor: `${accentColor}20`,
      }}
    >
      <p 
        className="mb-2"
        style={{ color: textColor }}
      >
        Generated image for: "{actualPrompt}"
      </p>
      <img 
        src={imageUrl} 
        alt={actualPrompt} 
        className="w-full h-auto rounded object-cover" 
        style={{
          border: `1px solid ${accentColor}40`
        }}
        onLoad={() => {
          requestAnimationFrame(() => {
            onImageLoad?.();
          });
        }}
      />
      <button
        onClick={handleDownload}
        className="mt-2 w-full font-bold py-1 px-2 rounded transition-colors duration-200 hover:opacity-80"
        style={{
          backgroundColor: accentColor,
          color: backgroundColor,
          border: `1px solid ${accentColor}60`
        }}
      >
        Download Image
      </button>
    </div>
  );
};

