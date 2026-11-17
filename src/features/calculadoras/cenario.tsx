'use client';

import { useMemo, useState } from 'react';
import { simularCenario } from '@/core/calculadoras/cenario';
import { formatBRL } from '@/core/shared/money';
import { Card, SectionTitle } from '@/ui/primitives/card';
import { Field, Input, MoneyInput } from '@/ui/primitives/fields';
import { Destaque, LayoutCalculadora, Segmentos } from './blocos';
import { br1, campo, cents, num } from './campos';

type Preset = 'perder' | 'aumento' | 'parcela' | 'livre';

export function CalculadoraCenario({
  liquidoMensalCents,
  gastoMedioCents,
  reservaCents,
  cdiPercent,
}: {
  liquidoMensalCents: number;
  gastoMedioCents: number;
  reservaCents: number;
  /** CDI anual dos Ajustes: vira o rendimento mensal inicial da reserva. */
  cdiPercent: number;
}) {
  const [renda, setRenda] = useState(campo(liquidoMensalCents));
  const [gasto, setGasto] = useState(campo(gastoMedioCents));
  const [reserva, setReserva] = useState(campo(reservaCents));
  const [preset, setPreset] = useState<Preset>('perder');
  const [rendaCenario, setRendaCenario] = useState('');
  const [duracao, setDuracao] = useState('');
  const [variacao, setVariacao] = useState('0');
  const [extra, setExtra] = useState('');
  const [rendimento, setRendimento] = useState((((1 + cdiPercent / 100) ** (1 / 12) - 1) * 100).toFixed(2).replace('.', ','));

  const escolher = (p: Preset) => {
    setPreset(p);
    if (p === 'perder') { setRendaCenario(''); setDuracao(''); setVariacao('0'); setExtra(''); }
    if (p === 'aumento') { setRendaCenario(campo(Math.round(cents(renda) * 1.1))); setDuracao(''); setVariacao('0'); setExtra(''); }
    if (p === 'parcela') { setRendaCenario(renda); setDuracao(''); setVariacao('0'); setExtra('500,00'); }
  };

  const r = useMemo(
    () =>
      simularCenario({
        rendaCents: cents(renda),
        gastoCents: cents(gasto),
        reservaCents: cents(reserva),
        rendaNoCenarioCents: cents(rendaCenario),
        duracaoMeses: duracao.trim() === '' ? null : Math.max(1, Math.round(num(duracao, 1))),
        variacaoGastoPct: Math.max(-100, num(variacao)),
        gastoExtraCents: cents(extra),
        rendimentoMensalPct: Math.max(0, num(rendimento)),
        meses: 12,
      }),
    [renda, gasto, reserva, rendaCenario, duracao, variacao, extra, rendimento],
  );
  const fim = r.linhas[r.linhas.length - 1]!;
  return (
    <LayoutCalculadora
      campos={
        <>
          <h2 className="font-display text-base font-semibold">Hoje</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Renda líquida/mês">
              <MoneyInput value={renda} onChange={(e) => setRenda(e.target.value)} />
            </Field>
            <Field label="Gasto médio/mês" hint="Média dos últimos 3 meses.">
              <MoneyInput value={gasto} onChange={(e) => setGasto(e.target.value)} />
            </Field>
          </div>
          <Field label="Reserva de emergência">
            <MoneyInput value={reserva} onChange={(e) => setReserva(e.target.value)} />
          </Field>
          <h2 className="pt-3 font-display text-base font-semibold">E se…</h2>
          <Segmentos
            rotulo="Cenário"
            valor={preset}
            aoMudar={escolher}
            opcoes={[
              { valor: 'perder', rotulo: 'Perder a renda' },
              { valor: 'aumento', rotulo: 'Aumento de 10%' },
              { valor: 'parcela', rotulo: 'Nova parcela' },
              { valor: 'livre', rotulo: 'Livre' },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Renda no cenário/mês" hint="Ex.: seguro-desemprego.">
              <MoneyInput value={rendaCenario} onChange={(e) => { setRendaCenario(e.target.value); setPreset('livre'); }} />
            </Field>
            <Field label="Por quantos meses" hint="Vazio = daqui em diante.">
              <Input inputMode="numeric" value={duracao} onChange={(e) => { setDuracao(e.target.value); setPreset('livre'); }} />
            </Field>
            <Field label="Gastos variam (%)" hint="−20 = cortar 20%.">
              <Input inputMode="decimal" value={variacao} onChange={(e) => { setVariacao(e.target.value); setPreset('livre'); }} />
            </Field>
            <Field label="Gasto novo/mês">
              <MoneyInput value={extra} onChange={(e) => { setExtra(e.target.value); setPreset('livre'); }} />
            </Field>
          </div>
          <Field label="Rendimento da reserva (% ao mês)">
            <Input inputMode="decimal" value={rendimento} onChange={(e) => setRendimento(e.target.value)} />
          </Field>
        </>
      }
      resultado={
        <>
          <Destaque
            rotulo={r.coberturaMeses === null ? 'Sobra por mês no cenário' : 'A reserva aguenta'}
            cents={r.coberturaMeses === null ? r.sobraNoCenarioCents : undefined}
            texto={r.coberturaMeses === null ? undefined : `${br1(r.coberturaMeses)} ${r.coberturaMeses >= 1 && r.coberturaMeses < 2 ? 'mês' : 'meses'}`}
            apoio={[
              { rotulo: 'Sobra hoje', cents: r.sobraHojeCents },
              { rotulo: 'Reserva em 12 meses', cents: fim.saldoReservaCents },
            ]}
            rodape={r.mesQueAcaba ? `A reserva acaba no ${r.mesQueAcaba}º mês.` : 'A reserva não acaba nos próximos 12 meses.'}
          />
          <SectionTitle>Mês a mês</SectionTitle>
          <Card className="py-1">
            {r.linhas.map((l) => (
              <div key={l.mes} className="flex min-h-11 items-center justify-between gap-3 border-b border-border py-1.5 text-sm last:border-0">
                <span className="text-muted">Mês {l.mes}</span>
                <span className="text-xs text-muted">
                  {formatBRL(l.rendaCents)} − {formatBRL(l.gastoCents)}
                </span>
                <span className={`amount font-semibold ${l.saldoReservaCents < 0 ? 'text-expense-text' : ''}`}>
                  {formatBRL(l.saldoReservaCents)}
                </span>
              </div>
            ))}
          </Card>
        </>
      }
      aviso="Simulação: considera a renda e o gasto constantes em cada fase. Não inclui 13º, férias nem a multa do FGTS."
    />
  );
}
