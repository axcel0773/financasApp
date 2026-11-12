'use client';

import { useMemo, useState } from 'react';
import { simularAportes } from '@/core/investments/domain';
import { formatBRL, parseBRL } from '@/core/shared/money';
import { rotuloCompetencia } from '@/ui/format';
import { StepLine } from '@/ui/charts/step-line';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { Card } from '@/ui/primitives/card';
import { Field, Input, MoneyInput } from '@/ui/primitives/fields';

const num = (s: string, d = 0) => {
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : d;
};

/** Cálculo 100% no navegador: nada é enviado ao servidor. Aporte no fim de cada mês; valor real deflacionado pelo IPCA. */
export function SimuladorForm({
  ipca,
  cdi,
  inicio,
}: {
  ipca: number;
  cdi: number;
  inicio: string;
}) {
  const [inicial, setInicial] = useState('0,00');
  const [aporte, setAporte] = useState('1000,00');
  const [anos, setAnos] = useState('5');
  const [taxa, setTaxa] = useState(String(cdi).replace('.', ','));
  const [ipcaS, setIpcaS] = useState(String(ipca).replace('.', ','));
  const meses = Math.min(600, Math.max(1, Math.round(num(anos, 1) * 12)));
  const pontos = useMemo(
    () =>
      simularAportes({
        inicialCents: parseBRL(inicial).ok
          ? (parseBRL(inicial) as { ok: true; value: number }).value
          : 0,
        aporteMensalCents: parseBRL(aporte).ok
          ? (parseBRL(aporte) as { ok: true; value: number }).value
          : 0,
        meses,
        taxaAnualPercent: Math.max(0, num(taxa)),
        ipcaAnualPercent: Math.max(0, num(ipcaS)),
        inicio,
      }),
    [inicial, aporte, meses, taxa, ipcaS, inicio],
  );
  const ultimo = pontos[pontos.length - 1];
  return (
    <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
      <Card className="space-y-3">
        <Field label="Valor inicial">
          <MoneyInput value={inicial} onChange={(e) => setInicial(e.target.value)} />
        </Field>
        <Field label="Aporte mensal">
          <MoneyInput value={aporte} onChange={(e) => setAporte(e.target.value)} />
        </Field>
        <Field label="Prazo (anos)">
          <Input inputMode="numeric" value={anos} onChange={(e) => setAnos(e.target.value)} />
        </Field>
        <Field
          label="Taxa anual %"
          hint={`Começa no CDI esperado (${String(cdi).replace('.', ',')}%) dos Ajustes.`}
        >
          <Input inputMode="decimal" value={taxa} onChange={(e) => setTaxa(e.target.value)} />
        </Field>
        <Field label="IPCA anual %">
          <Input inputMode="decimal" value={ipcaS} onChange={(e) => setIpcaS(e.target.value)} />
        </Field>
      </Card>
      <div className="space-y-4">
        {ultimo && (
          <Card className="space-y-3" aria-live="polite">
            <div>
              <p className="text-sm text-muted">Em {rotuloCompetencia(ultimo.competencia)}</p>
              <AmountDisplay cents={ultimo.saldoCents} size="xl" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted">Aportado</p>
                <span className="amount font-semibold">{formatBRL(ultimo.aportadoCents)}</span>
              </div>
              <div>
                <p className="text-muted">Rendimento</p>
                <span className="amount font-semibold">
                  {formatBRL(ultimo.saldoCents - ultimo.aportadoCents)}
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-muted">Valor de hoje (descontado o IPCA)</p>
                <span className="amount font-semibold">{formatBRL(ultimo.saldoRealCents)}</span>
              </div>
            </div>
            <StepLine
              pontos={pontos
                .filter(
                  (_, i) =>
                    i % Math.max(1, Math.floor(pontos.length / 24)) === 0 ||
                    i === pontos.length - 1,
                )
                .map((p) => ({ label: rotuloCompetencia(p.competencia), value: p.saldoCents }))}
              titulo="Evolução do saldo"
            />
          </Card>
        )}
        <p className="text-xs text-muted">
          Simulação ilustrativa, sem impostos nem taxas. Não é recomendação de investimento.
        </p>
      </div>
    </div>
  );
}
