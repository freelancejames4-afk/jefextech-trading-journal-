import React, { useState, useRef, useEffect } from 'react';
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
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeToEdit?: Trade | null;
  defaultInstrumentId?: string;
  onAddInstrumentShortcut?: () => void;
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

  // Screenshot upload state
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when opened or tradeToEdit changes
  useEffect(() => {
    if (tradeToEdit) {
      setInstrumentId(tradeToEdit.instrument_id);
      setDirection(tradeToEdit.direction);
      setEntryPrice(tradeToEdit.entry_price?.toString() || '');
      setExitPrice(tradeToEdit.exit_price?.toString() || '');
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
      setSelectedFiles([]);
      setFilePreviews([]);
    } else {
      // Default to first instrument
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
      setSelectedFiles([]);
      setFilePreviews([]);
    }
  }, [isOpen, tradeToEdit, instruments, defaultInstrumentId]);

  if (!isOpen) return null;

  // Handle files selection
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Create object URLs for previews
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removePendingFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingScreenshot = (index: number) => {
    setScreenshotUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper to auto-calculate estimated P&L
  const handleAutoCalcPnl = () => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const lots = parseFloat(lotSize) || 1;

    if (isNaN(entry) || isNaN(exit)) {
      showToast('Please enter both Entry and Exit prices to calculate P&L', 'warning');
      return;
    }

    const instrument = instruments.find((i) => i.id === instrumentId);
    let diff = direction === 'buy' ? exit - entry : entry - exit;
    let estimated = diff * lots;

    // For forex or gold, multiplier can be adjusted if applicable
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

    if (!instrumentId) {
      showToast('Please select an instrument', 'error');
      return;
    }

    const numEntry = parseFloat(entryPrice);
    if (isNaN(numEntry) || numEntry <= 0) {
      showToast('Please enter a valid entry price', 'error');
      return;
    }

    const numExit = exitPrice ? parseFloat(exitPrice) : null;
    const numSl = stopLoss ? parseFloat(stopLoss) : null;
    const numTp = takeProfit ? parseFloat(takeProfit) : null;
    const numLot = parseFloat(lotSize) || 1;
    const numPnl = pnl ? parseFloat(pnl) : 0;

    setIsUploading(true);

    try {
      // 1. Upload any pending screenshots to Supabase Storage bucket 'trade-screenshots'
      const uploadedUrls: string[] = [...screenshotUrls];
      const userId = user?.id || 'trader';

      for (const file of selectedFiles) {
        try {
          const url = await uploadTradeScreenshot(file, userId);
          if (url) {
            uploadedUrls.push(url);
          }
        } catch (uploadErr) {
          console.warn('Screenshot upload issue:', uploadErr);
        }
      }

      // 2. Build Trade Payload
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
          screenshot_urls: uploadedUrls,
        });
        showToast('Trade updated successfully!', 'success');
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
          screenshot_urls: uploadedUrls,
        });
        showToast('Trade logged successfully to your journal!', 'success');
      }

      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save trade record', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#111A2E] border border-[#1E2B45] rounded-xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2B45] bg-[#0B1220]/60">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                direction === 'buy'
                  ? 'bg-[#00C896]/15 text-[#00C896] border border-[#00C896]/30'
                  : 'bg-[#FF4D5E]/15 text-[#FF4D5E] border border-[#FF4D5E]/30'
              }`}
            >
              {direction === 'buy' ? (
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {tradeToEdit ? 'Edit Trade Record' : 'Log New Execution'}
              </h2>
              <p className="text-xs text-slate-400">
                {tradeToEdit ? 'Update trade metrics and media' : 'Record pair, levels, outcome and screenshots'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-[#16223B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Instrument & Direction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">Instrument / Pair</label>
                {onAddInstrumentShortcut && (
                  <button
                    type="button"
                    onClick={onAddInstrumentShortcut}
                    className="text-[11px] text-[#2F80FF] hover:underline flex items-center gap-1"
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
                className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3 py-2.5 rounded-lg text-sm font-mono outline-none cursor-pointer"
              >
                {instruments.map((inst) => (
                  <option key={inst.id} value={inst.id} className="bg-[#111A2E] text-white">
                    {inst.symbol} — {inst.name} ({inst.market_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Direction Segmented Control */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Order Direction</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0B1220] border border-[#1E2B45] rounded-lg">
                <button
                  type="button"
                  onClick={() => setDirection('buy')}
                  className={`py-2 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    direction === 'buy'
                      ? 'bg-[#00C896] text-[#0B1220] shadow-md shadow-[#00C896]/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>BUY / LONG</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('sell')}
                  className={`py-2 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    direction === 'sell'
                      ? 'bg-[#FF4D5E] text-white shadow-md shadow-[#FF4D5E]/20'
                      : 'text-slate-400 hover:text-white'
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
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Entry Price *
              </label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="e.g. 1.08500"
                required
                className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3 py-2 rounded-lg text-sm font-mono placeholder:text-slate-600 outline-none tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Exit Price
              </label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="e.g. 1.08950"
                className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3 py-2 rounded-lg text-sm font-mono placeholder:text-slate-600 outline-none tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Stop Loss (SL)
              </label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="e.g. 1.08200"
                className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3 py-2 rounded-lg text-sm font-mono placeholder:text-slate-600 outline-none tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Take Profit (TP)
              </label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="e.g. 1.09200"
                className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3 py-2 rounded-lg text-sm font-mono placeholder:text-slate-600 outline-none tabular-nums"
              />
            </div>
          </div>

          {/* Lot Size, Result & P&L */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
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
                className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3 py-2 rounded-lg text-sm font-mono placeholder:text-slate-600 outline-none tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Trade Result
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#0B1220] border border-[#1E2B45] rounded-lg">
                <button
                  type="button"
                  onClick={() => setResult('win')}
                  className={`py-1.5 text-[11px] font-bold uppercase rounded transition-colors ${
                    result === 'win'
                      ? 'bg-[#00C896]/20 text-[#00C896] border border-[#00C896]/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Win
                </button>
                <button
                  type="button"
                  onClick={() => setResult('loss')}
                  className={`py-1.5 text-[11px] font-bold uppercase rounded transition-colors ${
                    result === 'loss'
                      ? 'bg-[#FF4D5E]/20 text-[#FF4D5E] border border-[#FF4D5E]/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Loss
                </button>
                <button
                  type="button"
                  onClick={() => setResult('breakeven')}
                  className={`py-1.5 text-[11px] font-bold uppercase rounded transition-colors ${
                    result === 'breakeven'
                      ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  BE
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-400">
                  Net P&L ($)
                </label>
                <button
                  type="button"
                  onClick={handleAutoCalcPnl}
                  className="text-[10px] text-[#2F80FF] hover:underline flex items-center gap-1"
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
                className={`w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] px-3 py-2 rounded-lg text-sm font-mono placeholder:text-slate-600 outline-none tabular-nums font-bold ${
                  parseFloat(pnl) > 0
                    ? 'text-[#00C896]'
                    : parseFloat(pnl) < 0
                    ? 'text-[#FF4D5E]'
                    : 'text-white'
                }`}
              />
            </div>
          </div>

          {/* Strategy, Session & Emotion */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Strategy / Setup
              </label>
              <input
                list="strategies-list"
                type="text"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                placeholder="e.g. FVG / Liquidity Sweep"
                className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3 py-2 rounded-lg text-xs outline-none"
              />
              <datalist id="strategies-list">
                {TRADING_STRATEGIES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Market Session
              </label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
              >
                {TRADING_SESSIONS.map((sess) => (
                  <option key={sess} value={sess} className="bg-[#111A2E] text-white">
                    {sess}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Trader Mindset / Emotion
              </label>
              <select
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
              >
                {TRADING_EMOTIONS.map((emo) => (
                  <option key={emo.label} value={emo.label} className="bg-[#111A2E] text-white">
                    {emo.icon} {emo.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Trade Notes */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Execution Commentary & Review Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thesis, confluence factors, management mistakes or execution remarks..."
              rows={3}
              className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3 py-2.5 rounded-lg text-xs placeholder:text-slate-600 outline-none transition-colors resize-none"
            />
          </div>

          {/* Screenshot Upload Section */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-between">
              <span>Chart Screenshots (Multi-image)</span>
              <span className="text-[10px] text-slate-500">Stored in Supabase 'trade-screenshots'</span>
            </label>

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[#2F80FF] bg-[#2F80FF]/10'
                  : 'border-[#1E2B45] hover:border-[#2F80FF]/50 bg-[#0B1220]/40'
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
              <UploadCloud className="w-7 h-7 mx-auto mb-1.5 text-[#2F80FF]" />
              <p className="text-xs text-slate-300 font-medium">
                Click to browse or drop chart screenshots here
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                PNG, JPG, WEBP up to 10MB each
              </p>
            </div>

            {/* Thumbnail Previews */}
            {(screenshotUrls.length > 0 || filePreviews.length > 0) && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-3">
                {/* Existing URLs */}
                {screenshotUrls.map((url, idx) => (
                  <div
                    key={`url-${idx}`}
                    className="relative group aspect-video rounded-lg overflow-hidden border border-[#1E2B45] bg-[#0B1220]"
                  >
                    <img
                      src={url}
                      alt={`Chart screenshot ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingScreenshot(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-[#FF4D5E] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/60 text-[9px] text-white font-mono rounded">
                      Saved
                    </span>
                  </div>
                ))}

                {/* Pending Files */}
                {filePreviews.map((preview, idx) => (
                  <div
                    key={`pending-${idx}`}
                    className="relative group aspect-video rounded-lg overflow-hidden border border-[#2F80FF]/50 bg-[#0B1220]"
                  >
                    <img
                      src={preview}
                      alt={`Pending upload ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePendingFile(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-[#FF4D5E] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 px-1 py-0.5 bg-[#2F80FF]/80 text-[9px] text-white font-mono rounded">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2B45]">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-transparent hover:bg-[#16223B] border border-[#1E2B45] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-[#2F80FF] hover:bg-[#2F80FF]/90 rounded-lg shadow-lg shadow-[#2F80FF]/25 hover:shadow-[#2F80FF]/40 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Uploading & Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{tradeToEdit ? 'Save Changes' : 'Record Trade'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
