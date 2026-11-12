'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  criarLancamentoAction,
  editarLancamentoRemotoAction,
  excluirLancamentoAction,
} from '@/app/_actions/gastos';
import { sincronizarFila } from '@/infra/offline/queue';
import { useToast } from '@/ui/primitives/toast';

/** Aplica tema e "ocultar valores", registra o service worker e sincroniza a fila offline. */
export function ShellEffects({
  tema,
  ocultar,
}: {
  tema: 'system' | 'light' | 'dark';
  ocultar: boolean;
}) {
  const router = useRouter();
  const { show } = useToast();

  useEffect(() => {
    const el = document.documentElement;
    if (tema === 'system') el.removeAttribute('data-theme');
    else el.setAttribute('data-theme', tema);
    let oculto = ocultar;
    try {
      const salvo = localStorage.getItem('ocultar-valores');
      if (salvo !== null) oculto = salvo === '1';
    } catch {
      /* sem armazenamento */
    }
    el.setAttribute('data-hide-values', String(oculto));
  }, [tema, ocultar]);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const novo = reg.installing;
          novo?.addEventListener('statechange', () => {
            if (novo.state === 'installed' && navigator.serviceWorker.controller) {
              show('Nova versão disponível.', {
                label: 'Atualizar',
                run: () => {
                  navigator.serviceWorker.addEventListener(
                    'controllerchange',
                    () => location.reload(),
                    { once: true },
                  );
                  novo.postMessage('SKIP_WAITING');
                },
              });
            }
          });
        });
      })
      .catch(() => {
        /* PWA é melhoria progressiva */
      });
  }, [show]);

  useEffect(() => {
    let rodando = false;
    const sync = async () => {
      if (rodando || !navigator.onLine) return;
      rodando = true;
      try {
        const r = await sincronizarFila(async (i) => {
          if (i.op === 'excluir') return excluirLancamentoAction(i.alvoId);
          if (i.op === 'editar')
            return editarLancamentoRemotoAction({
              id: i.alvoId,
              walletId: i.walletId,
              categoryId: i.categoryId,
              amountCents: i.amountCents,
              occurredOn: i.occurredOn,
              note: i.note,
            });
          return criarLancamentoAction({
            clientId: i.clientId,
            walletId: i.walletId,
            categoryId: i.categoryId,
            kind: i.kind,
            amountCents: i.amountCents,
            occurredOn: i.occurredOn,
            note: i.note,
          });
        });
        if (r.enviados > 0) {
          show(`${r.enviados} alteração(ões) enviada(s).`);
          router.refresh();
        }
      } catch {
        /* tenta de novo na próxima vez */
      } finally {
        rodando = false;
      }
    };
    void sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [router, show]);

  return null;
}
