'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { desfazerExclusaoAction, excluirLancamentoAction } from '@/app/_actions/gastos';
import { Button } from '@/ui/primitives/button';
import { Icon } from '@/ui/primitives/icon';
import { useToast } from '@/ui/primitives/toast';

export function ExcluirButton({ id }: { id: string }) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="danger"
      block
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await excluirLancamentoAction(id);
          if (!r.ok) return show(r.message ?? 'Não foi possível excluir.');
          show('Lançamento excluído.', {
            label: 'Desfazer',
            run: () => {
              void desfazerExclusaoAction(id).then(() => router.refresh());
            },
          });
          router.push('/gastos');
        })
      }
    >
      <Icon name="trash" size={18} />
      Excluir lançamento
    </Button>
  );
}

export function RestaurarButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await desfazerExclusaoAction(id);
          router.refresh();
        })
      }
    >
      <Icon name="undo" size={18} />
      Restaurar
    </Button>
  );
}
