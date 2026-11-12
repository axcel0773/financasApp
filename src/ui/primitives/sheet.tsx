'use client';

import { useEffect, useRef } from 'react';
import { Icon } from './icon';

/** Bottom sheet no mobile; diálogo centralizado a partir de 768px. Usa <dialog> (foco e Esc nativos). */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className="m-0 mt-auto w-full max-w-none rounded-t-2xl bg-surface p-0 text-ink backdrop:bg-black/40 md:m-auto md:max-w-md md:rounded-2xl"
    >
      <div className="max-h-[85dvh] overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-11 w-11 items-center justify-center"
          >
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
