'use client';

import { useMemo, useState } from 'react';
import { compararPropostas, type TabelasFiscais } from '@/core/calculadoras/pacote';
import { formatBRL } from '@/core/shared/money';
import { Card, SectionTitle } from '@/ui/primitives/card';
import { Field, MoneyInput } from '@/ui/primitives/fields';
import { Destaque, LayoutCalculadora, LinhaValor } from './blocos';
import { br1, cents } from './campos';
import { CamposPacote } from './pacote';
import { paraEntrada, type ValoresPacote } from './valores-pacote';

export function CalculadoraProposta({ tabelas, inicial }: { tabelas: TabelasFiscais; inicial: ValoresPacote }) {
  const [atual, setAtual] = useState(inicial);
  const [nova, setNova] = useState<ValoresPacote>({ ...inicial, plr: '', saude: '', outros: '' });
  const [custoAtual, setCustoAtual] = useState('');
  const [custoNova, setCustoNova] = useState('');
  const r = useMemo(
    () =>
      compararPropostas(
        { ...paraEntrada(atual), custoMensalCents: cents(custoAtual) },
        { ...paraEntrada(nova), custoMensalCents: cents(custoNova) },
        tabelas,
      ),
    [atual, nova, custoAtual, custoNova, tabelas],
  );
  const ganha = r.diferencaAnualCents >= 0;
  return (
    <LayoutCalculadora
      campos={
        <>
          <h2 className="font-display text-base font-semibold">Emprego atual</h2>
          <CamposPacote v={atual} mudar={setAtual} prefixo="Atual" />
          <Field label="Atual: custo mensal para trabalhar" hint="Transporte, estacionamento, almoço fora…">
            <MoneyInput value={custoAtual} onChange={(e) => setCustoAtual(e.target.value)} />
          </Field>
          <h2 className="pt-3 font-display text-base font-semibold">Proposta</h2>
          <CamposPacote v={nova} mudar={setNova} prefixo="Proposta" />
          <Field label="Proposta: custo mensal para trabalhar">
            <MoneyInput value={custoNova} onChange={(e) => setCustoNova(e.target.value)} />
          </Field>
        </>
      }
      resultado={
        <>
          <Destaque
            rotulo={ganha ? 'A proposta paga a mais por ano' : 'A proposta paga a menos por ano'}
            cents={Math.abs(r.diferencaAnualCents)}
            apoio={[
              { rotulo: 'Por mês', cents: Math.abs(r.diferencaMensalCents) },
              { rotulo: 'Variação', texto: r.variacaoPct === null ? '—' : `${r.variacaoPct >= 0 ? '+' : '−'}${br1(Math.abs(r.variacaoPct))}%` },
            ]}
            rodape="Já descontado o custo para trabalhar de cada lado."
          />
          <SectionTitle>Lado a lado (por ano)</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {[
              { t: 'Atual', p: r.atual, c: cents(custoAtual) },
              { t: 'Proposta', p: r.nova, c: cents(custoNova) },
            ].map((x) => (
              <Card key={x.t} className="min-w-0">
                <p className="text-sm font-semibold">{x.t}</p>
                <p className="amount text-lg font-semibold">{formatBRL(x.p.totalAnualCents - x.c * 12)}</p>
                <p className="text-xs text-muted">{formatBRL(x.p.equivalenteMensalCents - x.c)} por mês</p>
              </Card>
            ))}
          </div>
          <Card>
            <h2 className="mb-1 font-display text-base font-semibold">Proposta em detalhe</h2>
            {r.nova.linhas.map((l) => (
              <LinhaValor key={l.rotulo} rotulo={l.rotulo} cents={l.anualCents} />
            ))}
          </Card>
        </>
      }
      aviso="Estimativa. Compare também o que não vira dinheiro: plano de carreira, estabilidade, horário e modelo de trabalho."
    />
  );
}
