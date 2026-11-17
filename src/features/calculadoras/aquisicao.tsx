'use client';

import { useMemo, useState } from 'react';
import { compararAquisicao, type CustoOpcao } from '@/core/calculadoras/aquisicao';
import { formatBRL } from '@/core/shared/money';
import { Chip } from '@/ui/primitives/chip';
import { Card } from '@/ui/primitives/card';
import { Field, Input, MoneyInput } from '@/ui/primitives/fields';
import { Destaque, LayoutCalculadora } from './blocos';
import { cents, num, pct } from './campos';

const NOME: Record<CustoOpcao['opcao'], string> = { comprar: 'Comprar', alugar: 'Alugar', assinar: 'Assinar' };

export function CalculadoraAquisicao({ cdiPercent }: { cdiPercent: number }) {
  const [meses, setMeses] = useState('24');
  const [rend, setRend] = useState(pct(cdiPercent));
  const [preco, setPreco] = useState('');
  const [manut, setManut] = useState('');
  const [revenda, setRevenda] = useState('40');
  const [aluguel, setAluguel] = useState('');
  const [reajuste, setReajuste] = useState('5');
  const [assinatura, setAssinatura] = useState('');
  const r = useMemo(
    () =>
      compararAquisicao({
        horizonteMeses: Math.min(360, Math.max(1, num(meses, 24))),
        rendimentoAnualPct: Math.max(0, num(rend)),
        comprar: { precoCents: cents(preco), manutencaoMensalCents: cents(manut), revendaPct: num(revenda) },
        alugar: { mensalCents: cents(aluguel), reajusteAnualPct: num(reajuste) },
        assinar: { mensalCents: cents(assinatura) },
      }),
    [meses, rend, preco, manut, revenda, aluguel, reajuste, assinatura],
  );
  const melhor = r.opcoes.find((o) => o.opcao === r.melhor);
  const ordenadas = [...r.opcoes].sort((a, b) => a.custoCents - b.custoCents);
  return (
    <LayoutCalculadora
      campos={
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Por quanto tempo (meses)">
              <Input inputMode="numeric" value={meses} onChange={(e) => setMeses(e.target.value)} />
            </Field>
            <Field label="Rendimento do dinheiro (% a.a.)" hint="Começa no CDI dos Ajustes.">
              <Input inputMode="decimal" value={rend} onChange={(e) => setRend(e.target.value)} />
            </Field>
          </div>
          <h2 className="pt-2 font-display text-base font-semibold">Comprar</h2>
          <Field label="Preço à vista">
            <MoneyInput value={preco} onChange={(e) => setPreco(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Manutenção/mês" hint="Seguro, revisão, IPVA ÷ 12…">
              <MoneyInput value={manut} onChange={(e) => setManut(e.target.value)} />
            </Field>
            <Field label="Revenda no fim (% do preço)">
              <Input inputMode="decimal" value={revenda} onChange={(e) => setRevenda(e.target.value)} />
            </Field>
          </div>
          <h2 className="pt-2 font-display text-base font-semibold">Alugar</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Aluguel/mês">
              <MoneyInput value={aluguel} onChange={(e) => setAluguel(e.target.value)} />
            </Field>
            <Field label="Reajuste ao ano (%)">
              <Input inputMode="decimal" value={reajuste} onChange={(e) => setReajuste(e.target.value)} />
            </Field>
          </div>
          <h2 className="pt-2 font-display text-base font-semibold">Assinar</h2>
          <Field label="Assinatura/mês">
            <MoneyInput value={assinatura} onChange={(e) => setAssinatura(e.target.value)} />
          </Field>
        </>
      }
      resultado={
        <>
          <Destaque
            rotulo={melhor ? 'Sai mais barato' : 'Preencha ao menos uma opção'}
            texto={melhor ? NOME[melhor.opcao] : '—'}
            apoio={
              melhor
                ? [
                    { rotulo: 'Custo em valor de hoje', cents: melhor.custoCents },
                    { rotulo: 'Por mês de uso', cents: melhor.porMesCents },
                  ]
                : []
            }
          />
          {ordenadas.length > 0 && (
            <Card className="py-1">
              {ordenadas.map((o) => (
                <div key={o.opcao} className="flex min-h-14 items-center justify-between gap-3 border-b border-border py-2 last:border-0">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-semibold">
                      {NOME[o.opcao]} {o.opcao === r.melhor && <Chip tom="ok">melhor</Chip>}
                    </span>
                    <span className="block text-xs text-muted">Sai do bolso: {formatBRL(o.totalPagoCents)}</span>
                  </span>
                  <span className="amount shrink-0 font-semibold">{formatBRL(o.custoCents)}</span>
                </div>
              ))}
            </Card>
          )}
        </>
      }
      aviso="O custo em valor de hoje desconta o que o dinheiro renderia aplicado e soma a revenda no fim, trazida a valor de hoje. Não considera financiamento, desgaste além da revenda informada nem impostos sobre o rendimento."
    />
  );
}
