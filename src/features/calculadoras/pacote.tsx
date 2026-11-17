'use client';

import { useMemo, useState } from 'react';
import { quantoVale, type TabelasFiscais } from '@/core/calculadoras/pacote';
import { Field, Input, MoneyInput } from '@/ui/primitives/fields';
import { Card } from '@/ui/primitives/card';
import { Destaque, LayoutCalculadora, LinhaValor } from './blocos';
import type { ValoresPacote } from './valores-pacote';
import { paraEntrada } from './valores-pacote';

/** Campos de um pacote CLT, reaproveitados no simulador de proposta. */
export function CamposPacote({ v, mudar, prefixo }: { v: ValoresPacote; mudar: (v: ValoresPacote) => void; prefixo?: string }) {
  const m = (k: keyof ValoresPacote) => (e: React.ChangeEvent<HTMLInputElement>) => mudar({ ...v, [k]: e.target.value });
  const p = prefixo ? `${prefixo}: ` : '';
  return (
    <>
      <Field label={`${p}Salário bruto`}>
        <MoneyInput value={v.bruto} onChange={m('bruto')} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`${p}Vale-refeição/mês`}>
          <MoneyInput value={v.vr} onChange={m('vr')} />
        </Field>
        <Field label={`${p}Vale-alimentação/mês`}>
          <MoneyInput value={v.va} onChange={m('va')} />
        </Field>
        <Field label={`${p}Desconto VR (% do bruto)`}>
          <Input inputMode="decimal" placeholder="0" value={v.descontoVr} onChange={m('descontoVr')} />
        </Field>
        <Field label={`${p}Plano de saúde/mês`} hint="O que a empresa paga.">
          <MoneyInput value={v.saude} onChange={m('saude')} />
        </Field>
        <Field label={`${p}Outros benefícios/mês`} hint="Seguro, auxílio home office…">
          <MoneyInput value={v.outros} onChange={m('outros')} />
        </Field>
        <Field label={`${p}PLR/bônus líquido/ano`}>
          <MoneyInput value={v.plr} onChange={m('plr')} />
        </Field>
      </div>
    </>
  );
}

export function CalculadoraPacote({ tabelas, inicial }: { tabelas: TabelasFiscais; inicial: ValoresPacote }) {
  const [v, setV] = useState(inicial);
  const r = useMemo(() => quantoVale(paraEntrada(v), tabelas), [v, tabelas]);
  return (
    <LayoutCalculadora
      campos={<CamposPacote v={v} mudar={setV} />}
      resultado={
        <>
          <Destaque
            rotulo="Seu pacote vale por mês"
            cents={r.equivalenteMensalCents}
            apoio={[
              { rotulo: 'Por ano', cents: r.totalAnualCents },
              { rotulo: 'Líquido no holerite', cents: r.liquidoMensalCents },
            ]}
          />
          <Card>
            <h2 className="mb-1 font-display text-base font-semibold">De onde vem (por ano)</h2>
            {r.linhas.map((l) => (
              <LinhaValor key={l.rotulo} rotulo={l.rotulo} cents={l.anualCents} />
            ))}
            <LinhaValor rotulo="Total" cents={r.totalAnualCents} forte />
          </Card>
        </>
      }
      aviso="Estimativa com as tabelas de INSS e IRRF cadastradas. O FGTS entra no total, mas só fica disponível nas hipóteses de saque. Não considera horas extras nem reajustes."
    />
  );
}
