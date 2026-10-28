import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  AlertCircle,
  Loader2,
  Clock,
  ArrowDown,
  RefreshCw,
} from 'lucide-react';
import { useCoach } from '../../contexts/CoachContext';
import { MarkdownContent } from '../common/MarkdownContent';

interface AICoachChatProps {
  compact?: boolean;
  onClose?: () => void;
}

export const AICoachChat: React.FC<AICoachChatProps> = ({ compact = false, onClose }) => {
  const {
    messages,
    isTyping,
    error,
    sendMessage,
    clearHistory,
    suggestedQuestions,
  } = useCoach();

  const [input, setInput] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages or typing
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Timer while waiting for response (up to 60s)
  useEffect(() => {
    let interval: any = null;
    if (isTyping) {
      setSecondsElapsed(0);
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setSecondsElapsed(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = input.trim();
    if (!textToSend || isTyping) return;

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendMessage(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectSuggested = (question: string) => {
    if (isTyping) return;
    sendMessage(question);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#121215] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Top Bar / Header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50/70 dark:bg-[#0E0E11] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Bot className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>AI Trading Coach</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h2>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
              Powered by n8n Webhook • Real-Time Trade Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={clearHistory}
            title="Clear Chat History"
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#18181B] rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#18181B] rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-xs ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-sm'
                    : 'bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800/90 text-zinc-900 dark:text-zinc-100 rounded-tl-sm'
                }`}
              >
                {isUser ? (
                  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-sans">
                    {msg.text}
                  </p>
                ) : (
                  <MarkdownContent content={msg.text} />
                )}

                <div
                  className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-mono ${
                    isUser ? 'text-emerald-100 justify-end' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  <Clock className="w-2.5 h-2.5" />
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {msg.status === 'sending' && <span>• sending...</span>}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator bubble */}
        {isTyping && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="font-mono text-[11px] ml-1">
                  AI Coach is analyzing... ({secondsElapsed}s / 60s)
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Section */}
      <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#0E0E11]/50">
        <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Suggested Inquiries</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggested(q)}
              disabled={isTyping}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white dark:bg-[#18181B] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 text-zinc-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer disabled:opacity-50 text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
        {error && (
          <div className="mb-2 p-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              placeholder={isTyping ? 'Waiting for AI Coach reply (up to 60s)...' : 'Ask your AI trading coach anything...'}
              className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-colors resize-none leading-relaxed disabled:opacity-60 max-h-32"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white disabled:text-zinc-400 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0 active:scale-95"
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
          <span>Press Enter to send, Shift + Enter for new line</span>
          {isTyping && <span className="text-amber-500">Connecting to n8n ({secondsElapsed}s)</span>}
        </div>
      </div>
    </div>
  );
};
