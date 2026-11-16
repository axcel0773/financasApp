import { salvarMetaAction } from '@/app/_actions/investir';
import {
  aporteNecessario,
  coberturaEmMeses,
  mediaGastoMensal,
  mesesParaAtingir,
  progressoPct,
} from '@/core/goals/domain';
import { addMeses, primeiroDia, ultimoDia } from '@/core/shared/competencia';
import { ehBeneficio } from '@/core/wallets/domain';
import { carregarBase } from '@/features/base';
import { centavosParaCampo, dataCurta } from '@/ui/format';
import { ActionForm } from '@/features/shared/action-form';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { excluirMetaAction } from '@/app/_actions/gestao';
import { ExcluirConfirmado } from '@/features/shared/excluir-confirmado';
import { Card, Hero, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Ring } from '@/ui/charts/ring';
import { Recolhivel } from '@/ui/patterns/collapsible';
import { Field, Input, MoneyInput, RadioChips } from '@/ui/primitives/fields';
import { EmptyState } from '@/ui/patterns/empty-state';

export const metadata = { title: 'Metas e reserva' };

function FormMeta({
  m,
  hoje,
}: {
  m?: Awaited<ReturnType<Awaited<ReturnType<typeof carregarBase>>['c']['goals']['list']>>[number];
  hoje: string;
}) {
  return (
    <ActionForm action={salvarMetaAction} submitLabel="Salvar meta">
      <input type="hidden" name="id" value={m?.id ?? ''} />
      <Field label="Tipo">
        <RadioChips
          name="kind"
          defaultValue={m?.kind ?? 'other'}
          options={[
            { value: 'other', label: 'Meta' },
            { value: 'emergency', label: 'Reserva de emergência' },
          ]}
        />
      </Field>
      <Field label="Nome">
        <Input name="name" required maxLength={80} defaultValue={m?.name ?? ''} />
      </Field>
      <Field label="Valor alvo">
        <MoneyInput
          name="target"
          required
          defaultValue={m ? centavosParaCampo(m.targetCents) : ''}
        />
      </Field>
      <Field label="Valor atual">
        <MoneyInput name="current" defaultValue={m ? centavosParaCampo(m.currentCents) : '0,00'} />
      </Field>
      <Field label="Prazo (opcional)">
        <Input type="date" name="deadline" min={hoje} defaultValue={m?.deadline ?? ''} />
      </Field>
      <Field label="Aporte mensal planejado (opcional)">
        <MoneyInput
          name="planned"
          defaultValue={m?.plannedMonthlyCents ? centavosParaCampo(m.plannedMonthlyCents) : ''}
        />
      </Field>
    </ActionForm>
  );
}

export default async function MetasPage() {
  const { c, hoje, mesAtual } = await carregarBase();
  const meses = [addMeses(mesAtual, -3), addMeses(mesAtual, -2), addMeses(mesAtual, -1)];
  const [metas, det] = await Promise.all([
    c.goals.list(),
    c.queries.detalhado(primeiroDia(meses[0]!), ultimoDia(meses[2]!)),
  ]);
  const porMes = meses.map((m) =>
    det
      .filter(
        (d) =>
          d.kind === 'expense' &&
          !ehBeneficio(d.walletKind) &&
          d.occurredOn >= primeiroDia(m) &&
          d.occurredOn <= ultimoDia(m),
      )
      .reduce((s, d) => s + d.cents, 0),
  );
  const media = mediaGastoMensal(porMes);
  const reserva = metas.find((m) => m.kind === 'emergency');
  const cobertura = reserva ? coberturaEmMeses(reserva.currentCents, media) : 0;

  return (
    <>
      <PageHeader voltar={{ href: '/mais' }} title="Metas e reserva" />
      <Hero>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-white/75">Reserva de emergência</p>
            {reserva ? (
              <>
                <p className="mt-1 text-4xl font-semibold leading-tight">
                  <span className="amount">{cobertura.toFixed(1).replace('.', ',')}</span>{' '}
                  <span className="text-base font-medium text-white/75">meses</span>
                </p>
                <p className="mt-1 text-sm text-white/75">
                  <span className="amount">{centavosParaCampo(reserva.currentCents)}</span> guardados
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-white/75">
                Cadastre uma meta do tipo “Reserva de emergência” para ver a cobertura em meses.
              </p>
            )}
          </div>
          {reserva && (
            <Ring
              pct={Math.min(100, (cobertura / 6) * 100)}
              size={88}
              sobreEscuro
              alerta={cobertura < 3}
              rotulo={`${Math.min(100, Math.round((cobertura / 6) * 100))}%`}
              descricao={`Cobertura de ${cobertura.toFixed(1).replace('.', ',')} meses, meta de 6 meses`}
            />
          )}
        </div>
        {reserva && (
          <p className="mt-4 text-xs text-white/75">
            Meta de 6 meses. Gasto médio de <span className="amount">{centavosParaCampo(media)}</span>/mês nos últimos
            3 meses, sem VR/VA.
          </p>
        )}
      </Hero>

      <div className="lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-8">
      <div>
      <SectionTitle>Suas metas</SectionTitle>
      {metas.length === 0 ? (
        <EmptyState icone="target" title="Nenhuma meta">Crie a primeira no formulário mais abaixo, com valor e prazo.</EmptyState>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {metas.map((m) => {
            const falta = mesesParaAtingir(m),
              nec = aporteNecessario(m, hoje);
            return (
              <Card key={m.id} className="space-y-2">
                <div className="flex items-center gap-3">
                  <Ring pct={progressoPct(m)} size={56} rotulo={`${progressoPct(m)}%`} descricao={`${m.name}: ${progressoPct(m)}% atingido`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{m.name}</p>
                    <p className="text-sm">
                      <span className="amount font-semibold">{centavosParaCampo(m.currentCents)}</span>{' '}
                      <span className="text-muted">
                        de <span className="amount">{centavosParaCampo(m.targetCents)}</span>
                      </span>
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted">
                  faltam <span className="amount font-semibold text-ink">{centavosParaCampo(Math.max(0, m.targetCents - m.currentCents))}</span>
                  {m.deadline && <> · prazo {dataCurta(m.deadline)}</>}
                </p>
                {nec !== null && (
                  <p className="text-xs text-muted">
                    Para chegar no prazo: <span className="amount">{centavosParaCampo(nec)}</span>/mês
                  </p>
                )}
                {falta !== null && falta > 0 && (
                  <p className="text-xs text-muted">
                    No ritmo planejado: {falta} {falta === 1 ? 'mês' : 'meses'}.
                  </p>
                )}
                <Recolhivel titulo="Editar" className="border-0 bg-transparent px-0">
                  <FormMeta m={m} hoje={hoje} />
                </Recolhivel>
                <ExcluirConfirmado action={excluirMetaAction} id={m.id} aviso="A meta e o progresso dela são apagados." />
              </Card>
            );
          })}
        </div>
      )}
      </div>
      <div>
      <SectionTitle>Nova meta</SectionTitle>
      <Recolhivel titulo="Criar meta" aberto={metas.length === 0}>
        <FormMeta hoje={hoje} />
      </Recolhivel>
      </div>
      </div>
    </>
  );
}
