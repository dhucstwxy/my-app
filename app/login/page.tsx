'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { AuthForm } from '@/app/components/AuthForm';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const { isAuthenticated, isLoading, setUser, signIn, signUp, signInWithOAuth } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }

    const params = new URLSearchParams(window.location.search);
    const authError = params.get('authError');
    if (authError) {
      setTimeout(() => {
        setError(authError);
      }, 0);
    }
  }, [isAuthenticated, isLoading, router]);

  function handleSuccess(sessionData?: { user: { id: string; email: string; name: string } }) {
    if (sessionData?.user) {
      setUser(sessionData.user);
    }
    router.replace('/');
  }

  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <main className="login-shell">
      <div className="tech-grid-bg" />
      <div className="ambient-glow" />
      {error ? <div className="login-route-error">{error}</div> : null}
      <AuthForm
        mode={mode}
        onModeChange={setMode}
        onSuccess={handleSuccess}
        onSignIn={signIn}
        onSignUp={signUp}
        onOAuthLogin={() => signInWithOAuth('github')}
      />
    </main>
  );
}
