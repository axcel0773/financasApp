'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cx } from '../cx';
import { Icon } from '../primitives/icon';
import { NavLink } from './nav-link';
import { NAV_PRINCIPAL } from './nav-items';

const TOPO = 80; // perto do topo a barra sempre aparece
const LIMIAR = 6; // ignora tremidas do dedo

/** Campos que abrem o teclado: com ele aberto a barra sai de cima do formulário. */
const ehCampo = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    (el.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit'].includes((el as HTMLInputElement).type)));

/**
 * Mobile (< 768px): pílula flutuante com o botão "+" ao centro.
 * Some ao rolar para baixo (lendo) e volta ao rolar para cima, no topo, no fim da página,
 * ao trocar de tela ou quando o foco do teclado entra nela.
 */
export function BottomNav() {
  const [a, b, c, , e] = NAV_PRINCIPAL;
  const [visivel, setVisivel] = useState(true);
  const teclado = useRef(false);
  const pathname = usePathname();

  useEffect(() => setVisivel(true), [pathname]);

  useEffect(() => {
    let ultimo = window.scrollY;
    let agendado = false;
    const avaliar = () => {
      agendado = false;
      const y = window.scrollY;
      const delta = y - ultimo;
      const noFim = y + window.innerHeight >= document.documentElement.scrollHeight - 4;
      if (teclado.current) setVisivel(false);
      else if (y < TOPO || noFim) setVisivel(true);
      else if (delta > LIMIAR) setVisivel(false);
      else if (delta < -LIMIAR) setVisivel(true);
      if (Math.abs(delta) > LIMIAR || y < TOPO) ultimo = y;
    };
    const aoRolar = () => {
      if (!agendado) {
        agendado = true;
        requestAnimationFrame(avaliar);
      }
    };
    const entrou = (ev: FocusEvent) => {
      if (ehCampo(ev.target)) {
        teclado.current = true;
        setVisivel(false);
      }
    };
    const saiu = (ev: FocusEvent) => {
      if (ehCampo(ev.target) && !ehCampo(ev.relatedTarget)) {
        teclado.current = false;
        setVisivel(true);
      }
    };
    window.addEventListener('scroll', aoRolar, { passive: true });
    document.addEventListener('focusin', entrou);
    document.addEventListener('focusout', saiu);
    return () => {
      window.removeEventListener('scroll', aoRolar);
      document.removeEventListener('focusin', entrou);
      document.removeEventListener('focusout', saiu);
    };
  }, []);

  return (
    <div
      data-visivel={visivel}
      className={cx(
        'pointer-events-none fixed inset-x-0 bottom-0 z-20 px-5 pb-[calc(env(safe-area-inset-bottom)+14px)] transition-transform duration-200 ease-out motion-reduce:transition-none md:hidden',
        !visivel && 'translate-y-[calc(100%+8px)]',
      )}
    >
      <nav
        aria-label="Navegação principal"
        // navegando por teclado/leitor de tela, o foco traz a barra de volta
        onFocus={() => setVisivel(true)}
        className="pointer-events-auto mx-auto flex h-16 max-w-md items-center gap-0.5 rounded-full border border-border bg-surface px-2 shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
      >
        <NavLink item={a!} variante="bottom" />
        <NavLink item={b!} variante="bottom" />
        <Link
          href="/gastos/novo"
          aria-label="Novo lançamento"
          className="fab mx-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg"
        >
          <Icon name="plus" size={24} />
        </Link>
        <NavLink item={c!} variante="bottom" />
        <NavLink item={e!} variante="bottom" />
      </nav>
    </div>
  );
}
