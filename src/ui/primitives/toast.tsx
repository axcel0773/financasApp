'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface ToastItem {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}
const Ctx = createContext<{ show: (message: string, action?: ToastItem['action']) => void }>({
  show: () => {},
});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const show = useCallback((message: string, action?: ToastItem['action']) => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l, { id, message, action }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 6000);
  }, []);
  const value = useMemo(() => ({ show }), [show]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex min-h-12 w-full max-w-sm items-center justify-between gap-3 rounded-md bg-primary-dark px-4 text-sm text-white shadow-lg"
          >
            <span>{t.message}</span>
            {t.action && (
              <button
                className="min-h-11 font-bold underline"
                onClick={() => {
                  t.action?.run();
                  setItems((l) => l.filter((x) => x.id !== t.id));
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
