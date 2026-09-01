import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  beginDccLogin,
  completeDccLogin,
  hasOidcCallbackParameters,
  isDccOidcConfigured,
  loadDccSession,
  revalidateDccSession,
  revokeDccSession,
} from './dccOidc';

const DccAuthContext = createContext(null);

export function DccAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        if (hasOidcCallbackParameters()) {
          const completed = await completeDccLogin();
          if (!cancelled) setSession(completed);
        } else {
          const saved = loadDccSession();
          if (saved) {
            const validated = await revalidateDccSession(saved);
            if (!cancelled) setSession(validated);
          }
        }
        if (!cancelled) setStatus('ready');
      } catch (initializationError) {
        if (!cancelled) {
          setSession(null);
          setError(initializationError.message || 'DCC Loginの認証処理に失敗しました');
          setStatus('ready');
        }
      }
    };

    initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session?.expiresAt) return undefined;
    const remaining = session.expiresAt - Date.now();
    if (remaining <= 0) {
      setSession(null);
      return undefined;
    }

    const timer = window.setTimeout(() => setSession(null), remaining);
    return () => window.clearTimeout(timer);
  }, [session]);

  const login = useCallback(async returnTo => {
    setError('');
    try {
      await beginDccLogin(returnTo);
    } catch (loginError) {
      setError(loginError.message || 'DCC Loginを開始できませんでした');
    }
  }, []);

  const logout = useCallback(async () => {
    const current = session;
    setSession(null);
    setError('');
    await revokeDccSession(current);
  }, [session]);

  const clearError = useCallback(() => setError(''), []);
  const getAccessToken = useCallback(() => {
    if (!session || session.expiresAt <= Date.now()) return null;
    return session.accessToken;
  }, [session]);

  const value = useMemo(() => ({
    status,
    error,
    isConfigured: isDccOidcConfigured(),
    isAuthenticated: Boolean(session?.user?.sub),
    user: session?.user || null,
    login,
    logout,
    clearError,
    getAccessToken,
  }), [status, error, session, login, logout, clearError, getAccessToken]);

  return <DccAuthContext.Provider value={value}>{children}</DccAuthContext.Provider>;
}

export function useDccAuth() {
  const context = useContext(DccAuthContext);
  if (!context) throw new Error('useDccAuth must be used inside DccAuthProvider');
  return context;
}
