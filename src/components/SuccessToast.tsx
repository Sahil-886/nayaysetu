'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  subtext?: string;
  visible: boolean;
  onDismiss: () => void;
  durationMs?: number;
}

export const SuccessToast: React.FC<ToastProps> = ({
  message,
  subtext,
  visible,
  onDismiss,
  durationMs = 4000,
}) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setExiting(false);
      return;
    }

    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 250);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [visible, durationMs, onDismiss]);

  if (!visible && !exiting) return null;

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 250);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div
        className={`flex items-center space-x-3 px-5 py-3 bg-white border border-emerald-200 rounded-xl shadow-2xl ${
          exiting ? 'toast-exit' : 'toast-enter'
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="p-1.5 bg-emerald-50 rounded-full border border-emerald-200">
          <CheckCircle className="w-4 h-4 text-[#2C7A4B]" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#0B1528]">{message}</p>
          {subtext && (
            <p className="text-[10px] text-slate-500 mt-0.5">{subtext}</p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-premium ml-2"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
