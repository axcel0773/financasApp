import Link from 'next/link';
import {
  atualizarSaldoAction,
  criarInvestimentoAction,
  registrarAporteAction,
} from '@/app/_actions/investir';
import {
  alocacaoPorTipo,
  calcularRendimento,
  calcularRendimentoMes,
  type TipoInvestimento,
} from '@/core/investments/domain';
import { arquivarInvestimentoAction, editarInvestimentoAction } from '@/app/_actions/gestao';
import { carregarBase } from '@/features/base';
import { AcoesInvestimento } from '@/features/investir/acoes-investimento';
import { ExcluirConfirmado } from '@/features/shared/excluir-confirmado';
import { CategoryBreakdown } from '@/ui/patterns/category-breakdown';
import { IconeRedondo } from '@/ui/patterns/round-icon';
import { Widget } from '@/ui/patterns/widget';
import { GradeWidgets } from '@/ui/patterns/widget-grid';
import { centavosParaCampo, dataCurta, dataLonga, rotuloCompetencia } from '@/ui/format';
import { competenciaDe, primeiroDia, ultimoDia } from '@/core/shared/competencia';
import { ActionForm } from '@/features/shared/action-form';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { Card, Hero, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Chip } from '@/ui/primitives/chip';
import { Field, Input, MoneyInput, RadioChips, Select } from '@/ui/primitives/fields';
import { EmptyState } from '@/ui/patterns/empty-state';

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
  const [lista, aportes, saldos, historico] = await Promise.all([
    c.investments.list(),
    c.investments.entries(),
    c.investments.latestBalances(),
    c.investments.balances(),
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
  const aloc = alocacaoPorTipo(linhas.map((l) => ({ kind: l.i.kind, valorCents: l.valor })));

  const mes = competenciaDe(hoje);
  const mesIni = primeiroDia(mes);
  const mesFim = ultimoDia(mes);
  const rm = calcularRendimentoMes(lista.map((i) => i.id), historico, aportes, mesIni, mesFim);
  const nomeInv = new Map(lista.map((i) => [i.id, i.name]));
  const aportesMes = aportes
    .filter((a) => a.occurredOn >= mesIni && a.occurredOn <= mesFim && nomeInv.has(a.investmentId))
    .sort((a, b) => (a.occurredOn < b.occurredOn ? 1 : -1));
  const notaRend =
    rm.semReferencia > 0
      ? `${rm.semReferencia} ${rm.semReferencia === 1 ? 'investimento ficou' : 'investimentos ficaram'} de fora: sem saldo informado antes do mês.`
      : 'Saldo do fim do mês menos o do começo, sem contar aportes e resgates.';
  const proximoVenc = lista
    .filter((i) => i.maturityOn && i.maturityOn >= hoje)
    .sort((a, b) => (a.maturityOn! < b.maturityOn! ? -1 : 1))[0];
  const alocacao = aloc.length > 0 && total > 0 && (
    <Card>
      <CategoryBreakdown
        titulo="Alocação por tipo"
        itens={aloc.map((a) => ({
          id: a.kind,
          nome: ROTULO_TIPO[a.kind],
          cor: COR[a.kind],
          cents: a.valorCents,
          pct: (a.valorCents / total) * 100,
        }))}
      />
    </Card>
  );

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
        <p className="text-sm text-white/75">Patrimônio investido</p>
        <AmountDisplay cents={total} size="xl" tom="onDark" />
        <div className="mt-5 grid grid-cols-2 gap-2.5 text-sm">
          <div className="rounded-[18px] bg-white/10 px-3.5 py-3">
            <p className="text-white/75">Total aportado</p>
            <AmountDisplay cents={investido} size="md" tom="onDark" />
          </div>
          <div className="rounded-[18px] bg-white/10 px-3.5 py-3">
            <p className="text-white/75">Rendeu em {rotuloCompetencia(mes).split(' ')[0]}</p>
            <AmountDisplay cents={rm.rendidoCents} size="md" tom="onDark" sinal />
          </div>
        </div>
      </Hero>
      <GradeWidgets className="mt-3">
        <Widget
          rotulo={`Rendeu em ${rotuloCompetencia(mes).split(' ')[0]}`}
          valor={<AmountDisplay cents={rm.rendidoCents} size="md" tom={rm.rendidoCents >= 0 ? 'income' : 'expense'} sinal />}
          contexto={notaRend}
          visual={<IconeRedondo nome="trend" tom={rm.rendidoCents >= 0 ? 'entrada' : 'saida'} />}
        />
        <Widget
          rotulo="Aportes do mês"
          valor={<AmountDisplay cents={rm.movimentoCents} size="md" sinal />}
          contexto={`${aportesMes.length} ${aportesMes.length === 1 ? 'movimento' : 'movimentos'}`}
          visual={<IconeRedondo nome="plus" />}
        />
        <Widget
          rotulo="Vencimento mais próximo"
          valor={<span className="text-lg font-semibold">{proximoVenc ? dataCurta(proximoVenc.maturityOn!) : '—'}</span>}
          contexto={proximoVenc ? proximoVenc.name : 'Sem vencimento informado'}
          visual={<IconeRedondo nome="calendar" />}
        />
        <Widget
          rotulo="Investimentos"
          valor={<span className="text-lg font-semibold">{lista.length}</span>}
          contexto={`${aloc.length} ${aloc.length === 1 ? 'tipo' : 'tipos'}`}
          visual={<IconeRedondo nome="list" />}
        />
      </GradeWidgets>
      <p className="mt-2 text-xs text-muted">
        Os saldos são informados por você; o app não consulta corretoras.
      </p>

      {alocacao && (
        <div className="lg:hidden">
          <SectionTitle>Alocação</SectionTitle>
          {alocacao}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-8">
      <div>
      <SectionTitle>Aportes de {rotuloCompetencia(mes)}</SectionTitle>
      {aportesMes.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">Nenhum aporte ou resgate neste mês.</p>
        </Card>
      ) : (
        <Card className="px-4 py-1">
          <ul className="divide-y divide-border">
            {aportesMes.map((a, n) => (
              <li key={`${a.investmentId}-${a.occurredOn}-${n}`} className="flex items-center gap-3 py-3 text-sm">
                <span className="w-14 text-muted">{dataCurta(a.occurredOn)}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{nomeInv.get(a.investmentId)}</span>
                <span className="text-xs text-muted">{a.amountCents >= 0 ? 'Aporte' : 'Resgate'}</span>
                <AmountDisplay cents={a.amountCents} size="sm" tom={a.amountCents >= 0 ? 'income' : 'expense'} sinal />
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-border py-3 text-sm font-semibold">
            <span>Total do mês</span>
            <AmountDisplay cents={rm.movimentoCents} size="sm" sinal />
          </div>
        </Card>
      )}
      <SectionTitle>Seus investimentos</SectionTitle>
      {linhas.length === 0 ? (
        <EmptyState icone="trend" title="Nenhum investimento">Cadastre o primeiro no formulário mais abaixo, já com o saldo atual.</EmptyState>
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
                  { chave: 'mov', rotulo: 'Movimentar', conteudo: (
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
      {alocacao && (
        <div className="hidden lg:block">
          <SectionTitle>Alocação</SectionTitle>
          {alocacao}
        </div>
      )}
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
