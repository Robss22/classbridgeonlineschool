'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastVariant = 'default' | 'error' | 'success' | 'warning' | 'info';
interface ToastOptions { 
  title: string; 
  description?: string; 
  variant?: ToastVariant; 
  durationMs?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastItem {
  id: string;
  title: string;
  description: string;
  variant: ToastVariant;
  action: {
    label: string;
    onClick: () => void;
  } | undefined;
}

const ToastContext = createContext<{ toast: (opts: ToastOptions) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((opts: ToastOptions) => {
    const id = Math.random().toString(36).slice(2);
    const item: ToastItem = {
      id,
      title: opts.title,
      description: opts.description || '',
      variant: opts.variant || 'default',
      action: opts.action || undefined
    };
    setItems(prev => [...prev, item]);
    const duration = opts.durationMs ?? 5000;
    setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setItems(prev => prev.filter(t => t.id !== id));
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  const getVariantStyles = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: 'text-green-600',
          title: 'text-green-800',
          description: 'text-green-700',
          close: 'text-green-400 hover:text-green-600'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          title: 'text-red-800',
          description: 'text-red-700',
          close: 'text-red-400 hover:text-red-600'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-800',
          description: 'text-yellow-700',
          close: 'text-yellow-400 hover:text-yellow-600'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-800',
          description: 'text-blue-700',
          close: 'text-blue-400 hover:text-blue-600'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          icon: 'text-gray-600',
          title: 'text-gray-800',
          description: 'text-gray-700',
          close: 'text-gray-400 hover:text-gray-600'
        };
    }
  };

  const getIcon = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm">
        {items.map((item, index) => {
          const styles = getVariantStyles(item.variant);
          return (
            <div
              key={item.id}
              className={`transform transition-all duration-300 ease-out border rounded-lg shadow-lg p-4 ${styles.bg}`}
              style={{
                animation: `slideInRight 0.3s ease-out ${index * 0.1}s both`
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 ${styles.icon}`}>
                  {getIcon(item.variant)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${styles.title}`}>
                    {item.title}
                  </div>
                  {item.description && (
                    <div className={`mt-1 text-sm ${styles.description}`}>
                      {item.description}
                    </div>
                  )}
                  {item.action && (
                    <button
                      onClick={item.action.onClick}
                      className="mt-2 text-xs font-medium underline hover:no-underline"
                    >
                      {item.action.label}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => removeToast(item.id)}
                  className={`flex-shrink-0 p-1 rounded-md transition-colors ${styles.close}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}


