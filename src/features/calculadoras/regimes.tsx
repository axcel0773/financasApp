'use client';

import { useMemo, useState } from 'react';
import { compararRegimes } from '@/core/calculadoras/regimes';
import type { TabelasFiscais } from '@/core/calculadoras/pacote';
import type { ParametrosAno } from '@/core/calculadoras/parametros';
import { formatBRL } from '@/core/shared/money';
import { Chip } from '@/ui/primitives/chip';
import { Card, SectionTitle } from '@/ui/primitives/card';
import { Field, Input, MoneyInput } from '@/ui/primitives/fields';
import { Destaque, LayoutCalculadora, LinhaValor } from './blocos';
import { br1, campo, cents, num } from './campos';
import { CamposPacote } from './pacote';
import { paraEntrada, type ValoresPacote } from './valores-pacote';

const NOME = { clt: 'CLT', pj: 'PJ (Simples)', mei: 'MEI' } as const;

export function CalculadoraRegimes({
  tabelas,
  parametros,
  inicial,
}: {
  tabelas: TabelasFiscais;
  parametros: ParametrosAno & { desatualizado: boolean };
  inicial: ValoresPacote;
}) {
  const [clt, setClt] = useState(inicial);
  const [fat, setFat] = useState(campo(Math.round(cents(inicial.bruto) * 1.5)));
  const [meses, setMeses] = useState('11');
  const [contador, setContador] = useState('300,00');
  const [proprios, setProprios] = useState('');
  const r = useMemo(
    () =>
      compararRegimes(
        {
          faturamentoMensalCents: cents(fat),
          mesesFaturados: Math.min(12, Math.max(1, num(meses, 12))),
          custoPjMensalCents: cents(contador),
          custosProprioMensalCents: cents(proprios),
          clt: paraEntrada(clt),
        },
        tabelas,
        parametros,
      ),
    [clt, fat, meses, contador, proprios, tabelas, parametros],
  );
  const valores = { clt: r.cltAnualCents, pj: r.pj.liquidoAnualCents, mei: r.mei.cabe ? r.mei.liquidoAnualCents : null };
  return (
    <LayoutCalculadora
      campos={
        <>
          <h2 className="font-display text-base font-semibold">Como CLT</h2>
          <CamposPacote v={clt} mudar={setClt} />
          <h2 className="pt-3 font-display text-base font-semibold">Como PJ ou MEI</h2>
          <Field label="Faturamento por mês">
            <MoneyInput value={fat} onChange={(e) => setFat(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Meses faturados no ano" hint="Sem férias pagas: 11 = um mês parado.">
              <Input inputMode="numeric" value={meses} onChange={(e) => setMeses(e.target.value)} />
            </Field>
            <Field label="Contador e taxas/mês">
              <MoneyInput value={contador} onChange={(e) => setContador(e.target.value)} />
            </Field>
          </div>
          <Field label="Custos que passam a ser seus/mês" hint="Plano de saúde, equipamento, vale que a empresa pagava…">
            <MoneyInput value={proprios} onChange={(e) => setProprios(e.target.value)} />
          </Field>
        </>
      }
      resultado={
        <>
          <Destaque
            rotulo="Rende mais por ano"
            texto={NOME[r.melhor]}
            apoio={[
              { rotulo: 'Líquido no ano', cents: valores[r.melhor] ?? 0 },
              {
                rotulo: 'PJ empata faturando',
                texto: r.empatePjMensalCents === null ? 'fora do Simples' : formatBRL(r.empatePjMensalCents),
              },
            ]}
          />
          <Card className="py-1">
            {(['clt', 'pj', 'mei'] as const).map((k) => (
              <div key={k} className="flex min-h-14 items-center justify-between gap-3 border-b border-border py-2 last:border-0">
                <span className="flex items-center gap-2 font-semibold">
                  {NOME[k]}
                  {r.melhor === k && <Chip tom="ok">melhor</Chip>}
                </span>
                {valores[k] === null ? (
                  <span className="text-sm text-muted">não cabe no MEI</span>
                ) : (
                  <span className="amount font-semibold">{formatBRL(valores[k]!)}</span>
                )}
              </div>
            ))}
          </Card>
          <SectionTitle>PJ por mês faturado</SectionTitle>
          <Card>
            <LinhaValor rotulo="Faturamento" cents={cents(fat)} />
            <LinhaValor rotulo={`DAS (Anexo ${r.pj.anexo}, ${br1(r.pj.aliquotaPct)}%)`} cents={-r.pj.dasMensalCents} />
            <LinhaValor rotulo={`INSS do pró-labore de ${formatBRL(r.pj.proLaboreCents)}`} cents={-r.pj.inssMensalCents} />
            {r.pj.irrfMensalCents > 0 && <LinhaValor rotulo="IRRF do pró-labore" cents={-r.pj.irrfMensalCents} />}
            <LinhaValor rotulo="Contador e custos próprios" cents={-(cents(contador) + cents(proprios))} />
            <LinhaValor rotulo="Sobra no mês" cents={r.pj.liquidoMensalCents} forte />
            <p className="pt-2 text-xs text-muted">
              {r.pj.anexo === 'III'
                ? `Pró-labore de 28% do faturamento para ficar no Anexo III (Fator R). No Anexo V sobraria ${formatBRL(r.pjOutro.liquidoAnualCents)} no ano.`
                : `Pró-labore de um salário mínimo no Anexo V. Com Fator R (Anexo III) sobraria ${formatBRL(r.pjOutro.liquidoAnualCents)} no ano.`}
            </p>
          </Card>
          <Card>
            <p className="text-sm">
              <span className="font-semibold">MEI:</span>{' '}
              {r.mei.cabe
                ? `DAS de ${formatBRL(r.mei.dasMensalCents)} por mês (serviços).`
                : `o faturamento passa do teto de ${formatBRL(parametros.limiteMeiAnualCents)} por ano.`}{' '}
              Desenvolvimento de software e outras atividades intelectuais em geral não podem ser MEI.
            </p>
          </Card>
        </>
      }
      aviso={
        <>
          Estimativa {parametros.desatualizado ? `com os parâmetros de ${parametros.ano} (o ano atual ainda não foi cadastrado)` : `com os parâmetros de ${parametros.ano}`}.
          O CLT soma 13º, férias, FGTS e benefícios; o PJ não tem nada disso. Lucro distribuído sem IR até R$ 50 mil por mês.
          Não inclui ISS fora do DAS, ajuste anual do IR nem diferença de aposentadoria. Confirme o enquadramento com um contador.
        </>
      }
    />
  );
}
