'use client';

import { desfazerExclusaoAction, excluirLancamentoAction } from '@/app/_actions/gastos';
import { useEnvio } from '@/features/shared/use-envio';
import { enfileirar } from '@/infra/offline/queue';
import { Button } from '@/ui/primitives/button';
import { Icon } from '@/ui/primitives/icon';
import { useToast } from '@/ui/primitives/toast';

/** `voltarPara`: para onde ir depois de excluir (mantém mês e filtros de quem chamou). */
export function ExcluirButton({ id, voltarPara = '/gastos' }: { id: string; voltarPara?: string }) {
  const { show } = useToast();
  const { pending, enviar, atualizarTela, navegar } = useEnvio();
  const excluir = () =>
    enviar(async () => {
      const guardar = async () => {
        await enfileirar({ clientId: `excluir:${id}`, op: 'excluir', alvoId: id });
        show('Sem conexão: a exclusão será enviada quando voltar.');
        navegar(voltarPara);
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
          void desfazerExclusaoAction(id).then(atualizarTela);
        },
      });
      navegar(voltarPara);
    });
  return (
    <Button variant="danger" block disabled={pending} onClick={() => void excluir()}>
      <Icon name="trash" size={18} />
      Excluir lançamento
    </Button>
  );
}

export function RestaurarButton({ id }: { id: string }) {
  const { show } = useToast();
  const { pending, enviar, atualizarTela } = useEnvio();
  const restaurar = () =>
    enviar(async () => {
      try {
        const r = await desfazerExclusaoAction(id);
        if (!r.ok) return show(r.message ?? 'Não foi possível restaurar.');
        atualizarTela();
      } catch {
        show('Não foi possível restaurar. Confira a conexão.');
      }
    });
  return (
    <Button variant="secondary" disabled={pending} onClick={() => void restaurar()}>
      <Icon name="undo" size={18} />
      Restaurar
    </Button>
  );
}
