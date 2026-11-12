import { salvarTabelasAction } from '@/app/_actions/gestao';
import { tabelaDesatualizada } from '@/core/income/tabelas';
import type { Faixa } from '@/core/income/holerite';
import { carregarBase } from '@/features/base';
import { centavosParaCampo, dataLonga } from '@/ui/format';
import { ActionForm } from '@/ui/patterns/action-form';
import { Card, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Chip } from '@/ui/primitives/chip';
import { Field, Input, MoneyInput, Switch } from '@/ui/primitives/fields';

export const metadata = { title: 'Tabelas de INSS e IRRF' };
const LINHAS = 8;

function Faixas({ prefixo, faixas }: { prefixo: 'inss' | 'irrf'; faixas: Faixa[] }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-muted">
        <span>Até (R$)</span><span>Alíquota %</span><span>Deduzir (R$)</span>
      </div>
      {Array.from({ length: LINHAS }, (_, i) => {
        const f = faixas[i];
        return (
          <div key={i} className="grid grid-cols-3 gap-2">
            <MoneyInput name={`${prefixo}_up_${i}`} aria-label={`Faixa ${i + 1} limite`} placeholder={i === faixas.length - 1 && prefixo === 'irrf' ? 'sem limite' : ''} defaultValue={f && f.upToCents !== null ? centavosParaCampo(f.upToCents) : ''} />
            <Input name={`${prefixo}_rate_${i}`} inputMode="decimal" aria-label={`Faixa ${i + 1} alíquota`} defaultValue={f ? String(+(f.rate * 100).toFixed(4)).replace('.', ',') : ''} />
            <MoneyInput name={`${prefixo}_ded_${i}`} aria-label={`Faixa ${i + 1} dedução`} defaultValue={f ? centavosParaCampo(f.deductionCents) : ''} />
          </div>
        );
      })}
      <p className="text-xs text-muted">Deixe o limite vazio na última faixa do IRRF (acima de tudo). Linhas vazias são ignoradas.</p>
    </div>
  );
}

export default async function ImpostosPage() {
  const { c, hoje } = await carregarBase();
  const t = await c.income.tabelas();
  if (!t) return <><PageHeader voltar={{ href: '/mais' }} title="Impostos" /><Card>Tabelas não encontradas.</Card></>;
  const vencida = tabelaDesatualizada(t.validaDesde.inss, hoje) || tabelaDesatualizada(t.validaDesde.irrf, hoje);
  const r = t.paramsIrrf.reducer;
  return (
    <>
      <PageHeader voltar={{ href: '/mais' }} title="Tabelas de INSS e IRRF" subtitle={`Vigência INSS ${dataLonga(t.validaDesde.inss)} · IRRF ${dataLonga(t.validaDesde.irrf)}`} />
      {vencida && <Card className="mb-3 border-warning"><Chip tom="alert">Possivelmente desatualizada</Chip><p className="mt-1 text-sm">A vigência é de um ano anterior ao atual. Confira com a Receita Federal e a Previdência e atualize abaixo.</p></Card>}
      <ActionForm action={salvarTabelasAction} submitLabel="Salvar tabelas" className="space-y-4">
        <Card className="space-y-3">
          <Field label="Vigente desde"><Input type="date" name="validFrom" defaultValue={hoje} required /></Field>
          <Field label="Dedução por dependente (R$)"><MoneyInput name="dependent" defaultValue={centavosParaCampo(t.paramsIrrf.dependentCents)} /></Field>
          <Field label="Desconto simplificado (R$)"><MoneyInput name="simplified" defaultValue={centavosParaCampo(t.paramsIrrf.simplifiedCents)} /></Field>
        </Card>
        <SectionTitle>INSS (progressivo)</SectionTitle>
        <Card><Faixas prefixo="inss" faixas={t.inss} /></Card>
        <SectionTitle>IRRF</SectionTitle>
        <Card><Faixas prefixo="irrf" faixas={t.irrf} /></Card>
        <SectionTitle>Redutor da Lei 15.270</SectionTitle>
        <Card className="space-y-3">
          <Switch name="reducer" defaultChecked={!!r} label="Aplicar redutor" />
          <Field label="Isento até (R$)"><MoneyInput name="exempt" defaultValue={r ? centavosParaCampo(r.exemptUntilCents) : ''} /></Field>
          <Field label="Redução parcial até (R$)"><MoneyInput name="phase" defaultValue={r ? centavosParaCampo(r.phaseUntilCents) : ''} /></Field>
          <Field label="Parâmetro a (R$)"><MoneyInput name="a" defaultValue={r ? centavosParaCampo(r.aCents) : ''} /></Field>
          <Field label="Parâmetro b"><Input name="b" inputMode="decimal" defaultValue={r ? String(r.b).replace('.', ',') : ''} /></Field>
          <p className="text-xs text-muted">Redução = a − b × renda (na faixa parcial). Valores de referência; confira na legislação.</p>
        </Card>
      </ActionForm>
    </>
  );
}
