'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Envio de Server Actions sem useTransition/useActionState.
 *
 * Motivo: no Next 15 + React 19 a transição às vezes nunca termina — a ação responde, o dado é salvo,
 * mas a tela fica em "Salvando…" ou não aplica a resposta. Aqui o estado de envio é nosso e sempre volta.
 * É o ÚNICO lugar com esse contorno: quando o Next/React corrigirem, basta simplificar este arquivo.
 */
export function useEnvio() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const emVoo = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /** Roda `fn` com trava contra envio duplo. Devolve `undefined` se já havia um envio em curso. */
  const enviar = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (emVoo.current) return undefined;
    emVoo.current = true;
    setPending(true);
    try {
      return await fn();
    } finally {
      emVoo.current = false;
      setPending(false);
    }
  }, []);

  /** Pede a tela de novo agora e mais duas vezes (medido no CI: uma só atualização falhava em ~50%). */
  const atualizarTela = useCallback(() => {
    router.refresh();
    for (const ms of [1200, 3000]) timers.current.push(setTimeout(() => router.refresh(), ms));
  }, [router]);

  /** Navega; se o router não concluir em 2,5 s, força a ida pelo navegador. */
  const navegar = useCallback(
    (href: string) => {
      const origem = window.location.pathname + window.location.search;
      router.push(href);
      // sem guardar em `timers`: precisa disparar mesmo se este componente sair da tela
      setTimeout(() => {
        if (window.location.pathname + window.location.search === origem) window.location.assign(href);
      }, 2500);
    },
    [router],
  );

  return { pending, enviar, atualizarTela, navegar };
}
