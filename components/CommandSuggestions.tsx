import React, { useRef, useEffect } from 'react';
import type { CommandDefinition } from '../domain/Command';
import type { ThemeColors } from '../domain/Theme';

interface CommandSuggestionsProps {
  suggestions: CommandDefinition[];
  activeIndex: number;
  onSelect: (command: string) => void;
  theme: ThemeColors;
}

export const CommandSuggestions: React.FC<CommandSuggestionsProps> = ({ 
  suggestions, 
  activeIndex, 
  onSelect, 
  theme 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (activeItemRef.current && containerRef.current) {
      const activeElement = activeItemRef.current;
      const container = containerRef.current;
      
      // Get the position of the active item relative to the container
      const activeTop = activeElement.offsetTop;
      const activeBottom = activeTop + activeElement.offsetHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;

      // Scroll if the active item is outside the visible area
      if (activeTop < containerTop) {
        // Active item is above the visible area
        container.scrollTo({ top: activeTop, behavior: 'smooth' });
      } else if (activeBottom > containerBottom) {
        // Active item is below the visible area
        container.scrollTo({ top: activeBottom - container.clientHeight, behavior: 'smooth' });
      }
    }
  }, [activeIndex]);

  return (
    <div 
      ref={containerRef}
      className="absolute bottom-full left-0 right-0 border-2 p-2 mb-1 z-10 max-h-64 overflow-y-auto"
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
              ref={isActive ? activeItemRef : null}
              className="cursor-pointer px-2 py-2 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2"
              style={style}
              onClick={() => onSelect(suggestion.name)}
            >
              <span className="font-semibold whitespace-nowrap">
                /<span className="font-bold">{suggestion.name}</span>
              </span>
              <span 
                className="text-sm sm:text-base break-words flex-1"
                style={{ opacity: isActive ? 1 : 0.6 }}
              >
                {suggestion.description}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

