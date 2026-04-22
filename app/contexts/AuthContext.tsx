'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

type OAuthProvider = 'github';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (email: string, password: string, name: string) => Promise<AuthUser | null>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          console.error('OAuth 错误:', error, errorDescription);
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }

        if (accessToken) {
          document.cookie = `sb-access-token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=lax`;
          window.history.replaceState({}, '', window.location.pathname);
        }

        const response = await fetch('/api/auth/session');
        if (!response.ok) return;
        const data = await response.json() as { user: AuthUser | null };
        setUser(data.user);
      } finally {
        setIsLoading(false);
      }
    }

    void initAuth();
  }, []);

  async function refreshUser() {
    const response = await fetch('/api/auth/session');
    if (!response.ok) {
      setUser(null);
      return;
    }
    const data = await response.json() as { user: AuthUser | null };
    setUser(data.user);
  }

  async function signIn(email: string, password: string) {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json() as {
      error?: string;
      user?: AuthUser;
    };

    if (!response.ok || !data.user) {
      throw new Error(data.error || '登录失败');
    }

    setUser(data.user);
    return data.user;
  }

  async function signUp(email: string, password: string, name: string) {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json() as {
      error?: string;
      message?: string;
      user?: {
        id: string;
        email: string;
        user_metadata?: { name?: string };
      };
      requiresConfirmation?: boolean;
    };

    if (!response.ok) {
      throw new Error(data.error || '注册失败');
    }

    if (data.requiresConfirmation) {
      return null;
    }

    if (data.user) {
      const nextUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || name,
      };
      setUser(nextUser);
      return nextUser;
    }

    return null;
  }

  async function signInWithOAuth(provider: OAuthProvider) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'implicit',
      },
    });
    const redirectTo = `${window.location.origin}/api/auth/callback`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw new Error(error.message || 'GitHub 登录失败');
    }

    if (data.url) {
      window.location.href = data.url;
    }
  }

  async function signOut() {
    await fetch('/api/auth/signout', { method: 'POST' });
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      signIn,
      signUp,
      signInWithOAuth,
      signOut,
      refreshUser,
      setUser,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
