import React from 'react';
import type { TerminalTabsProps } from '../../../types/ui/components';

export const TerminalTabs: React.FC<TerminalTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  theme,
}) => {
  const canClose = tabs.length > 1;

  return (
    <div className="flex items-center gap-2 mb-2 flex-wrap">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            className="flex items-center border-2 rounded px-2 py-1 text-sm font-mono"
            style={{
              borderColor: theme.accent,
              backgroundColor: isActive ? theme.headerBg : 'transparent',
              color: isActive ? theme.headerText : theme.text,
            }}
          >
            <button
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className="px-1"
              style={{ color: 'inherit' }}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </button>
            {canClose && (
              <button
                type="button"
                onClick={() => onCloseTab(tab.id)}
                className="ml-2 text-xs opacity-70 hover:opacity-100"
                aria-label={`Close ${tab.label}`}
                style={{ color: 'inherit' }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={onNewTab}
        className="px-2 py-1 border-2 rounded text-sm font-mono hover:opacity-90"
        style={{ borderColor: theme.accent, color: theme.accent }}
      >
        + New Tab
      </button>
    </div>
  );
};
