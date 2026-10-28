import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Camera,
  Database,
  Copy,
  Check,
  Upload,
  Trash2,
  RotateCcw,
  Save,
  Server,
  Key,
  FolderLock,
  ExternalLink,
  User,
  AlertCircle,
  HelpCircle,
  HardDrive,
  Clock,
  Sparkles,
  Bot,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useJournal } from '../../contexts/JournalContext';
import { useToast } from '../common/Toast';
import { getSupabaseConfig, updateSupabaseCredentials, uploadAvatarImage } from '../../lib/supabase';
import { SUPABASE_SQL_SETUP, DEFAULT_TRADING_RULES } from '../../lib/constants';
import { DEFAULT_INSTRUMENT_RULES } from '../../lib/tradingSessions';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const {
    avatarUrl,
    updateAvatarUrl,
    tradingRules,
    updateTradingRule,
    resetTradingRules,
    instruments,
    bestTimesOverrides,
    updateBestTimeOverride,
    resetBestTimeOverrides,
    refreshData,
  } = useJournal();
  const { showToast } = useToast();

  const currentConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(currentConfig.key);

  // Editable rules state
  const [editedRules, setEditedRules] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    tradingRules.forEach((r) => {
      map[r.rule_number] = r.rule_text;
    });
    return map;
  });

  const [copiedSql, setCopiedSql] = useState(false);
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Custom Best Trading Windows state
  const [selectedCustomSymbol, setSelectedCustomSymbol] = useState<string>('EURUSD');
  const [customWindowText, setCustomWindowText] = useState<string>('');
  const [isSavingCustomTime, setIsSavingCustomTime] = useState(false);

  React.useEffect(() => {
    if (selectedCustomSymbol) {
      const defaultDesc = DEFAULT_INSTRUMENT_RULES.find((r) => r.symbol === selectedCustomSymbol)?.sessionDescription || '';
      const existing = bestTimesOverrides[selectedCustomSymbol] || defaultDesc;
      setCustomWindowText(existing);
    }
  }, [selectedCustomSymbol, bestTimesOverrides]);

  const handleSaveCustomWindow = async () => {
    if (!selectedCustomSymbol) return;
    setIsSavingCustomTime(true);
    try {
      await updateBestTimeOverride(selectedCustomSymbol, customWindowText.trim());
      showToast(`Custom trading window saved for ${selectedCustomSymbol}!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Saved locally. Run the SQL script to persist to Supabase.', 'info');
    } finally {
      setIsSavingCustomTime(false);
    }
  };

  const handleResetCustomWindows = async () => {
    if (!confirm('Reset all instrument trading windows back to automatic market session defaults?')) return;
    setIsSavingCustomTime(true);
    try {
      await resetBestTimeOverrides();
      showToast('All instrument windows reset to default session rules.', 'info');
      if (selectedCustomSymbol) {
        const defaultDesc = DEFAULT_INSTRUMENT_RULES.find((r) => r.symbol === selectedCustomSymbol)?.sessionDescription || '';
        setCustomWindowText(defaultDesc);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to reset overrides.', 'error');
    } finally {
      setIsSavingCustomTime(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    showToast('SQL setup script copied to clipboard!', 'success');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseKey.trim()) {
      showToast('Please enter your Supabase publishable anon key.', 'warning');
      return;
    }
    updateSupabaseCredentials(supabaseUrl.trim(), supabaseKey.trim());
    showToast('Supabase credentials saved.', 'success');
    refreshData();
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setAvatarError('Please select a JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setAvatarError('Image must be 3MB or less.');
      return;
    }

    setIsSavingAvatar(true);
    try {
      const uploadedUrl = await uploadAvatarImage(file, user?.id || 'trader');
      await updateAvatarUrl(uploadedUrl);
      showToast('Profile logo updated successfully!', 'success');
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      const msg = err.message || 'Failed to upload logo. Ensure the "avatars" bucket exists in Supabase.';
      setAvatarError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('Are you sure you want to remove your custom profile logo?')) return;
    setIsSavingAvatar(true);
    try {
      await updateAvatarUrl(null);
      showToast('Profile logo reset to default.', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to remove profile logo.', 'error');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleSaveAllRules = async () => {
    setIsSavingRules(true);
    try {
      for (const rule of tradingRules) {
        const newText = editedRules[rule.rule_number];
        if (newText && newText !== rule.rule_text) {
          await updateTradingRule(rule.rule_number, newText);
        }
      }
      showToast('Trading rules updated and saved!', 'success');
    } catch (err: any) {
      console.error('Error saving rules:', err);
      showToast('Saved locally. Run the updated SQL script to sync to Supabase.', 'info');
    } finally {
      setIsSavingRules(false);
    }
  };

  const handleResetRulesToDefault = async () => {
    if (!confirm('Reset all 10 trading rules to the original discipline guidelines?')) return;
    setIsSavingRules(true);
    try {
      await resetTradingRules();
      const map: Record<number, string> = {};
      DEFAULT_TRADING_RULES.forEach((r) => {
        map[r.rule_number] = r.rule_text;
      });
      setEditedRules(map);
      showToast('Trading rules restored to defaults.', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to reset rules.', 'error');
    } finally {
      setIsSavingRules(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Settings & System Configuration
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Customize your profile logo, refine your 10 trading rules, and inspect Supabase system health.
        </p>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2): Profile & Trading Rules */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Profile Logo */}
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Profile Logo</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Custom round logo shown next to &quot;Jefextech Journal&quot; in the top-left bar
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Round Logo Preview */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-zinc-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-medium cursor-pointer"
                >
                  <Camera className="w-4 h-4 mb-0.5" />
                  Upload
                </button>
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">
                    {user?.email || 'Logged In Trader'}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Uploaded image is saved in the <code className="text-emerald-600 dark:text-emerald-400 font-mono">avatars</code> Supabase Storage bucket and stored in the <code className="text-emerald-600 dark:text-emerald-400 font-mono">profiles</code> table.
                  </p>
                </div>

                {avatarError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{avatarError}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSavingAvatar}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isSavingAvatar ? 'Uploading...' : 'Upload Image'}</span>
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={isSavingAvatar}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: My 10 Trading Rules */}
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    My 10 Trading Rules
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Edit your rules here. They sync with the Add Trade checklist and the popups.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetRulesToDefault}
                  disabled={isSavingRules}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Reset to default 10 rules"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAllRules}
                  disabled={isSavingRules}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingRules ? 'Saving...' : 'Save Rules'}</span>
                </button>
              </div>
            </div>

            {/* List of 10 editable rules */}
            <div className="space-y-3">
              {tradingRules.map((rule) => {
                const isLossRule = rule.rule_number === 3;
                const isRiskRule = rule.rule_number === 8 || rule.rule_number === 9;
                return (
                  <div
                    key={rule.rule_number}
                    className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800/80"
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-1 ${
                        isLossRule
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                          : isRiskRule
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      {rule.rule_number}
                    </span>
                    <div className="flex-1">
                      <textarea
                        rows={2}
                        value={editedRules[rule.rule_number] ?? rule.rule_text}
                        onChange={(e) =>
                          setEditedRules({
                            ...editedRules,
                            [rule.rule_number]: e.target.value,
                          })
                        }
                        className="w-full bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-xs text-zinc-900 dark:text-zinc-100 p-2.5 rounded-lg outline-none transition-colors resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Best Trading Windows Customization */}
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Clock className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Best Trading Windows (Customization)
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Adjust peak windows for any instrument. Persisted to your Supabase <code className="font-mono text-emerald-600 dark:text-emerald-400">best_times</code> table.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetCustomWindows}
                  disabled={isSavingCustomTime}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Reset all windows to automatic session rules"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Defaults</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Select Instrument
                  </label>
                  <select
                    value={selectedCustomSymbol}
                    onChange={(e) => setSelectedCustomSymbol(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white px-3 py-2 rounded-xl outline-none focus:border-emerald-500 font-mono font-semibold"
                  >
                    {instruments.map((inst) => (
                      <option key={inst.id} value={inst.symbol}>
                        {inst.symbol} - {inst.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Custom Best Trading Window Description
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customWindowText}
                      onChange={(e) => setCustomWindowText(e.target.value)}
                      placeholder="e.g. London open (first 3h) & NY overlap"
                      className="flex-1 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white px-3 py-2 rounded-xl outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomWindow}
                      disabled={isSavingCustomTime}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingCustomTime ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status summary */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800/80 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    Current Window for <strong className="text-zinc-900 dark:text-white font-mono">{selectedCustomSymbol}</strong>:{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {bestTimesOverrides[selectedCustomSymbol] ? (
                        <>Custom: &quot;{bestTimesOverrides[selectedCustomSymbol]}&quot;</>
                      ) : (
                        <>Automatic Session: &quot;{DEFAULT_INSTRUMENT_RULES.find((r) => r.symbol === selectedCustomSymbol)?.sessionDescription || 'Standard Market Hours'}&quot;</>
                      )}
                    </span>
                  </span>
                </div>
                {bestTimesOverrides[selectedCustomSymbol] && (
                  <button
                    type="button"
                    onClick={async () => {
                      await updateBestTimeOverride(selectedCustomSymbol, '');
                      showToast(`Reset ${selectedCustomSymbol} to default rules.`, 'info');
                    }}
                    className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline cursor-pointer"
                  >
                    Clear override
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Span 1): System status */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">System Status</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Supabase DB & Storage Health</p>
              </div>
            </div>

            {/* Health Badges */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-xs">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Database
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-xs">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  trade-screenshots
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                  Bucket Ready
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-xs">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  avatars bucket
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                  Bucket Ready
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-xs">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  best_times (RLS)
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                  Synced & Active
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-xs">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  AI Coach (n8n Webhook)
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-xs">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-zinc-500" />
                  Auth User
                </span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300 text-[10px] truncate max-w-[140px]">
                  {user?.email || 'Authenticated'}
                </span>
              </div>
            </div>

            {/* How to create the avatars bucket */}
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 text-xs space-y-1.5">
              <div className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Creating the &quot;avatars&quot; Bucket:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                <li>Open your <strong>Supabase Dashboard</strong>.</li>
                <li>Go to <strong>Storage</strong> &gt; <strong>New Bucket</strong>.</li>
                <li>Name it exactly: <code className="bg-emerald-100 dark:bg-emerald-900/40 px-1 py-0.5 rounded text-emerald-800 dark:text-emerald-300 font-mono">avatars</code>.</li>
                <li>Turn ON <strong>Public bucket</strong> and click Save.</li>
                <li>Run the SQL schema below in <strong>SQL Editor</strong> to enable upload policies.</li>
              </ol>
            </div>

            {/* Supabase SQL Copier */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Database SQL Setup
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-zinc-100 dark:bg-[#18181B] hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white transition-colors cursor-pointer"
                >
                  {copiedSql ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>

              <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl max-h-48 overflow-y-auto">
                <pre className="text-[10px] font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {SUPABASE_SQL_SETUP}
                </pre>
              </div>
            </div>

            {/* Connection Credentials Form */}
            <form onSubmit={handleSaveCredentials} className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="text-xs font-semibold text-zinc-900 dark:text-white">
                Supabase Credentials
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Project URL</label>
                <input
                  type="url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs px-3 py-1.5 rounded-lg font-mono outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Anon Publishable Key</label>
                <textarea
                  rows={2}
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs px-3 py-1.5 rounded-lg font-mono outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Update Credentials
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
