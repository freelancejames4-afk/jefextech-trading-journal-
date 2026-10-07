import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bg = 'bg-[#16223B] border-[#1E2B45] text-white';
          let icon = <Info className="w-5 h-5 text-[#2F80FF] shrink-0" />;

          if (toast.type === 'success') {
            bg = 'bg-[#111A2E] border-[#00C896]/40 text-[#00C896]';
            icon = <CheckCircle2 className="w-5 h-5 text-[#00C896] shrink-0" />;
          } else if (toast.type === 'error') {
            bg = 'bg-[#111A2E] border-[#FF4D5E]/40 text-[#FF4D5E]';
            icon = <XCircle className="w-5 h-5 text-[#FF4D5E] shrink-0" />;
          } else if (toast.type === 'warning') {
            bg = 'bg-[#111A2E] border-[#F59E0B]/40 text-[#F59E0B]';
            icon = <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg border shadow-lg shadow-black/50 backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${bg}`}
            >
              <div className="flex items-center gap-3">
                {icon}
                <span className="text-sm font-medium text-white">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors p-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
