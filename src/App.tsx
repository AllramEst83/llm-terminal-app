import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_SESSION_ID } from './domain';
import { ApiKeyService } from './infrastructure/services';
import { generateId } from './infrastructure/utils/id.utils';
import { TerminalSession } from './presentation/components/features';
import type { TerminalTabItem } from './types/ui/components';

export const App: React.FC = () => {
  const [isStudioEnv, setIsStudioEnv] = useState(false);
  const [isKeyReady, setIsKeyReady] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [tabs, setTabs] = useState<TerminalTabItem[]>([
    { id: DEFAULT_SESSION_ID, label: 'Tab 1' },
  ]);
  const [activeTabId, setActiveTabId] = useState(DEFAULT_SESSION_ID);
  const [tabCounter, setTabCounter] = useState(1);

  // Initialize global environment and API key state
  useEffect(() => {
    const initApp = async () => {
      const isStudio = ApiKeyService.isStudioEnvironment();
      setIsStudioEnv(isStudio);

      const hasKey = await ApiKeyService.hasApiKey();
      setIsKeyReady(hasKey);

      const storedKey = await ApiKeyService.getApiKey();
      setApiKey(storedKey);
    };
    initApp();
  }, []);

  const handleSelectKey = useCallback(async () => {
    await ApiKeyService.openKeySelector();
    const storedKey = await ApiKeyService.getApiKey();
    setApiKey(storedKey);
    setIsKeyReady(true);
  }, []);

  const handleApiKeySubmit = useCallback((submittedKey: string) => {
    ApiKeyService.setApiKey(submittedKey);
    setApiKey(submittedKey);
    setIsKeyReady(true);
  }, []);

  const handleNewTab = useCallback(() => {
    const newTabId = `tab-${generateId()}`;
    setTabCounter(prevCount => {
      const nextCount = prevCount + 1;
      setTabs(prevTabs => [
        ...prevTabs,
        { id: newTabId, label: `Tab ${nextCount}` },
      ]);
      setActiveTabId(newTabId);
      return nextCount;
    });
  }, []);

  const handleCloseTab = useCallback((tabId: string) => {
    setTabs(prevTabs => {
      if (prevTabs.length <= 1) {
        return prevTabs;
      }
      const nextTabs = prevTabs.filter(tab => tab.id !== tabId);
      if (tabId === activeTabId) {
        const fallbackTab = nextTabs[nextTabs.length - 1] ?? nextTabs[0];
        setActiveTabId(fallbackTab.id);
      }
      return nextTabs;
    });
  }, [activeTabId]);

  return (
    <div
      className="flex flex-col p-2 sm:p-4"
      style={{
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className="flex-1 min-h-0">
        {tabs.map((tab) => (
          <TerminalSession
            key={tab.id}
            sessionId={tab.id}
            isActive={tab.id === activeTabId}
            isStudioEnv={isStudioEnv}
            isKeyReady={isKeyReady}
            apiKey={apiKey}
            onApiKeySubmit={handleApiKeySubmit}
            onSelectKey={handleSelectKey}
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onCloseTab={handleCloseTab}
            onNewTab={handleNewTab}
          />
        ))}
      </div>
    </div>
  );
};
