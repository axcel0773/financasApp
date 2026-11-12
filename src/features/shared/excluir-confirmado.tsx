import type { ActionState } from '@/app/_lib/action-state';
import { ActionForm } from '@/ui/patterns/action-form';

/** Exclusão em dois passos: abrir o aviso e só então confirmar. Serve para qualquer ação que receba `id`. */
export function ExcluirConfirmado({
  action,
  id,
  rotulo = 'Excluir',
  aviso,
  campos,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  id: string;
  rotulo?: string;
  aviso: string;
  campos?: Record<string, string>;
}) {
  return (
    <details>
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-expense-text">
        {rotulo}
      </summary>
      <ActionForm action={action} submitLabel={`Confirmar: ${rotulo.toLowerCase()}`} variante="danger" className="space-y-3 pb-1">
        <input type="hidden" name="id" value={id} />
        {Object.entries(campos ?? {}).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <p className="text-sm text-muted">{aviso}</p>
      </ActionForm>
    </details>
  );
}
