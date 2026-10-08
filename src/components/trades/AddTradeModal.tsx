import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useJournal } from '../../contexts/JournalContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/Toast';
import { uploadTradeScreenshot } from '../../lib/supabase';
import { TRADING_SESSIONS, TRADING_STRATEGIES, TRADING_EMOTIONS } from '../../lib/constants';
import { Trade, TradeDirection, TradeResult } from '../../types';
import {
  X,
  UploadCloud,
  Trash2,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  CheckCircle2,
  Check,
  AlertCircle,
  RotateCcw,
  Loader2,
} from 'lucide-react';

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeToEdit?: Trade | null;
  defaultInstrumentId?: string;
  onAddInstrumentShortcut?: () => void;
}

interface TradeDraftData {
  instrumentId: string;
  direction: TradeDirection;
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  takeProfit: string;
  lotSize: string;
  result: TradeResult;
  pnl: string;
  strategy: string;
  session: string;
  emotion: string;
  notes: string;
  screenshotUrls: string[];
  updatedAt?: number;
}

interface UploadingImageItem {
  id: string;
  fileName: string;
  previewUrl: string;
  status: 'uploading' | 'done' | 'error';
  errorMessage?: string;
}

export const AddTradeModal: React.FC<AddTradeModalProps> = ({
  isOpen,
  onClose,
  tradeToEdit,
  defaultInstrumentId,
  onAddInstrumentShortcut,
}) => {
  const { instruments, addTrade, updateTrade } = useJournal();
  const { user } = useAuth();
  const { showToast } = useToast();

  const draftStorageKey = useMemo(() => {
    return `jefex_trade_draft_${user?.id || 'default'}`;
  }, [user?.id]);

  // Form states
  const [instrumentId, setInstrumentId] = useState('');
  const [direction, setDirection] = useState<TradeDirection>('buy');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [exitPrice, setExitPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [lotSize, setLotSize] = useState<string>('1.0');
  const [result, setResult] = useState<TradeResult>('win');
  const [pnl, setPnl] = useState<string>('');
  const [strategy, setStrategy] = useState<string>('Breakout');
  const [session, setSession] = useState<string>('London Open');
  const [emotion, setEmotion] = useState<string>('Disciplined');
  const [notes, setNotes] = useState<string>('');
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);

  // Async upload tracking state for individual images
  const [uploadingImages, setUploadingImages] = useState<UploadingImageItem[]>([]);

  // Draft status & save error
  const [draftStatus, setDraftStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isInitializedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDraft = useCallback((): TradeDraftData | null => {
    try {
      const stored = localStorage.getItem(draftStorageKey);
      if (!stored) return null;
      return JSON.parse(stored) as TradeDraftData;
    } catch (e) {
      console.warn('Failed to parse draft from localStorage:', e);
      return null;
    }
  }, [draftStorageKey]);

  const initForm = useCallback(() => {
    if (tradeToEdit) {
      setInstrumentId(tradeToEdit.instrument_id);
      setDirection(tradeToEdit.direction);
      setEntryPrice(tradeToEdit.entry_price?.toString() || '');
      setExitPrice(tradeToEdit.exit_price ? tradeToEdit.exit_price.toString() : '');
      setStopLoss(tradeToEdit.stop_loss ? tradeToEdit.stop_loss.toString() : '');
      setTakeProfit(tradeToEdit.take_profit ? tradeToEdit.take_profit.toString() : '');
      setLotSize(tradeToEdit.lot_size?.toString() || '1.0');
      setResult(tradeToEdit.result);
      setPnl(tradeToEdit.pnl?.toString() || '');
      setStrategy(tradeToEdit.strategy || 'Breakout');
      setSession(tradeToEdit.session || 'London Open');
      setEmotion(tradeToEdit.emotion || 'Disciplined');
      setNotes(tradeToEdit.notes || '');
      setScreenshotUrls(tradeToEdit.screenshot_urls || []);
      setUploadingImages([]);
      setDraftStatus('idle');
      return;
    }

    const draft = loadDraft();
    if (draft) {
      setInstrumentId(draft.instrumentId || (instruments[0]?.id ?? ''));
      setDirection(draft.direction || 'buy');
      setEntryPrice(draft.entryPrice || '');
      setExitPrice(draft.exitPrice || '');
      setStopLoss(draft.stopLoss || '');
      setTakeProfit(draft.takeProfit || '');
      setLotSize(draft.lotSize || '1.0');
      setResult(draft.result || 'win');
      setPnl(draft.pnl || '');
      setStrategy(draft.strategy || 'Breakout');
      setSession(draft.session || 'London Open');
      setEmotion(draft.emotion || 'Disciplined');
      setNotes(draft.notes || '');
      setScreenshotUrls(draft.screenshotUrls || []);
      setUploadingImages([]);
      setDraftStatus('saved');
      if (draft.updatedAt) {
        setDraftSavedAt(new Date(draft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } else {
      if (instruments.length > 0) {
        setInstrumentId(defaultInstrumentId || instruments[0].id);
      }
      setDirection('buy');
      setEntryPrice('');
      setExitPrice('');
      setStopLoss('');
      setTakeProfit('');
      setLotSize('1.0');
      setResult('win');
      setPnl('');
      setStrategy('Breakout');
      setSession('London Open');
      setEmotion('Disciplined');
      setNotes('');
      setScreenshotUrls([]);
      setUploadingImages([]);
      setDraftStatus('idle');
      setDraftSavedAt(null);
    }
  }, [tradeToEdit, loadDraft, instruments, defaultInstrumentId]);

  useEffect(() => {
    if (isOpen) {
      initForm();
      isInitializedRef.current = true;
      setSaveError(null);
    } else {
      isInitializedRef.current = false;
    }
  }, [isOpen, tradeToEdit]);

  useEffect(() => {
    if (isOpen && !instrumentId && instruments.length > 0) {
      setInstrumentId(defaultInstrumentId || instruments[0].id);
    }
  }, [isOpen, instrumentId, instruments, defaultInstrumentId]);

  // 1. AUTO-SAVE DRAFT (Debounced 500ms)
  useEffect(() => {
    if (!isOpen || tradeToEdit || !isInitializedRef.current) return;

    setDraftStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      const draftData: TradeDraftData = {
        instrumentId,
        direction,
        entryPrice,
        exitPrice,
        stopLoss,
        takeProfit,
        lotSize,
        result,
        pnl,
        strategy,
        session,
        emotion,
        notes,
        screenshotUrls,
        updatedAt: now,
      };

      try {
        localStorage.setItem(draftStorageKey, JSON.stringify(draftData));
        setDraftStatus('saved');
        setDraftSavedAt(
          new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      } catch (err) {
        console.warn('Failed to save draft to localStorage:', err);
        setDraftStatus('idle');
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    isOpen,
    tradeToEdit,
    draftStorageKey,
    instrumentId,
    direction,
    entryPrice,
    exitPrice,
    stopLoss,
    takeProfit,
    lotSize,
    result,
    pnl,
    strategy,
    session,
    emotion,
    notes,
    screenshotUrls,
  ]);

  const handleDiscardDraft = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    try {
      localStorage.removeItem(draftStorageKey);
    } catch (e) {
      // ignore
    }

    setInstrumentId(instruments[0]?.id || '');
    setDirection('buy');
    setEntryPrice('');
    setExitPrice('');
    setStopLoss('');
    setTakeProfit('');
    setLotSize('1.0');
    setResult('win');
    setPnl('');
    setStrategy('Breakout');
    setSession('London Open');
    setEmotion('Disciplined');
    setNotes('');
    setScreenshotUrls([]);
    setUploadingImages([]);
    setDraftStatus('idle');
    setDraftSavedAt(null);
    setSaveError(null);
    showToast('Draft discarded. Form cleared.', 'info');
  };

  const isDirty = useMemo(() => {
    if (tradeToEdit) return true;
    return Boolean(
      entryPrice.trim() !== '' ||
      exitPrice.trim() !== '' ||
      stopLoss.trim() !== '' ||
      takeProfit.trim() !== '' ||
      notes.trim() !== '' ||
      pnl.trim() !== '' ||
      screenshotUrls.length > 0 ||
      uploadingImages.length > 0
    );
  }, [tradeToEdit, entryPrice, exitPrice, stopLoss, takeProfit, notes, pnl, screenshotUrls, uploadingImages]);

  useEffect(() => {
    if (!isOpen || !isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isOpen, isDirty]);

  // 2. SCREENSHOTS: Upload immediately when selected
  const uploadSingleFile = async (file: File) => {
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const previewUrl = URL.createObjectURL(file);

    setUploadingImages((prev) => [
      ...prev,
      {
        id: uploadId,
        fileName: file.name,
        previewUrl,
        status: 'uploading',
      },
    ]);

    try {
      const userId = user?.id || 'trader';
      const publicUrl = await uploadTradeScreenshot(file, userId);

      if (publicUrl) {
        setScreenshotUrls((prev) => [...prev, publicUrl]);
      }

      setUploadingImages((prev) => prev.filter((item) => item.id !== uploadId));
      URL.revokeObjectURL(previewUrl);
    } catch (err: any) {
      console.warn('Screenshot upload failed:', err);
      setUploadingImages((prev) =>
        prev.map((item) =>
          item.id === uploadId
            ? { ...item, status: 'error', errorMessage: err.message || 'Upload failed' }
            : item
        )
      );
      showToast(`Upload failed for ${file.name}.`, 'error');
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const validImageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validImageFiles.length === 0) {
      showToast('Please select valid image files (PNG, JPG, WEBP)', 'warning');
      return;
    }

    validImageFiles.forEach((file) => {
      uploadSingleFile(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeUploadedScreenshot = (index: number) => {
    setScreenshotUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadingItem = (id: string) => {
    setUploadingImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleAutoCalcPnl = () => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const lots = parseFloat(lotSize) || 1;

    if (isNaN(entry) || isNaN(exit)) {
      showToast('Please enter both Entry and Exit prices to calculate P&L', 'warning');
      return;
    }

    const instrument = instruments.find((i) => i.id === instrumentId);
    const diff = direction === 'buy' ? exit - entry : entry - exit;
    let estimated = diff * lots;

    if (instrument?.market_type === 'Forex') {
      estimated = diff * lots * 100000;
    } else if (instrument?.symbol === 'XAUUSD') {
      estimated = diff * lots * 100;
    }

    const rounded = Math.round(estimated * 100) / 100;
    setPnl(rounded.toString());

    if (rounded > 0) setResult('win');
    else if (rounded < 0) setResult('loss');
    else setResult('breakeven');

    showToast(`Estimated P&L calculated: $${rounded}`, 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!instrumentId) {
      showToast('Please select an instrument', 'error');
      return;
    }

    const numEntry = parseFloat(entryPrice);
    if (isNaN(numEntry) || numEntry <= 0) {
      showToast('Please enter a valid entry price', 'error');
      return;
    }

    const stillUploading = uploadingImages.some((i) => i.status === 'uploading');
    if (stillUploading) {
      showToast('Screenshots are still uploading. Please wait...', 'warning');
      return;
    }

    const numExit = exitPrice ? parseFloat(exitPrice) : null;
    const numSl = stopLoss ? parseFloat(stopLoss) : null;
    const numTp = takeProfit ? parseFloat(takeProfit) : null;
    const numLot = parseFloat(lotSize) || 1;
    const numPnl = pnl ? parseFloat(pnl) : 0;

    setIsSaving(true);

    try {
      if (tradeToEdit) {
        await updateTrade(tradeToEdit.id, {
          instrument_id: instrumentId,
          direction,
          entry_price: numEntry,
          exit_price: numExit,
          stop_loss: numSl,
          take_profit: numTp,
          lot_size: numLot,
          result,
          pnl: numPnl,
          strategy,
          session,
          emotion,
          notes,
          screenshot_urls: screenshotUrls,
        });
        showToast('Trade record updated successfully!', 'success');
      } else {
        await addTrade({
          journal_day_id: '',
          instrument_id: instrumentId,
          direction,
          entry_price: numEntry,
          exit_price: numExit,
          stop_loss: numSl,
          take_profit: numTp,
          lot_size: numLot,
          result,
          pnl: numPnl,
          strategy,
          session,
          emotion,
          notes,
          screenshot_urls: screenshotUrls,
        });

        try {
          localStorage.removeItem(draftStorageKey);
        } catch (e) {
          // ignore
        }
        showToast('Trade recorded successfully to your journal!', 'success');
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving trade to Supabase:', err);
      const msg = err.message || 'Failed to save trade. Please check connection and try again.';
      setSaveError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#0E0E11]">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                direction === 'buy'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}
            >
              {direction === 'buy' ? (
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                  {tradeToEdit ? 'Edit Trade Record' : 'Log New Execution'}
                </h2>

                {!tradeToEdit && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono tracking-wide bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800">
                    {draftStatus === 'saving' ? (
                      <>
                        <Loader2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 animate-spin" />
                        <span className="text-zinc-500">Saving...</span>
                      </>
                    ) : draftStatus === 'saved' ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Draft saved</span>
                        {draftSavedAt && <span className="text-zinc-400">({draftSavedAt})</span>}
                      </>
                    ) : (
                      <span className="text-zinc-400">Ready</span>
                    )}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {tradeToEdit ? 'Update trade levels and media' : 'Auto-saved locally so you never lose your progress'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!tradeToEdit && isDirty && (
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="text-[11px] text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Discard draft and reset form"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Discard draft</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {saveError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Saving failed:</span>
              <span>{saveError}</span>
              <span className="block text-zinc-600 dark:text-zinc-300 mt-1">
                Your entries and uploaded screenshots are preserved. You can try saving again.
              </span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Instrument & Direction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Instrument / Pair</label>
                {onAddInstrumentShortcut && (
                  <button
                    type="button"
                    onClick={onAddInstrumentShortcut}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Pair</span>
                  </button>
                )}
              </div>
              <select
                value={instrumentId}
                onChange={(e) => setInstrumentId(e.target.value)}
                required
                className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white px-3 py-2.5 rounded-xl text-sm font-mono outline-none cursor-pointer"
              >
                {instruments.map((inst) => (
                  <option key={inst.id} value={inst.id} className="bg-white dark:bg-[#121215] text-zinc-900 dark:text-white">
                    {inst.symbol} — {inst.name} ({inst.market_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Direction Segmented Control */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Order Direction</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDirection('buy')}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    direction === 'buy'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>BUY / LONG</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('sell')}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    direction === 'sell'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>SELL / SHORT</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Entry Price *
              </label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="e.g. 1.08500"
                required
                className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white px-3 py-2 rounded-xl text-sm font-mono placeholder:text-zinc-400 outline-none tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Exit Price
              </label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="e.g. 1.08950"
                className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white px-3 py-2 rounded-xl text-sm font-mono placeholder:text-zinc-400 outline-none tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Stop Loss (SL)
              </label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="e.g. 1.08200"
                className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white px-3 py-2 rounded-xl text-sm font-mono placeholder:text-zinc-400 outline-none tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Take Profit (TP)
              </label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="e.g. 1.09200"
                className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white px-3 py-2 rounded-xl text-sm font-mono placeholder:text-zinc-400 outline-none tabular-nums"
              />
            </div>
          </div>

          {/* Lot Size, Result & P&L */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Position Lot Size
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                placeholder="1.0"
                required
                className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white px-3 py-2 rounded-xl text-sm font-mono placeholder:text-zinc-400 outline-none tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Trade Result
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setResult('win')}
                  className={`py-1.5 text-[11px] font-bold uppercase rounded-lg transition-colors cursor-pointer ${
                    result === 'win'
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Win
                </button>
                <button
                  type="button"
                  onClick={() => setResult('loss')}
                  className={`py-1.5 text-[11px] font-bold uppercase rounded-lg transition-colors cursor-pointer ${
                    result === 'loss'
                      ? 'bg-red-600 text-white'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Loss
                </button>
                <button
                  type="button"
                  onClick={() => setResult('breakeven')}
                  className={`py-1.5 text-[11px] font-bold uppercase rounded-lg transition-colors cursor-pointer ${
                    result === 'breakeven'
                      ? 'bg-amber-500 text-white'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  BE
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Net P&L ($)
                </label>
                <button
                  type="button"
                  onClick={handleAutoCalcPnl}
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Calculator className="w-3 h-3" />
                  <span>Calc</span>
                </button>
              </div>
              <input
                type="number"
                step="any"
                value={pnl}
                onChange={(e) => {
                  setPnl(e.target.value);
                  const val = parseFloat(e.target.value);
                  if (val > 0) setResult('win');
                  else if (val < 0) setResult('loss');
                  else if (val === 0) setResult('breakeven');
                }}
                placeholder="+250 or -120"
                required
                className={`w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 px-3 py-2 rounded-xl text-sm font-mono placeholder:text-zinc-400 outline-none tabular-nums font-bold ${
                  parseFloat(pnl) > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : parseFloat(pnl) < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-zinc-900 dark:text-white'
                }`}
              />
            </div>
          </div>

          {/* Strategy, Session & Emotion */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Strategy / Setup
              </label>
              <input
                list="strategies-list"
                type="text"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                placeholder="e.g. FVG / Liquidity Sweep"
                className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white px-3 py-2 rounded-xl text-xs outline-none"
              />
              <datalist id="strategies-list">
                {TRADING_STRATEGIES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Market Session
              </label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
              >
                {TRADING_SESSIONS.map((sess) => (
                  <option key={sess} value={sess} className="bg-white dark:bg-[#121215] text-zinc-900 dark:text-white">
                    {sess}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Trader Mindset / Emotion
              </label>
              <select
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
              >
                {TRADING_EMOTIONS.map((emo) => (
                  <option key={emo.label} value={emo.label} className="bg-white dark:bg-[#121215] text-zinc-900 dark:text-white">
                    {emo.icon} {emo.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Trade Notes */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Execution Commentary & Review Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thesis, confluence factors, management mistakes or execution remarks..."
              rows={3}
              className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white px-3 py-2.5 rounded-xl text-xs placeholder:text-zinc-400 outline-none transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Screenshot Upload Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Chart Screenshots
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">
                Uploads immediately to 'trade-screenshots'
              </span>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 bg-zinc-50/50 dark:bg-[#18181B]/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              <UploadCloud className="w-7 h-7 mx-auto mb-1.5 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                Click to browse or drop chart screenshots here
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Uploaded immediately & persisted in draft
              </p>
            </div>

            {/* Screenshots Gallery: Previews & Upload Progress */}
            {(screenshotUrls.length > 0 || uploadingImages.length > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
                {screenshotUrls.map((url, idx) => (
                  <div
                    key={`url-${idx}`}
                    className="relative group aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#09090B]"
                  >
                    <img
                      src={url}
                      alt={`Chart screenshot ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeUploadedScreenshot(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-[9px] text-emerald-400 font-mono rounded flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" />
                      <span>Uploaded</span>
                    </span>
                  </div>
                ))}

                {uploadingImages.map((item) => (
                  <div
                    key={item.id}
                    className="relative aspect-video rounded-xl overflow-hidden border border-emerald-500/60 bg-zinc-100 dark:bg-[#09090B] flex items-center justify-center"
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.fileName}
                      className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-black/50">
                      {item.status === 'uploading' ? (
                        <>
                          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin mb-1" />
                          <span className="text-[10px] font-mono text-white leading-tight">
                            Uploading...
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-400 mb-1" />
                          <span className="text-[9px] text-red-400 leading-tight">
                            {item.errorMessage || 'Failed'}
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeUploadingItem(item.id)}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded-lg cursor-pointer"
                      title="Cancel upload"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] text-zinc-500 font-mono">
              {!tradeToEdit && draftStatus === 'saved' && (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Draft auto-saved
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving || uploadingImages.some((i) => i.status === 'uploading')}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{tradeToEdit ? 'Save Changes' : 'Record Trade'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
