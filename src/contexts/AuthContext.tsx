import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { STARTER_INSTRUMENTS } from '../lib/constants';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isDemoUser: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  enableDemoMode: () => void;
  checkStarterInstruments: (userId: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());
  const [isDemoUser, setIsDemoUser] = useState(false);

  const currentUserIdRef = React.useRef<string | null>(null);

  // Auto-seed starter instruments for new users if none exist
  const checkStarterInstruments = async (userId: string) => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('instruments')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (!error && (!data || data.length === 0)) {
        const rows = STARTER_INSTRUMENTS.map((item) => ({
          user_id: userId,
          symbol: item.symbol,
          name: item.name,
          market_type: item.market_type,
        }));
        await client.from('instruments').insert(rows);
      }
    } catch (err) {
      console.warn('Could not verify/seed starter instruments:', err);
    }
  };

  const refreshAuth = async () => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);

    if (!configured) {
      // Check if demo user is stored
      const storedDemo = localStorage.getItem('jefextech_demo_user');
      if (storedDemo) {
        setIsDemoUser(true);
        const parsed = JSON.parse(storedDemo);
        currentUserIdRef.current = parsed.id;
        setUser(parsed);
      } else {
        currentUserIdRef.current = null;
        setUser(null);
      }
      setLoading(false);
      return;
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.getSession();
      if (!error && data?.session) {
        setSession(data.session);
        currentUserIdRef.current = data.session.user.id;
        setUser(data.session.user);
        setIsDemoUser(false);
        checkStarterInstruments(data.session.user.id);
      } else {
        setSession(null);
        // If demo user was active, retain it, otherwise null
        const storedDemo = localStorage.getItem('jefextech_demo_user');
        if (storedDemo) {
          setIsDemoUser(true);
          const parsed = JSON.parse(storedDemo);
          currentUserIdRef.current = parsed.id;
          setUser(parsed);
        } else {
          currentUserIdRef.current = null;
          setUser(null);
        }
      }
    } catch (err) {
      console.warn('Auth check error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      const { data: authListener } = client.auth.onAuthStateChange(
        async (event, currentSession) => {
          // Ignore TOKEN_REFRESHED completely - do not reload or unmount UI
          if (event === 'TOKEN_REFRESHED') {
            setSession(currentSession);
            return;
          }

          const newUserId = currentSession?.user?.id ?? null;

          // Ignore repeated SIGNED_IN if user ID is the same
          if (event === 'SIGNED_IN' && newUserId === currentUserIdRef.current) {
            setSession(currentSession);
            return;
          }

          // Only update UI if user identity actually changed or signed out
          currentUserIdRef.current = newUserId;
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            setIsDemoUser(false);
            localStorage.removeItem('jefextech_demo_user');
            checkStarterInstruments(currentSession.user.id);
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        setIsDemoUser(false);
        localStorage.removeItem('jefextech_demo_user');
        await checkStarterInstruments(data.user.id);
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Login failed') };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (data?.session && data?.user) {
        setUser(data.user);
        setSession(data.session);
        setIsDemoUser(false);
        localStorage.removeItem('jefextech_demo_user');
        if (data.user.id) {
          await checkStarterInstruments(data.user.id);
        }
        return { error: null };
      } else if (data?.user && !data?.session) {
        return {
          error: new Error(
            'Account created! If confirmation email was sent, please verify it or check Supabase Auth settings.'
          ),
        };
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Signup failed') };
    }
  };

  const signOut = async () => {
    try {
      if (isDemoUser) {
        localStorage.removeItem('jefextech_demo_user');
        setUser(null);
        setSession(null);
        setIsDemoUser(false);
        return;
      }

      const client = getSupabaseClient();
      await client.auth.signOut();
      setUser(null);
      setSession(null);
      setIsDemoUser(false);
    } catch (err) {
      console.warn('Sign out error:', err);
      setUser(null);
      setSession(null);
    }
  };

  const enableDemoMode = () => {
    const demoUser: User = {
      id: 'demo-trader-001',
      app_metadata: {},
      user_metadata: { full_name: 'Prop Trader (Demo)' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'trader@jefextech.internal',
      phone: '',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem('jefextech_demo_user', JSON.stringify(demoUser));
    setUser(demoUser);
    setIsDemoUser(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured,
        isDemoUser,
        signIn,
        signUp,
        signOut,
        enableDemoMode,
        checkStarterInstruments,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
