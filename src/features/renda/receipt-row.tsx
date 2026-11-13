import { confirmarRecebimentoAction } from '@/app/_actions/renda';
import type { Recebimento } from '@/core/income/domain';
import { diferencaPrevistoRecebido } from '@/core/income/domain';
import { centavosParaCampo, dataCurta } from '@/ui/format';
import { ActionForm } from '@/features/shared/action-form';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { Chip } from '@/ui/primitives/chip';
import { Field, Input, MoneyInput, Select } from '@/ui/primitives/fields';
import { Icon } from '@/ui/primitives/icon';

const ROTULO: Record<Recebimento['kind'], string> = {
  advance: 'Adiantamento',
  final: 'Pagamento final',
  thirteenth_1: '13º — 1ª parcela',
  thirteenth_2: '13º — 2ª parcela',
  vacation: 'Férias',
  plr: 'PLR',
  extra: 'Extra',
};
export const rotuloRecebimento = (k: Recebimento['kind']) => ROTULO[k];

export function ReceiptRow({
  r,
  hoje,
  carteiras,
  sugestao,
  comConfirmar = true,
}: {
  r: Recebimento;
  hoje: string;
  carteiras: { id: string; nome: string }[];
  sugestao?: { grossCents: number; deductionsCents: number };
  comConfirmar?: boolean;
}) {
  const recebido = r.receivedOn !== null;
  const atrasado = !recebido && r.expectedOn !== null && r.expectedOn < hoje;
  const dif = diferencaPrevistoRecebido(r);
  const bruto = sugestao?.grossCents ?? r.expectedNetCents ?? 0;
  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{ROTULO[r.kind]}</p>
          <p className="text-xs text-muted">
            {recebido
              ? `Recebido em ${dataCurta(r.receivedOn!)}`
              : r.expectedOn
                ? `Previsto para ${dataCurta(r.expectedOn)}`
                : 'Sem data prevista'}
          </p>
        </div>
        <div className="text-right">
          <AmountDisplay
            cents={recebido ? (r.netCents ?? 0) : (r.expectedNetCents ?? 0)}
            size="md"
            tom={recebido ? 'income' : 'default'}
          />
          <div className="mt-0.5">
            {recebido ? (
              <Chip tom="ok">
                <Icon name="check" size={12} />
                Recebido
              </Chip>
            ) : atrasado ? (
              <Chip tom="alert">
                <Icon name="alert" size={12} />
                Atrasado
              </Chip>
            ) : (
              <Chip>Previsto</Chip>
            )}
          </div>
        </div>
      </div>
      {recebido && dif !== null && dif !== 0 && (
        <p className="mt-1 text-xs text-muted">
          Diferença sobre o previsto:{' '}
          <AmountDisplay cents={dif} sinal size="sm" tom={dif < 0 ? 'expense' : 'income'} />
        </p>
      )}
      {recebido && r.grossCents !== null && (
        <p className="mt-1 text-xs text-muted">
          Bruto <span className="amount">{centavosParaCampo(r.grossCents)}</span> · descontos{' '}
          <span className="amount">{centavosParaCampo(r.deductionsCents)}</span>
        </p>
      )}
      {!recebido && comConfirmar && (
        <details className="mt-2">
          <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-link">
            Confirmar recebimento
          </summary>
          <ActionForm
            action={confirmarRecebimentoAction}
            submitLabel="Confirmar"
            className="mt-2 space-y-3"
          >
            <input type="hidden" name="id" value={r.id} />
            <Field label="Data do recebimento">
              <Input
                type="date"
                name="receivedOn"
                defaultValue={r.expectedOn && r.expectedOn <= hoje ? r.expectedOn : hoje}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bruto">
                <MoneyInput name="gross" defaultValue={centavosParaCampo(bruto)} required />
              </Field>
              <Field label="Descontos">
                <MoneyInput
                  name="deductions"
                  defaultValue={centavosParaCampo(sugestao?.deductionsCents ?? 0)}
                  required
                />
              </Field>
            </div>
            <p className="text-xs text-muted">
              Líquido = bruto − descontos. Ajuste com os valores reais do holerite.
            </p>
            <Field label="Depositado em">
              <Select name="walletId" defaultValue={r.walletId ?? carteiras[0]?.id ?? ''}>
                {carteiras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </Field>
          </ActionForm>
        </details>
      )}
    </div>
  );
}
