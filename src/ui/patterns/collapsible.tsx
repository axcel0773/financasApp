'use client';

import { useEffect, useRef } from 'react';
import { cx } from '../cx';
import { Icon } from '../primitives/icon';

/**
 * Formulário recolhido: a tela abre mostrando informação, não campos.
 * Fecha sozinho quando um formulário dentro dele salva com sucesso (evento `action-ok` do ActionForm).
 */
export function Recolhivel({
  titulo,
  aberto = false,
  children,
  className,
}: {
  titulo: React.ReactNode;
  aberto?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fechar = () => {
      el.open = false;
    };
    el.addEventListener('action-ok', fechar);
    return () => el.removeEventListener('action-ok', fechar);
  }, []);
  return (
    <details ref={ref} open={aberto} className={cx('group rounded-xl border border-border bg-surface px-4', className)}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-soft text-link">
            <Icon name="plus" size={16} />
          </span>
          {titulo}
        </span>
        <Icon name="chevron" size={18} className="text-muted transition-transform group-open:rotate-90" />
      </summary>
      <div className="pb-4 pt-1">{children}</div>
    </details>
  );
}
