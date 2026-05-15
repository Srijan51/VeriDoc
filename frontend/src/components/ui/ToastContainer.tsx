'use client';

import React from 'react';
import { useToast } from '@/lib/hooks/useToast';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            px-4 py-3 rounded-lg text-sm font-medium shadow-lg animate-slide-up
            flex items-center justify-between gap-4 pointer-events-auto
            ${
              toast.type === 'success'
                ? 'bg-accent-mint/90 text-white'
                : toast.type === 'error'
                ? 'bg-severity-critical/90 text-white'
                : toast.type === 'warning'
                ? 'bg-yellow-500/90 text-white'
                : 'bg-text-primary/90 text-white'
            }
          `}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-current opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
