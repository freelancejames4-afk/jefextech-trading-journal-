import React, { useState } from 'react';
import { X, Database, Key, Copy, Check, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#111A2E] border border-[#1E2B45] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2B45] bg-[#0B1220]/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2F80FF]/15 border border-[#2F80FF]/40 flex items-center justify-center text-[#2F80FF]">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Supabase Connection Settings</h2>
              <p className="text-xs text-slate-400">Database, Auth & Screenshot Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-[#16223B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1E2B45] bg-[#0B1220]/30 px-6 pt-2">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'credentials'
                ? 'border-[#2F80FF] text-[#2F80FF]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Credentials & Keys
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-[#2F80FF] text-[#2F80FF]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
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
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3.5 py-2.5 rounded-lg text-sm font-mono placeholder:text-slate-600 outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Supabase Anon (Publishable) Key</span>
                  <span className="text-[11px] text-slate-500 font-normal">Found in Project Settings &gt; API</span>
                </label>
                <textarea
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  rows={3}
                  className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3.5 py-2.5 rounded-lg text-xs font-mono placeholder:text-slate-600 outline-none transition-colors resize-none"
                  required
                />
              </div>

              <div className="p-3.5 bg-[#16223B]/60 border border-[#1E2B45] rounded-lg text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center gap-2 text-[#00C896] font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Secure Client Storage</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Your publishable anon key connects this app directly to your Supabase project with Row Level Security (RLS). You can also set this in your environment as <code className="text-[#2F80FF] font-mono">VITE_SUPABASE_ANON_KEY</code>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-transparent hover:bg-[#16223B] border border-[#1E2B45] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#2F80FF] hover:bg-[#2F80FF]/90 rounded-lg shadow-lg shadow-[#2F80FF]/20 transition-all"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">Database Tables & Storage Bucket</h3>
                  <p className="text-xs text-slate-400">Run this SQL script in your Supabase SQL Editor</p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-[#16223B] border border-[#1E2B45] hover:border-[#2F80FF] text-white rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#00C896]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>

              <div className="relative bg-[#0B1220] border border-[#1E2B45] rounded-lg p-3.5 max-h-80 overflow-y-auto">
                <pre className="text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {SUPABASE_SQL_SETUP}
                </pre>
              </div>

              <p className="text-xs text-slate-400">
                This schema provisions the <code className="text-[#2F80FF] font-mono">instruments</code>, <code className="text-[#2F80FF] font-mono">journal_days</code>, and <code className="text-[#2F80FF] font-mono">trades</code> tables with RLS and the <code className="text-[#2F80FF] font-mono">trade-screenshots</code> storage bucket.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
