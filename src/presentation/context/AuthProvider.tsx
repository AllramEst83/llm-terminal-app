import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import type { Session, User } from '@supabase/supabase-js';
import { useAuthStore, type AuthStatus } from './auth-store';

interface AuthContextValue {
  status: AuthStatus;
  initializing: boolean;
  session: Session | null;
  user: User | null;
  error: string | null;
  hasApiKey: boolean | null;
  isCheckingApiKey: boolean;
  isAuthConfigured: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkApiKey: () => Promise<boolean>;
  setError: (message: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const initialize = useAuthStore((state) => state.initialize);

  const authSlice = useAuthStore(
    (state) => ({
      status: state.status,
      initializing: state.initializing,
      session: state.session,
      user: state.user,
      error: state.error,
      hasApiKey: state.hasApiKey,
      isCheckingApiKey: state.isCheckingApiKey,
      isAuthConfigured: state.isAuthConfigured,
    }),
    shallow
  );

  const authActions = useAuthStore(
    (state) => ({
      login: state.login,
      signup: state.signup,
      logout: state.logout,
      checkApiKey: state.checkApiKey,
      setError: state.setError,
    }),
    shallow
  );

  useEffect(() => {
    initialize();
  }, [initialize]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...authSlice,
      ...authActions,
    }),
    [authSlice, authActions]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

