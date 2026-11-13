import Link from 'next/link';
import {
  atualizarSaldoAction,
  criarInvestimentoAction,
  registrarAporteAction,
} from '@/app/_actions/investir';
import {
  alocacaoPorTipo,
  calcularRendimento,
  type TipoInvestimento,
} from '@/core/investments/domain';
import { arquivarInvestimentoAction, editarInvestimentoAction } from '@/app/_actions/gestao';
import { carregarBase } from '@/features/base';
import { AcoesInvestimento } from '@/features/investir/acoes-investimento';
import { ExcluirConfirmado } from '@/features/shared/excluir-confirmado';
import { Donut } from '@/ui/charts/donut';
import { centavosParaCampo, dataLonga } from '@/ui/format';
import { ActionForm } from '@/features/shared/action-form';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { Card, Hero, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Chip } from '@/ui/primitives/chip';
import { Field, Input, MoneyInput, RadioChips, Select } from '@/ui/primitives/fields';
import { EmptyState } from '@/ui/primitives/progress';

export const metadata = { title: 'Investimentos' };
const ROTULO_TIPO: Record<TipoInvestimento, string> = {
  fixed_income: 'Renda fixa',
  treasury: 'Tesouro',
  stocks: 'Ações e FIIs',
  funds: 'Fundos',
  crypto: 'Cripto',
  other: 'Outros',
};
const COR: Record<TipoInvestimento, string> = {
  fixed_income: '#0b7a5a',
  treasury: '#2563a8',
  stocks: '#7a4fb5',
  funds: '#c77d0a',
  crypto: '#b5473a',
  other: '#667085',
};

export default async function InvestimentosPage() {
  const { c, hoje } = await carregarBase();
  const [lista, aportes, saldos] = await Promise.all([
    c.investments.list(),
    c.investments.entries(),
    c.investments.latestBalances(),
  ]);
  const saldo = new Map(saldos.map((s) => [s.investmentId, s]));
  const linhas = lista.map((i) => {
    const s = saldo.get(i.id);
    const r = calcularRendimento(
      s?.balanceCents ?? 0,
      aportes.filter((a) => a.investmentId === i.id),
    );
    return { i, s, r, valor: s?.balanceCents ?? 0 };
  });
  const total = linhas.reduce((t, l) => t + l.valor, 0);
  const investido = linhas.reduce((t, l) => t + l.r.investidoCents, 0);
  const rend = total - investido;
  const aloc = alocacaoPorTipo(linhas.map((l) => ({ kind: l.i.kind, valorCents: l.valor })));

  return (
    <>
      <PageHeader
        voltar={{ href: '/mais' }}
        title="Investimentos"
        subtitle="Controle manual"
        action={
          <Link
            href="/investimentos/simulador"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-link"
          >
            Simulador
          </Link>
        }
      />
      <Hero>
        <p className="text-sm opacity-80">Patrimônio investido</p>
        <AmountDisplay cents={total} size="xl" tom="onDark" />
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md bg-white/10 p-3">
            <p className="opacity-80">Total aportado</p>
            <AmountDisplay cents={investido} size="md" tom="onDark" />
          </div>
          <div className="rounded-md bg-white/10 p-3">
            <p className="opacity-80">Rendimento</p>
            <AmountDisplay cents={rend} size="md" tom="onDark" sinal />
          </div>
        </div>
      </Hero>
      <p className="mt-2 text-xs text-muted">
        Os saldos são informados por você; o app não consulta corretoras.
      </p>

      {aloc.length > 0 && total > 0 && (
        <>
          <SectionTitle>Alocação</SectionTitle>
          <Card>
            <Donut
              titulo="Alocação por tipo"
              fatias={aloc.map((a) => ({
                label: ROTULO_TIPO[a.kind],
                value: a.valorCents,
                color: COR[a.kind],
              }))}
            />
          </Card>
        </>
      )}

      <div className="lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-8">
      <div>
      <SectionTitle>Seus investimentos</SectionTitle>
      {linhas.length === 0 ? (
        <EmptyState title="Nenhum investimento">Cadastre o primeiro abaixo.</EmptyState>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {linhas.map(({ i, s, r, valor }) => (
            <Card key={i.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{i.name}</p>
                  <p className="text-xs text-muted">
                    {ROTULO_TIPO[i.kind]}
                    {i.institution ? ` · ${i.institution}` : ''}
                    {i.annualRatePercent !== null
                      ? ` · ${String(i.annualRatePercent).replace('.', ',')}% a.a.`
                      : ''}
                  </p>
                </div>
                <Chip tom={r.rendimentoCents >= 0 ? 'ok' : 'danger'}>
                  {r.rendimentoPct >= 0 ? '+' : ''}
                  {r.rendimentoPct.toFixed(1).replace('.', ',')}%
                </Chip>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <AmountDisplay cents={valor} size="lg" />
                <span className="text-xs text-muted">
                  {s ? `em ${dataLonga(s.balanceOn)}` : 'sem saldo informado'}
                </span>
              </div>
              <p className="text-sm text-muted">
                Aportado <span className="amount">{centavosParaCampo(r.investidoCents)}</span> ·
                rendeu <span className="amount">{centavosParaCampo(r.rendimentoCents)}</span>
              </p>
              <AcoesInvestimento
                paineis={[
                  { chave: 'mov', rotulo: 'Aporte/resgate', conteudo: (
<ActionForm
                  action={registrarAporteAction}
                  submitLabel="Registrar"
                  className="space-y-3"
                >
                  <input type="hidden" name="investmentId" value={i.id} />
                  <RadioChips
                    name="tipo"
                    defaultValue="aporte"
                    options={[
                      { value: 'aporte', label: 'Aporte' },
                      { value: 'resgate', label: 'Resgate' },
                    ]}
                  />
                  <Field label="Valor">
                    <MoneyInput name="amount" required />
                  </Field>
                  <Field label="Data">
                    <Input type="date" name="occurredOn" defaultValue={hoje} required />
                  </Field>
                </ActionForm>
                  ) },
                  { chave: 'saldo', rotulo: 'Saldo', conteudo: (
<ActionForm
                  action={atualizarSaldoAction}
                  submitLabel="Salvar saldo"
                  className="space-y-3"
                >
                  <input type="hidden" name="investmentId" value={i.id} />
                  <Field label="Saldo atual">
                    <MoneyInput name="balance" defaultValue={centavosParaCampo(valor)} required />
                  </Field>
                  <Field label="Em">
                    <Input type="date" name="balanceOn" defaultValue={hoje} required />
                  </Field>
                </ActionForm>
                  ) },
                  { chave: 'editar', rotulo: 'Editar', conteudo: (
<ActionForm action={editarInvestimentoAction} submitLabel="Salvar" className="space-y-3">
                  <input type="hidden" name="id" value={i.id} />
                  <Field label="Nome"><Input name="name" defaultValue={i.name} required maxLength={80} /></Field>
                  <Field label="Tipo">
                    <Select name="kind" defaultValue={i.kind}>
                      {Object.entries(ROTULO_TIPO).map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
                    </Select>
                  </Field>
                  <Field label="Instituição"><Input name="institution" defaultValue={i.institution ?? ''} maxLength={80} /></Field>
                  <Field label="Taxa % a.a."><Input name="rate" inputMode="decimal" defaultValue={i.annualRatePercent === null ? '' : String(i.annualRatePercent).replace('.', ',')} /></Field>
                  <Field label="Vencimento"><Input type="date" name="maturityOn" defaultValue={i.maturityOn ?? ''} /></Field>
                </ActionForm>
                  ) },
                ]}
              />
              <div className="mt-3 border-t border-border pt-2"><ExcluirConfirmado action={arquivarInvestimentoAction} id={i.id} rotulo="Arquivar" aviso="O investimento some da lista e da alocação; o histórico de aportes fica guardado." /></div>
            </Card>
          ))}
        </div>
      )}

      </div>
      <div>
      <SectionTitle>Novo investimento</SectionTitle>
      <Card>
        <ActionForm action={criarInvestimentoAction} submitLabel="Cadastrar">
          <Field label="Nome">
            <Input name="name" required maxLength={80} placeholder="CDB Banco X 110% CDI" />
          </Field>
          <Field label="Tipo">
            <Select name="kind" defaultValue="fixed_income">
              {Object.entries(ROTULO_TIPO).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Saldo atual (opcional)" hint="Quanto você já tem aplicado hoje. Entra como valor aportado; o rendimento passa a contar daqui.">
            <MoneyInput name="balance" />
          </Field>
          <Field label="Instituição (opcional)">
            <Input name="institution" maxLength={80} />
          </Field>
          <Field label="Taxa anual % (opcional)">
            <Input name="rate" inputMode="decimal" placeholder="12,5" />
          </Field>
          <Field label="Vencimento (opcional)">
            <Input type="date" name="maturityOn" />
          </Field>
        </ActionForm>
      </Card>
      </div>
      </div>
    </>
  );
}
