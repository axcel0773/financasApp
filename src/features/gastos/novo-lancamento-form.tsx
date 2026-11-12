'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { criarLancamentoAction } from '@/app/_actions/gastos';
import { parseBRL } from '@/core/shared/money';
import { centavosParaCampo } from '@/ui/format';
import { cx } from '@/ui/cx';
import { enfileirar } from '@/infra/offline/queue';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { Keypad } from '@/ui/patterns/keypad';
import { Button } from '@/ui/primitives/button';
import { Field, Input, MoneyInput } from '@/ui/primitives/fields';
import { useToast } from '@/ui/primitives/toast';

interface Op {
  id: string;
  nome: string;
  cor?: string | null;
}

/** Teclado numérico em telas de toque; campo de valor + teclado físico no desktop. Funciona offline (fila local). */
export function NovoLancamentoForm({
  carteiras,
  categorias,
  hoje,
  carteiraInicial,
}: {
  carteiras: Op[];
  categorias: Op[];
  hoje: string;
  carteiraInicial: string;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, start] = useTransition();
  const [clientId] = useState(() => crypto.randomUUID());
  const [cents, setCents] = useState(0);
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [walletId, setWalletId] = useState(carteiraInicial);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [data, setData] = useState(hoje);
  const [note, setNote] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const salvar = () => {
    setErro(null);
    if (cents <= 0) return setErro('Informe um valor maior que zero.');
    const item = {
      op: 'criar' as const,
      clientId,
      walletId,
      categoryId,
      kind,
      amountCents: cents,
      occurredOn: data,
      note: note.trim() || null,
    };
    start(async () => {
      if (!navigator.onLine) {
        await enfileirar(item);
        show('Sem conexão: salvo no aparelho e será enviado quando voltar.');
        return router.push('/gastos');
      }
      try {
        const r = await criarLancamentoAction(item);
        if (!r.ok) return setErro(r.message);
        show('Lançamento salvo.');
        router.push('/gastos');
      } catch {
        await enfileirar(item); // queda de rede no meio do envio: o reenvio é idempotente
        show('Conexão instável: salvo no aparelho e será reenviado.');
        router.push('/gastos');
      }
    });
  };

  const chip = (ativo: boolean) =>
    cx(
      'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold',
      ativo ? 'border-primary bg-primary text-white' : 'border-border bg-surface',
    );
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Tipo" className="grid grid-cols-2 gap-2 rounded-md bg-bg p-1">
        {(['expense', 'income'] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={cx(
              'min-h-11 rounded-md text-sm font-semibold',
              kind === k ? 'bg-surface shadow-sm' : 'text-muted',
            )}
          >
            {k === 'expense' ? 'Gasto' : 'Entrada'}
          </button>
        ))}
      </div>
      <div className="py-2 text-center">
        <AmountDisplay cents={cents} size="xl" tom={kind === 'expense' ? 'expense' : 'income'} />
      </div>
      <div className="[@media(pointer:coarse)]:hidden">
        <Field label="Valor">
          <MoneyInput
            value={cents ? centavosParaCampo(cents) : ''}
            onChange={(e) => {
              const r = parseBRL(e.target.value || '0');
              if (r.ok) setCents(Math.max(0, r.value));
            }}
          />
        </Field>
      </div>
      <Keypad cents={cents} onChange={setCents} />
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Carteira</legend>
        <div className="flex flex-wrap gap-2">
          {carteiras.map((w) => (
            <button
              key={w.id}
              type="button"
              aria-pressed={walletId === w.id}
              className={chip(walletId === w.id)}
              onClick={() => setWalletId(w.id)}
            >
              {w.nome}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Categoria</legend>
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={categoryId === c.id}
              className={chip(categoryId === c.id)}
              onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
            >
              {c.nome}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Data">
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </Field>
        <Field label="Descrição (opcional)">
          <Input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
      {erro && (
        <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-expense-text">
          {erro}
        </p>
      )}
      <Button block onClick={salvar} disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar lançamento'}
      </Button>
    </div>
  );
}
