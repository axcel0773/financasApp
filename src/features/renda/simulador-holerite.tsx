'use client';

import { useMemo, useState } from 'react';
import { estimar13o, estimarFerias, estimarHolerite, type Faixa, type ParamsIrrf } from '@/core/income/holerite';
import { formatBRL, parseBRL } from '@/core/shared/money';
import { Card, SectionTitle } from '@/ui/primitives/card';
import { Field, Input, MoneyInput } from '@/ui/primitives/fields';

type Tabelas = { inss: Faixa[]; irrf: Faixa[]; paramsIrrf: ParamsIrrf };

const cents = (s: string) => {
  const r = parseBRL(s || '0');
  return r.ok ? r.value : 0;
};
const inteiro = (s: string, max: number) => Math.min(max, Math.max(0, Math.floor(Number(s) || 0)));

function Linha({ rotulo, valor, forte }: { rotulo: string; valor: number; forte?: boolean }) {
  return (
    <div className={`flex justify-between py-1 text-sm ${forte ? 'font-semibold' : ''}`}>
      <span>{rotulo}</span>
      <span className="amount">{formatBRL(valor)}</span>
    </div>
  );
}

/** Simulação local (nada é salvo): holerite mensal, 13º e férias com as tabelas cadastradas. PLR não é calculada. */
export function SimuladorHolerite({ tabelas, brutoInicial }: { tabelas: Tabelas; brutoInicial: string }) {
  const [bruto, setBruto] = useState(brutoInicial);
  const [extras, setExtras] = useState('');
  const [dep, setDep] = useState('0');
  const [pensao, setPensao] = useState('');
  const [dias, setDias] = useState('30');

  const r = useMemo(() => {
    const base = { dependentes: inteiro(dep, 10), pensaoCents: cents(pensao) || undefined, ...tabelas };
    const g = cents(bruto);
    return {
      mensal: estimarHolerite({ ...base, grossCents: g + cents(extras), paramsIrrf: tabelas.paramsIrrf }),
      decimo: estimar13o({ ...base, grossCents: g }),
      ferias: estimarFerias({ ...base, grossMensalCents: g, dias: inteiro(dias, 30) || 30 }),
    };
  }, [bruto, extras, dep, pensao, dias, tabelas]);

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <Field label="Salário bruto"><MoneyInput value={bruto} onChange={(e) => setBruto(e.target.value)} /></Field>
        <Field label="Extras do mês (horas extras, adicionais)" hint="Somam ao bruto só na simulação mensal."><MoneyInput value={extras} onChange={(e) => setExtras(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dependentes"><Input inputMode="numeric" value={dep} onChange={(e) => setDep(e.target.value)} /></Field>
          <Field label="Pensão paga"><MoneyInput value={pensao} onChange={(e) => setPensao(e.target.value)} /></Field>
        </div>
      </Card>

      <SectionTitle>Mensal</SectionTitle>
      <Card>
        <Linha rotulo="Bruto" valor={r.mensal.grossCents} />
        <Linha rotulo="INSS" valor={-r.mensal.inssCents} />
        <Linha rotulo="IRRF" valor={-r.mensal.irrfCents} />
        <Linha rotulo="Líquido estimado" valor={r.mensal.netCents} forte />
      </Card>

      <SectionTitle>13º salário</SectionTitle>
      <Card>
        <Linha rotulo="1ª parcela (sem descontos)" valor={r.decimo.primeiraCents} />
        <Linha rotulo="2ª parcela (com INSS e IRRF)" valor={r.decimo.segundaCents} />
        <Linha rotulo="Total líquido" valor={r.decimo.primeiraCents + r.decimo.segundaCents} forte />
      </Card>

      <SectionTitle>Férias (com 1/3)</SectionTitle>
      <Card className="space-y-2">
        <Field label="Dias de férias"><Input inputMode="numeric" value={dias} onChange={(e) => setDias(e.target.value)} /></Field>
        <Linha rotulo="Bruto com 1/3" valor={r.ferias.grossCents} />
        <Linha rotulo="INSS + IRRF" valor={-(r.ferias.inssCents + r.ferias.irrfCents)} />
        <Linha rotulo="Líquido estimado" valor={r.ferias.netCents} forte />
      </Card>
      <p className="text-xs text-muted">
        Estimativas. 13º e férias não aplicam o redutor mensal da Lei 15.270 e não consideram abono pecuniário. PLR não é calculada.
        Confira sempre com o holerite.
      </p>
    </div>
  );
}
