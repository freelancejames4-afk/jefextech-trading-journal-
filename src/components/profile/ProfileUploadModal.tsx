import React, { useState, useRef } from 'react';
import { X, Upload, Trash2, Check, User, Camera, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useJournal } from '../../contexts/JournalContext';
import { useToast } from '../common/Toast';
import { uploadAvatarImage } from '../../lib/supabase';

interface ProfileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileUploadModal: React.FC<ProfileUploadModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { avatarUrl, updateAvatarUrl } = useJournal();
  const { showToast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please choose a valid JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError('Image must be 3MB or less.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    if (!user) {
      showToast('You must be logged in to save your profile photo.', 'error');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const uploadedUrl = await uploadAvatarImage(selectedFile, user.id);
      await updateAvatarUrl(uploadedUrl);
      showToast('Profile logo updated successfully!', 'success');
      onClose();
    } catch (err: any) {
      console.error('Failed to update avatar:', err);
      const msg = err.message || 'Failed to upload profile photo. Make sure the "avatars" bucket is created in Supabase.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove your profile logo?')) return;
    setIsSaving(true);
    try {
      await updateAvatarUrl(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      showToast('Profile logo removed. Reset to default logo.', 'info');
      onClose();
    } catch (err: any) {
      console.error('Error removing avatar:', err);
      showToast('Failed to remove profile logo.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const displayedImage = previewUrl || avatarUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#0E0E11]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Profile Logo</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Appears next to Jefextech Journal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500/80 shadow-md bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                {displayedImage ? (
                  <img
                    src={displayedImage}
                    alt="Logo Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-zinc-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-medium cursor-pointer"
              >
                <Camera className="w-5 h-5 mb-1" />
                Change
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                {user?.email || 'Logged in Trader'}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                JPG, PNG, or WEBP (Max 3MB)
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action trigger if no file chosen yet */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-zinc-100 dark:bg-[#18181B] hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-900 dark:text-white transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{selectedFile ? 'Choose another image' : 'Select from computer'}</span>
            </button>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isSaving}
                className="py-2 px-3 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Remove photo and use default logo"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Remove photo</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#0E0E11]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedFile || isSaving}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Logo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
