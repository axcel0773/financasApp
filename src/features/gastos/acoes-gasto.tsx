'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { desfazerExclusaoAction, excluirLancamentoAction } from '@/app/_actions/gastos';
import { enfileirar } from '@/infra/offline/queue';
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
          const guardar = async () => {
            await enfileirar({ clientId: `excluir:${id}`, op: 'excluir', alvoId: id });
            show('Sem conexão: a exclusão será enviada quando voltar.');
            router.push('/gastos');
          };
          if (!navigator.onLine) return guardar();
          let r;
          try {
            r = await excluirLancamentoAction(id);
          } catch {
            return guardar(); // queda de rede no meio do envio
          }
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
