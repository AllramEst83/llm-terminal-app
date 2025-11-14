import React from 'react';
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
}) => (
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

