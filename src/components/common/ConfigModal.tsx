import React, { useState } from 'react';
import { X, Database, Copy, Check, ShieldCheck } from 'lucide-react';
import { getSupabaseConfig, updateSupabaseCredentials } from '../../lib/supabase';
import { SUPABASE_SQL_SETUP } from '../../lib/constants';
import { useToast } from './Toast';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onSaved }) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || 'https://tqqttaswtuwqflbtbwmd.supabase.co');
  const [key, setKey] = useState(currentConfig.key || '');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'sql'>('credentials');
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      showToast('Please enter your Supabase publishable anon key', 'warning');
      return;
    }
    updateSupabaseCredentials(url.trim(), key.trim());
    showToast('Supabase credentials saved successfully!', 'success');
    if (onSaved) onSaved();
    onClose();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopied(true);
    showToast('SQL schema copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#0E0E11]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Supabase Connection Settings</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Database, Auth & Screenshot Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-[#0E0E11]/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'credentials'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Credentials & Keys
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Database SQL Schema
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'credentials' ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white px-3.5 py-2.5 rounded-xl text-sm font-mono placeholder:text-zinc-400 outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Supabase Anon (Publishable) Key</span>
                  <span className="text-[11px] text-zinc-400">Found in Project Settings &gt; API</span>
                </label>
                <textarea
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="sb_publishable_..."
                  rows={3}
                  className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white px-3.5 py-2.5 rounded-xl text-xs font-mono placeholder:text-zinc-400 outline-none transition-colors resize-none"
                  required
                />
              </div>

              <div className="p-3.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Secure Client Storage</span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Your publishable anon key connects this app directly to your Supabase project with Row Level Security (RLS).
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-white">Database Tables & Storage Bucket</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Run this SQL script in your Supabase SQL Editor</p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 text-zinc-900 dark:text-white rounded-xl transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>

              <div className="relative bg-zinc-900 dark:bg-[#09090B] border border-zinc-800 rounded-xl p-3.5 max-h-80 overflow-y-auto">
                <pre className="text-[11px] font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {SUPABASE_SQL_SETUP}
                </pre>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                This schema provisions the <code className="text-emerald-600 dark:text-emerald-400 font-mono">instruments</code>, <code className="text-emerald-600 dark:text-emerald-400 font-mono">journal_days</code>, and <code className="text-emerald-600 dark:text-emerald-400 font-mono">trades</code> tables with RLS and the <code className="text-emerald-600 dark:text-emerald-400 font-mono">trade-screenshots</code> storage bucket.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
