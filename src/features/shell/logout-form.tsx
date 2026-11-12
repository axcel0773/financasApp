'use client';

import { useRef } from 'react';
import { logout } from '@/app/login/actions';
import { limparFila } from '@/infra/offline/queue';
import { Button } from '@/ui/primitives/button';
import { Icon } from '@/ui/primitives/icon';

/** Sair apaga a fila offline, o cache do service worker e o IndexedDB antes de encerrar a sessão. */
export function LogoutForm() {
  const pronto = useRef(false);
  return (
    <form
      action={logout}
      onSubmit={(e) => {
        if (pronto.current) return;
        e.preventDefault();
        const form = e.currentTarget;
        void (async () => {
          try {
            await limparFila();
            const ks = await caches.keys();
            await Promise.all(ks.map((k) => caches.delete(k)));
            (await navigator.serviceWorker?.getRegistration())?.active?.postMessage('LIMPAR');
          } catch {
            /* segue */
          }
          pronto.current = true;
          form.requestSubmit();
        })();
      }}
    >
      <Button type="submit" variant="secondary" block>
        <Icon name="logout" size={18} />
        Sair
      </Button>
    </form>
  );
}
