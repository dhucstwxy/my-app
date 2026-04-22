import { supabase } from './supabase';

export async function getUserByToken(token: string) {
  return supabase.auth.getUser(token);
}

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  redirectTo: string
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: redirectTo,
    },
  });
}

export async function exchangeCodeForSession(code: string) {
  return supabase.auth.exchangeCodeForSession(code);
}

export async function signOutWithToken(_token: string) {
  return { error: null };
}

export type OAuthProvider = 'github';

export async function signInWithOAuth(provider: OAuthProvider, redirectTo: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { error };
  }

  return { data, error: null };
}
