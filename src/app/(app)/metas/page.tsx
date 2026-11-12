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
import { centavosParaCampo, dataLonga } from '@/ui/format';
import { ActionForm } from '@/ui/patterns/action-form';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { excluirMetaAction } from '@/app/_actions/gestao';
import { ExcluirConfirmado } from '@/features/shared/excluir-confirmado';
import { Card, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Field, Input, MoneyInput, RadioChips } from '@/ui/primitives/fields';
import { EmptyState, ProgressBar } from '@/ui/primitives/progress';

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
  const metas = await c.goals.list();
  const meses = [addMeses(mesAtual, -3), addMeses(mesAtual, -2), addMeses(mesAtual, -1)];
  const det = await c.queries.detalhado(primeiroDia(meses[0]!), ultimoDia(meses[2]!));
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
      <Card className="space-y-2">
        <p className="text-sm text-muted">Reserva de emergência</p>
        {reserva ? (
          <>
            <p className="text-3xl font-extrabold">
              <span className="amount">{cobertura.toFixed(1).replace('.', ',')}</span>{' '}
              <span className="text-base font-semibold">meses de cobertura</span>
            </p>
            <ProgressBar
              pct={Math.min(100, (cobertura / 6) * 100)}
              tom={cobertura >= 3 ? 'ok' : 'alert'}
              label="Cobertura da reserva (meta de 6 meses)"
            />
            <p className="text-sm text-muted">
              Reserva <span className="amount">{centavosParaCampo(reserva.currentCents)}</span> ÷
              gasto médio de <span className="amount">{centavosParaCampo(media)}</span>/mês (últimos
              3 meses, sem VR/VA).
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">
            Cadastre uma meta do tipo “Reserva de emergência” para ver a cobertura em meses.
          </p>
        )}
      </Card>

      <SectionTitle>Suas metas</SectionTitle>
      {metas.length === 0 ? (
        <EmptyState title="Nenhuma meta">Crie a primeira abaixo.</EmptyState>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {metas.map((m) => {
            const falta = mesesParaAtingir(m),
              nec = aporteNecessario(m, hoje);
            return (
              <Card key={m.id} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold">{m.name}</p>
                  <span className="text-sm font-semibold">{progressoPct(m)}%</span>
                </div>
                <ProgressBar pct={progressoPct(m)} tom="ok" label={`${m.name}: progresso`} />
                <div className="flex justify-between text-sm">
                  <AmountDisplay cents={m.currentCents} size="sm" />
                  <span className="text-muted">
                    de <span className="amount">{centavosParaCampo(m.targetCents)}</span>
                  </span>
                </div>
                {m.deadline && (
                  <p className="text-xs text-muted">
                    Prazo {dataLonga(m.deadline)}
                    {nec !== null ? (
                      <>
                        {' '}
                        · precisa de <span className="amount">{centavosParaCampo(nec)}</span>/mês
                      </>
                    ) : null}
                  </p>
                )}
                {falta !== null && falta > 0 && (
                  <p className="text-xs text-muted">
                    No ritmo planejado: {falta} {falta === 1 ? 'mês' : 'meses'}.
                  </p>
                )}
                <details>
                  <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary">
                    Editar
                  </summary>
                  <FormMeta m={m} hoje={hoje} />
                </details>
                <ExcluirConfirmado action={excluirMetaAction} id={m.id} aviso="A meta e o progresso dela são apagados." />
              </Card>
            );
          })}
        </div>
      )}
      <SectionTitle>Nova meta</SectionTitle>
      <Card>
        <FormMeta hoje={hoje} />
      </Card>
    </>
  );
}
