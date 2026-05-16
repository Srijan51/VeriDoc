'use client';

import React from 'react';
import { useToast } from '@/lib/hooks/useToast';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-slide-up
            flex items-center justify-between gap-4 pointer-events-auto
            backdrop-blur-md border
            ${
              toast.type === 'success'
                ? 'bg-accent-mint/90 text-white border-accent-mint/50'
                : toast.type === 'error'
                ? 'bg-severity-critical/90 text-white border-severity-critical/50'
                : toast.type === 'warning'
                ? 'bg-severity-medium/90 text-white border-severity-medium/50'
                : 'bg-text-primary/90 text-white border-text-primary/50'
            }
          `}
          style={{ minWidth: '280px', maxWidth: '420px' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[16px]">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'info' && 'ℹ'}
            </span>
            <span className="text-[13px]">{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-current opacity-60 hover:opacity-100 transition-opacity ml-2 shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
