'use client';

import { useEffect, useRef, useState } from 'react';
import { cx } from '@/ui/cx';

export interface PainelAcao {
  chave: string;
  rotulo: string;
  conteudo: React.ReactNode;
}

/** Ações do investimento em botões segmentados: abre um painel por vez e fecha ao salvar (ou ao tocar de novo). */
export function AcoesInvestimento({ paineis }: { paineis: PainelAcao[] }) {
  const [aberto, setAberto] = useState<string | null>(null);
  const area = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const fechar = () => setAberto(null);
    el.addEventListener('action-ok', fechar);
    return () => el.removeEventListener('action-ok', fechar);
  }, []);
  const atual = paineis.find((p) => p.chave === aberto);
  return (
    <div ref={area} className="mt-3 space-y-3">
      <div role="group" aria-label="Ações do investimento" className="grid grid-cols-3 gap-2">
        {paineis.map((p) => {
          const ativo = p.chave === aberto;
          return (
            <button
              key={p.chave}
              type="button"
              aria-expanded={ativo}
              aria-controls={`painel-${p.chave}`}
              onClick={() => setAberto(ativo ? null : p.chave)}
              className={cx(
                'min-h-11 rounded-full border px-2 text-sm font-semibold transition-colors',
                ativo
                  ? 'border-primary bg-primary text-primary-fg'
                  : 'border-border bg-surface text-ink hover:bg-soft',
              )}
            >
              {p.rotulo}
            </button>
          );
        })}
      </div>
      {atual && (
        <div id={`painel-${atual.chave}`} className="rounded-lg bg-soft p-4">
          {atual.conteudo}
        </div>
      )}
    </div>
  );
}
