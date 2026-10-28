import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage } from '../types';
import { useAuth } from './AuthContext';
import { getSupabaseClient } from '../lib/supabase';

interface CoachContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearHistory: () => void;
  isFloatingOpen: boolean;
  setIsFloatingOpen: (open: boolean) => void;
  suggestedQuestions: string[];
  webhookUrl: string;
}

const CoachContext = createContext<CoachContextType | undefined>(undefined);

const SUGGESTED_QUESTIONS = [
  'What is my biggest mistake this week?',
  'Which pair am I best at?',
  'Is gold bullish or bearish today?',
  'Review my risk-to-reward ratio on recent trades',
];

export const CoachProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFloatingOpen, setIsFloatingOpen] = useState<boolean>(false);

  // Webhook URL from environment variable
  const webhookUrl =
    (import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL as string) ||
    localStorage.getItem('n8n_chat_webhook_url_override') ||
    'https://jamesindicator.app.n8n.cloud/webhook/jefextech-coach';

  // Storage key for user messages
  const storageKey = user ? `jefextech_coach_messages_${user.id}` : null;

  // Load chat history from storage when user logs in
  useEffect(() => {
    if (!storageKey) {
      setMessages([]);
      return;
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved coach messages:', e);
    }

    // Default welcome message from AI Coach
    const welcomeMessage: ChatMessage = {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello Trader! I am your **Jefextech AI Trading Coach**.\n\nI analyze your trades, monitor your discipline against your 10 trading rules, and review optimal Nigerian market session timings.\n\nHow can I help you sharpen your edge today? Feel free to ask one of the suggested questions below!`,
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
    try {
      localStorage.setItem(storageKey, JSON.stringify([welcomeMessage]));
    } catch {}
  }, [storageKey]);

  // Save messages whenever they change
  const saveMessages = useCallback(
    (newMessages: ChatMessage[]) => {
      setMessages(newMessages);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newMessages));
        } catch (e) {
          console.warn('Could not persist coach messages:', e);
        }
      }
    },
    [storageKey]
  );

  const clearHistory = useCallback(() => {
    const welcomeMessage: ChatMessage = {
      id: `welcome-${Date.now()}`,
      sender: 'assistant',
      text: `Chat history cleared. What trading setup or journal review would you like to discuss next?`,
      timestamp: new Date().toISOString(),
    };
    saveMessages([welcomeMessage]);
    setError(null);
  }, [saveMessages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setError(null);

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    const nextMessages = [...messages, userMsg];
    saveMessages(nextMessages);
    setIsTyping(true);

    // 2. Resolve access token
    let accessToken = session?.access_token;
    if (!accessToken) {
      try {
        const client = getSupabaseClient();
        const { data } = await client.auth.getSession();
        accessToken = data.session?.access_token;
      } catch (err) {
        console.warn('Failed to retrieve Supabase session token:', err);
      }
    }

    // 3. Set up 60-second AbortController timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 60000); // 60 seconds

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const body = {
        message: trimmed,
        user_id: user?.id || 'anonymous_trader',
        session_id: user?.id || 'anonymous_session',
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        const authErrMsg = 'Please log in again to authenticate with the AI Coach.';
        setError(authErrMsg);
        const replyMsg: ChatMessage = {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Authentication Error**: Please log in again to continue your coaching session.`,
          timestamp: new Date().toISOString(),
          status: 'error',
        };
        saveMessages([...nextMessages, replyMsg]);
        return;
      }

      if (!response.ok) {
        throw new Error(`AI Coach server responded with status ${response.status} (${response.statusText})`);
      }

      const data = await response.json().catch(() => null);

      let replyText = '';
      if (typeof data === 'string') {
        replyText = data;
      } else if (data && typeof data === 'object') {
        replyText =
          data.reply ||
          data.output ||
          data.message ||
          data.text ||
          data.response ||
          (data.data ? JSON.stringify(data.data) : JSON.stringify(data));
      } else {
        replyText = 'Received response from AI Coach, but could not parse reply text.';
      }

      const assistantMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toISOString(),
      };

      saveMessages([...nextMessages, assistantMsg]);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('AI Coach request failed:', err);

      let friendlyError = '';
      if (err.name === 'AbortError') {
        friendlyError =
          'The request took longer than 60 seconds to respond. The AI model may be under heavy load. Please try again.';
      } else {
        friendlyError = err.message || 'Failed to connect to the AI Coach webhook.';
      }

      setError(friendlyError);

      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Connection Issue**: ${friendlyError}\n\nPlease verify your network or check that the n8n webhook workflow is active.`,
        timestamp: new Date().toISOString(),
        status: 'error',
      };
      saveMessages([...nextMessages, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <CoachContext.Provider
      value={{
        messages,
        isTyping,
        error,
        sendMessage,
        clearHistory,
        isFloatingOpen,
        setIsFloatingOpen,
        suggestedQuestions: SUGGESTED_QUESTIONS,
        webhookUrl,
      }}
    >
      {children}
    </CoachContext.Provider>
  );
};

export const useCoach = () => {
  const context = useContext(CoachContext);
  if (!context) {
    throw new Error('useCoach must be used within a CoachProvider');
  }
  return context;
};
