import Link from 'next/link';
import {
  gerarPrevistosAction,
  registrarExtraAction,
  salvarFonteAction,
} from '@/app/_actions/renda';
import { totalPrevistoPendente, totalRecebido } from '@/core/income/domain';
import { dividirSalario, estimarHolerite } from '@/core/income/holerite';
import { addMeses } from '@/core/shared/competencia';
import { desativarFonteAction } from '@/app/_actions/gestao';
import { carregarBase } from '@/features/base';
import { ExcluirConfirmado } from '@/features/shared/excluir-confirmado';
import { ReceiptRow } from '@/features/renda/receipt-row';
import { centavosParaCampo, competenciaDoParam, dataLonga, rotuloCompetencia } from '@/ui/format';
import { ActionForm } from '@/features/shared/action-form';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { ButtonLink } from '@/ui/primitives/button';
import { Card, Hero, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Field, Input, MoneyInput, Select } from '@/ui/primitives/fields';
import { Icon } from '@/ui/primitives/icon';
import { EmptyState } from '@/ui/primitives/progress';

export const metadata = { title: 'Renda' };

export default async function RendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { c, wallets, hoje, mesAtual } = await carregarBase();
  const mes = competenciaDoParam(sp.mes, mesAtual);
  const [fontes, tabelas, recebimentos] = await Promise.all([
    c.income.fontes(),
    c.income.tabelas(),
    c.income.recebimentos(mes, mes),
  ]);
  const fonte = fontes.find((f) => f.kind === 'salary' && f.active);
  const carteiras = wallets
    .filter((w) => w.kind === 'checking' || w.kind === 'cash')
    .map((w) => ({ id: w.id, nome: w.name }));
  const holerite =
    fonte && tabelas
      ? estimarHolerite({
          grossCents: fonte.grossCents,
          dependentes: fonte.dependents,
          pensaoCents: fonte.alimonyCents,
          inss: tabelas.inss,
          irrf: tabelas.irrf,
          paramsIrrf: tabelas.paramsIrrf,
        })
      : null;
  const partes = holerite && fonte ? dividirSalario(holerite, fonte.advancePercent ?? 0) : null;
  const recebido = totalRecebido(recebimentos);
  const pendente = totalPrevistoPendente(recebimentos);

  return (
    <>
      <PageHeader
        title="Renda"
        subtitle={rotuloCompetencia(mes)}
        action={
          <Link
            href="/renda/simulador"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-link"
          >
            Simular holerite
          </Link>
        }
      />
      <div className="mb-3 flex items-center justify-between text-sm">
        <Link
          href={`/renda?mes=${addMeses(mes, -1)}`}
          className="inline-flex min-h-11 items-center gap-1 text-link"
        >
          <Icon name="back" size={18} />
          Mês anterior
        </Link>
        <Link
          href={`/renda?mes=${addMeses(mes, 1)}`}
          className="inline-flex min-h-11 items-center gap-1 text-link"
        >
          Próximo mês
          <Icon name="chevron" size={18} />
        </Link>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div>
          <Hero>
            <p className="text-sm opacity-80">Recebido em {rotuloCompetencia(mes)}</p>
            <AmountDisplay cents={recebido} tom="onDark" size="xl" />
            <p className="mt-1 text-sm opacity-80">
              Ainda previsto: <span className="amount">{centavosParaCampo(pendente)}</span>
            </p>
          </Hero>

          <SectionTitle>Recebimentos</SectionTitle>
          {recebimentos.length === 0 ? (
            <EmptyState title="Nenhum recebimento neste mês">
              {fonte?.advanceDay || fonte?.finalDay
                ? 'Gere os previstos abaixo ou registre um recebimento manual.'
                : 'As datas do salário são opcionais: registre cada recebimento quando acontecer.'}
            </EmptyState>
          ) : (
            <Card className="py-1">
              {recebimentos.map((r) => (
                <ReceiptRow
                  key={r.id}
                  r={r}
                  hoje={hoje}
                  carteiras={carteiras}
                  sugestao={
                    r.kind === 'final' && holerite && partes
                      ? {
                          grossCents:
                            (r.expectedNetCents ?? 0) + holerite.inssCents + holerite.irrfCents,
                          deductionsCents: holerite.inssCents + holerite.irrfCents,
                        }
                      : undefined
                  }
                />
              ))}
            </Card>
          )}
          {fonte && (fonte.advanceDay || fonte.finalDay) && (
            <ActionForm
              action={gerarPrevistosAction}
              submitLabel={`Gerar previstos de ${rotuloCompetencia(mes)}`}
              variante="secondary"
              className="mt-3 space-y-3"
            >
              <input type="hidden" name="competencia" value={mes} />
            </ActionForm>
          )}
          <ButtonLink href="/renda/historico" variant="secondary" block className="mt-3">
            Ver histórico do salário
          </ButtonLink>
        </div>

        <div>
          {holerite && fonte && (
            <>
              <SectionTitle>Estimativa do holerite</SectionTitle>
              <Card className="space-y-2">
                {[
                  ['Salário bruto', holerite.grossCents, 'default'],
                  ['INSS', -holerite.inssCents, 'expense'],
                  ['IRRF', -holerite.irrfCents, 'expense'],
                ].map(([l, v, t]) => (
                  <div key={String(l)} className="flex justify-between text-sm">
                    <span>{l}</span>
                    <AmountDisplay cents={Number(v)} size="sm" tom={t as 'default' | 'expense'} />
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="font-semibold">Líquido estimado</span>
                  <AmountDisplay cents={holerite.netCents} tom="income" />
                </div>
                {partes && fonte.advancePercent ? (
                  <div className="rounded-md bg-soft p-3 text-sm">
                    <div className="flex justify-between">
                      <span>Adiantamento ({fonte.advancePercent}%)</span>
                      <span className="amount">{centavosParaCampo(partes.adiantamentoCents)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pagamento final</span>
                      <span className="amount">{centavosParaCampo(partes.finalCents)}</span>
                    </div>
                  </div>
                ) : null}
                <p className="text-xs text-muted">
                  Estimativa com as tabelas cadastradas (INSS desde{' '}
                  {tabelas ? dataLonga(tabelas.validaDesde.inss) : '—'}). Sempre confira com o
                  holerite real.
                </p>
              </Card>
            </>
          )}

          <SectionTitle>{fonte ? 'Editar salário' : 'Cadastrar salário'}</SectionTitle>
          <details open={!fonte} className="rounded-lg border border-border bg-surface p-4">
            <summary className="flex min-h-11 cursor-pointer items-center font-semibold">
              {fonte ? 'Alterar valores e datas' : 'Informe seu salário CLT'}
            </summary>
            <ActionForm
              action={salvarFonteAction}
              submitLabel="Salvar salário"
              className="mt-3 space-y-3"
            >
              <input type="hidden" name="id" value={fonte?.id ?? ''} />
              <Field label="Nome">
                <Input
                  name="name"
                  defaultValue={fonte?.name ?? 'Salário CLT'}
                  required
                  maxLength={80}
                />
              </Field>
              <Field label="Empresa (opcional)">
                <Input name="employer" defaultValue={fonte?.employer ?? ''} maxLength={80} />
              </Field>
              <Field label="Salário bruto">
                <MoneyInput
                  name="gross"
                  defaultValue={centavosParaCampo(fonte?.grossCents ?? 1_000_000)}
                  required
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Adiant. %">
                  <Input
                    name="advancePercent"
                    inputMode="numeric"
                    defaultValue={fonte?.advancePercent ?? ''}
                    placeholder="40"
                  />
                </Field>
                <Field label="Dia adiant.">
                  <Input
                    name="advanceDay"
                    inputMode="numeric"
                    defaultValue={fonte?.advanceDay ?? ''}
                    placeholder="20"
                  />
                </Field>
                <Field label="Dia final">
                  <Input
                    name="finalDay"
                    inputMode="numeric"
                    defaultValue={fonte?.finalDay ?? ''}
                    placeholder="5"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Dependentes">
                  <Input
                    name="dependents"
                    inputMode="numeric"
                    defaultValue={fonte?.dependents ?? 0}
                  />
                </Field>
                <Field label="Pensão alimentícia">
                  <MoneyInput
                    name="alimony"
                    defaultValue={
                      fonte?.alimonyCents ? centavosParaCampo(fonte.alimonyCents) : ''
                    }
                  />
                </Field>
              </div>
              <p className="text-xs text-muted">
                Dependentes e pensão reduzem o IRRF estimado. Datas e percentual são opcionais. O pagamento final cai no mês seguinte ao de
                referência. Sem datas, o app não gera previstos e você registra manualmente.
              </p>
              <Field label="Cai na carteira">
                <Select name="walletId" defaultValue={fonte?.walletId ?? carteiras[0]?.id ?? ''}>
                  {carteiras.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.nome}
                    </option>
                  ))}
                </Select>
              </Field>
            </ActionForm>
            {fonte && <ExcluirConfirmado action={desativarFonteAction} id={fonte.id} rotulo="Desativar fonte" aviso="Para de gerar novos recebimentos previstos. O histórico continua." />}
          </details>

          {fonte && (
            <>
              <SectionTitle>Registrar outro recebimento</SectionTitle>
              <details className="rounded-lg border border-border bg-surface p-4">
                <summary className="flex min-h-11 cursor-pointer items-center font-semibold">
                  13º, PLR, férias ou extra
                </summary>
                <ActionForm
                  action={registrarExtraAction}
                  submitLabel="Registrar"
                  className="mt-3 space-y-3"
                >
                  <input type="hidden" name="sourceId" value={fonte.id} />
                  <Field label="Valor líquido">
                    <MoneyInput name="net" required />
                  </Field>
                  <Field label="Data">
                    <Input type="date" name="receivedOn" defaultValue={hoje} required />
                  </Field>
                  <Field label="Descrição (opcional)">
                    <Input name="note" maxLength={200} />
                  </Field>
                  <Field label="Depositado em">
                    <Select name="walletId" defaultValue={carteiras[0]?.id ?? ''}>
                      {carteiras.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.nome}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </ActionForm>
              </details>
            </>
          )}
        </div>
      </div>
    </>
  );
}
