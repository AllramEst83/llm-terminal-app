import React, { useRef, useEffect, useState } from 'react';
import type { CommandSuggestionsProps } from '../../../types/ui/components';

export const CommandSuggestions: React.FC<CommandSuggestionsProps> = ({ 
  suggestions, 
  activeIndex, 
  onSelect, 
  theme 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLLIElement>(null);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const mouseStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    if (activeItemRef.current && containerRef.current) {
      const activeElement = activeItemRef.current;
      const container = containerRef.current;
      
      const activeTop = activeElement.offsetTop;
      const activeBottom = activeTop + activeElement.offsetHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;

      if (activeTop < containerTop) {
        container.scrollTo({ top: activeTop, behavior: 'smooth' });
      } else if (activeBottom > containerBottom) {
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
              onMouseDown={(e) => {
                mouseStartRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                  time: Date.now()
                };
                setIsScrolling(false);
              }}
              onMouseMove={(e) => {
                if (mouseStartRef.current) {
                  const deltaX = Math.abs(e.clientX - mouseStartRef.current.x);
                  const deltaY = Math.abs(e.clientY - mouseStartRef.current.y);
                  
                  if (deltaX > 5 || deltaY > 5) {
                    setIsScrolling(true);
                  }
                }
              }}
              onMouseUp={(e) => {
                if (mouseStartRef.current && !isScrolling) {
                  const deltaX = Math.abs(e.clientX - mouseStartRef.current.x);
                  const deltaY = Math.abs(e.clientY - mouseStartRef.current.y);
                  const deltaTime = Date.now() - mouseStartRef.current.time;
                  
                  if (deltaX < 10 && deltaY < 10 && deltaTime < 300) {
                    e.preventDefault();
                    onSelect(suggestion.name);
                  }
                }
                mouseStartRef.current = null;
                setTimeout(() => setIsScrolling(false), 100);
              }}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                touchStartRef.current = {
                  x: touch.clientX,
                  y: touch.clientY,
                  time: Date.now()
                };
                setIsScrolling(false);
              }}
              onTouchMove={(e) => {
                if (touchStartRef.current) {
                  const touch = e.touches[0];
                  const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
                  const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
                  
                  if (deltaX > 5 || deltaY > 5) {
                    setIsScrolling(true);
                  }
                }
              }}
              onTouchEnd={(e) => {
                if (touchStartRef.current && !isScrolling) {
                  const touch = e.changedTouches[0];
                  const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
                  const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
                  const deltaTime = Date.now() - touchStartRef.current.time;
                  
                  if (deltaX < 10 && deltaY < 10 && deltaTime < 300) {
                    e.preventDefault();
                    onSelect(suggestion.name);
                  }
                }
                touchStartRef.current = null;
                setTimeout(() => setIsScrolling(false), 100);
              }}
              onClick={(e) => {
                if (!isScrolling && !e.defaultPrevented) {
                  onSelect(suggestion.name);
                }
              }}
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

