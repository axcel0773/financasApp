import { salvarViagemAction } from '@/app/_actions/viagens';
import type { Viagem } from '@/core/trips/domain';
import { centavosParaCampo } from '@/ui/format';
import { ActionForm } from '@/features/shared/action-form';
import { Field, Input, MoneyInput } from '@/ui/primitives/fields';

export function FormViagem({ viagem, hoje }: { viagem?: Viagem; hoje: string }) {
  return (
    <ActionForm action={salvarViagemAction} submitLabel={viagem ? 'Salvar viagem' : 'Criar viagem'}>
      <input type="hidden" name="id" value={viagem?.id ?? ''} />
      <Field label="Nome da viagem"><Input name="name" defaultValue={viagem?.name ?? ''} required maxLength={80} placeholder="Florianópolis" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ida"><Input type="date" name="startOn" defaultValue={viagem?.startOn ?? hoje} required /></Field>
        <Field label="Volta" hint="Deixe em branco se ainda não sabe."><Input type="date" name="endOn" defaultValue={viagem?.endOn ?? ''} /></Field>
      </div>
      <Field label="Orçamento total" hint="Deixe em branco para viagem sem limite."><MoneyInput name="budget" defaultValue={viagem ? centavosParaCampo(viagem.budgetCents) : ''} /></Field>
      <Field label="Pessoas que dividem" hint="Só para mostrar quanto saiu por pessoa."><Input name="people" inputMode="numeric" defaultValue={viagem?.people ?? 1} required /></Field>
    </ActionForm>
  );
}
