'use client';

import { useState } from 'react';
import { Icon } from '@/ui/primitives/icon';

export function HideToggle() {
  const [oculto, setOculto] = useState(
    () =>
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-hide-values') === 'true',
  );
  return (
    <button
      type="button"
      aria-pressed={oculto}
      aria-label={oculto ? 'Mostrar valores' : 'Ocultar valores'}
      className="flex h-11 items-center gap-2 rounded-full bg-soft px-4 text-sm font-medium text-ink"
      onClick={() => {
        const n = !oculto;
        setOculto(n);
        document.documentElement.setAttribute('data-hide-values', String(n));
        try {
          localStorage.setItem('ocultar-valores', n ? '1' : '0');
        } catch {
          /* ignore */
        }
      }}
    >
      <Icon name={oculto ? 'eyeoff' : 'eye'} size={18} />
      <span>{oculto ? 'Mostrar' : 'Ocultar'}</span>
    </button>
  );
}
