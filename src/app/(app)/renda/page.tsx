import Link from 'next/link';
import {
  gerarPrevistosAction,
  registrarExtraAction,
  salvarFonteAction,
} from '@/app/_actions/renda';
import { proximoRecebimento, totalPrevistoPendente, totalRecebido } from '@/core/income/domain';
import { dividirSalario, estimarHolerite } from '@/core/income/holerite';
import { addMeses } from '@/core/shared/competencia';
import { desativarFonteAction } from '@/app/_actions/gestao';
import { carregarBase } from '@/features/base';
import { ExcluirConfirmado } from '@/features/shared/excluir-confirmado';
import { ReceiptRow } from '@/features/renda/receipt-row';
import { centavosParaCampo, competenciaDoParam, dataCurta, dataLonga, rotuloCompetencia } from '@/ui/format';
import { rotuloRecebimento } from '@/features/renda/receipt-row';
import { Recolhivel } from '@/ui/patterns/collapsible';
import { MonthSwitch } from '@/ui/patterns/month-switch';
import { Linha } from '@/ui/patterns/row';
import { IconeRedondo } from '@/ui/patterns/round-icon';
import { Widget } from '@/ui/patterns/widget';
import { GradeWidgets } from '@/ui/patterns/widget-grid';
import { ActionForm } from '@/features/shared/action-form';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { ButtonLink } from '@/ui/primitives/button';
import { Card, Hero, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Field, Input, MoneyInput, Select } from '@/ui/primitives/fields';
import { EmptyState } from '@/ui/patterns/empty-state';

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
  const proximo = proximoRecebimento(recebimentos, hoje);

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
      <MonthSwitch anterior={`/renda?mes=${addMeses(mes, -1)}`} proximo={`/renda?mes=${addMeses(mes, 1)}`} rotulo={rotuloCompetencia(mes)} />

      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div>
          <Hero>
            <p className="text-sm text-white/75">Recebido em {rotuloCompetencia(mes)}</p>
            <AmountDisplay cents={recebido} tom="onDark" size="xl" />
            <div className="mt-5 grid grid-cols-2 gap-2.5 text-sm">
              <div className="rounded-[18px] bg-white/10 px-3.5 py-3">
                <p className="text-white/75">Ainda previsto</p>
                <AmountDisplay cents={pendente} size="md" tom="onDark" />
              </div>
              <div className="rounded-[18px] bg-white/10 px-3.5 py-3">
                <p className="text-white/75">Líquido estimado</p>
                {holerite ? <AmountDisplay cents={holerite.netCents} size="md" tom="onDark" /> : <p className="text-lg font-semibold">—</p>}
              </div>
            </div>
          </Hero>
          <GradeWidgets className="mt-3">
            <Widget
              rotulo="Salário bruto"
              valor={fonte ? <AmountDisplay cents={fonte.grossCents} size="md" /> : <span className="text-lg font-semibold">—</span>}
              contexto={fonte?.employer || fonte?.name || 'Nenhum salário cadastrado'}
              visual={<IconeRedondo nome="wallet" tom="entrada" />}
            />
            <Widget
              rotulo="Descontos (INSS + IRRF)"
              valor={holerite ? <AmountDisplay cents={holerite.inssCents + holerite.irrfCents} size="md" /> : <span className="text-lg font-semibold">—</span>}
              contexto={holerite && holerite.grossCents > 0 ? `${Math.round(((holerite.inssCents + holerite.irrfCents) / holerite.grossCents) * 100)}% do bruto` : 'Estimativa'}
              visual={<IconeRedondo nome="calc" tom="saida" />}
            />
            <Widget
              rotulo="Próximo recebimento"
              valor={proximo ? <AmountDisplay cents={proximo.expectedNetCents ?? 0} size="md" /> : <span className="text-lg font-semibold">—</span>}
              contexto={proximo?.expectedOn ? `${rotuloRecebimento(proximo.kind)} · ${dataCurta(proximo.expectedOn)}` : 'Nada previsto neste mês'}
              visual={<IconeRedondo nome="calendar" />}
            />
            <Widget
              rotulo="Fontes ativas"
              valor={<span className="text-lg font-semibold">{fontes.filter((f) => f.active).length}</span>}
              contexto="salário e outras rendas"
              visual={<IconeRedondo nome="repeat" />}
            />
          </GradeWidgets>

          <SectionTitle>Recebimentos</SectionTitle>
          {recebimentos.length === 0 ? (
            <EmptyState icone="wallet" title="Nenhum recebimento neste mês">
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
                <div className="-my-1">
                  <Linha icone={<IconeRedondo nome="wallet" />} titulo="Salário bruto" direita={<AmountDisplay cents={holerite.grossCents} size="sm" />} />
                  <Linha icone={<IconeRedondo nome="calc" tom="saida" />} titulo="INSS" direita={<AmountDisplay cents={-holerite.inssCents} size="sm" tom="expense" />} />
                  <Linha icone={<IconeRedondo nome="calc" tom="saida" />} titulo="IRRF" direita={<AmountDisplay cents={-holerite.irrfCents} size="sm" tom="expense" />} />
                  <Linha icone={<IconeRedondo nome="check" tom="entrada" />} titulo="Líquido estimado" direita={<AmountDisplay cents={holerite.netCents} tom="income" />} />
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
          <Recolhivel aberto={!fonte} titulo={fonte ? 'Alterar valores e datas' : 'Informe seu salário CLT'}>
            <ActionForm
              action={salvarFonteAction}
              submitLabel="Salvar salário"
              className="space-y-3"
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
          </Recolhivel>

          {fonte && (
            <>
              <SectionTitle>Registrar outro recebimento</SectionTitle>
              <Recolhivel titulo="13º, PLR, férias ou extra">
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
              </Recolhivel>
            </>
          )}
        </div>
      </div>
    </>
  );
}
