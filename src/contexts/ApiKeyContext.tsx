import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { storage } from '../utils';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  isConfigured: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | null>(null);

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);

  useEffect(() => {
    setApiKeyState(storage.getApiKey());
  }, []);

  const setApiKey = useCallback((key: string) => {
    storage.setApiKey(key);
    setApiKeyState(key);
  }, []);

  const clearApiKey = useCallback(() => {
    storage.clearApiKey();
    setApiKeyState(null);
  }, []);

  return (
    <ApiKeyContext.Provider value={{
      apiKey,
      setApiKey,
      clearApiKey,
      isConfigured: !!apiKey
    }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}
