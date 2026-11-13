import { getContainer } from '@/composition/container';
import { ocorrenciasPendentes } from '@/core/recurring/domain';
import { addDias, competenciaDe } from '@/core/shared/competencia';
import { rotuloRecebimento } from '@/features/renda/receipt-row';
import { dataCurta } from '@/ui/format';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { TransactionRow } from '@/ui/patterns/transaction-row';
import { Card, SectionTitle } from '@/ui/primitives/card';
import { EmptyState } from '@/ui/primitives/progress';
import { linkVer } from './link-ver';

export async function BlocoRecebimentos() {
  const c = await getContainer();
  const hoje = c.clock.hoje(),
    mes = competenciaDe(hoje);
  const receb = (await c.income.recebimentos(mes, competenciaDe(addDias(hoje, 45))))
    .filter((r) => r.receivedOn === null)
    .sort((a, b) => (a.expectedOn ?? '').localeCompare(b.expectedOn ?? ''))
    .slice(0, 3);
  return (
    <>
      <SectionTitle action={linkVer('/renda')}>Próximos recebimentos</SectionTitle>
      {receb.length === 0 ? (
        <EmptyState title="Nenhum recebimento previsto">Cadastre o salário em Renda.</EmptyState>
      ) : (
        <Card className="py-1">
          {receb.map((r) => (
            <div
              key={r.id}
              className="flex min-h-14 items-center justify-between border-b border-border last:border-0"
            >
              <div>
                <p className="font-semibold">{rotuloRecebimento(r.kind)}</p>
                <p className="text-xs text-muted">
                  {r.expectedOn ? dataCurta(r.expectedOn) : 'sem data'}
                </p>
              </div>
              <AmountDisplay cents={r.expectedNetCents ?? 0} size="md" tom="income" />
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

export async function BlocoContas() {
  const c = await getContainer();
  const hoje = c.clock.hoje(),
    ate = addDias(hoje, 14);
  const regras = await c.recurring.regras();
  const comps = [...new Set([competenciaDe(hoje), competenciaDe(ate)])];
  const out = [];
  for (const comp of comps)
    out.push(
      ...ocorrenciasPendentes(regras, comp, await c.recurring.chavesGeradas(comp)).filter(
        (o) => o.date >= hoje && o.date <= ate,
      ),
    );
  out.sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <SectionTitle action={linkVer('/fixos')}>Próximas contas</SectionTitle>
      {out.length === 0 ? (
        <EmptyState title="Nenhuma conta nos próximos 14 dias" />
      ) : (
        <Card className="py-1">
          {out.slice(0, 4).map((o) => (
            <div
              key={`${o.ruleId}${o.date}`}
              className="flex min-h-14 items-center justify-between border-b border-border last:border-0"
            >
              <div>
                <p className="font-semibold">{o.name}</p>
                <p className="text-xs text-muted">{dataCurta(o.date)}</p>
              </div>
              <AmountDisplay cents={-o.amountCents} sinal size="sm" tom="expense" />
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

export async function BlocoRecentes() {
  const c = await getContainer();
  const [lista, wallets, cats] = await Promise.all([
    c.transactions.list({ limite: 5 }),
    c.wallets.list(),
    c.categories.list(),
  ]);
  return (
    <>
      <SectionTitle action={linkVer('/gastos')}>Últimos lançamentos</SectionTitle>
      {lista.length === 0 ? (
        <EmptyState title="Nenhum lançamento ainda">
          Toque em “+” para registrar o primeiro gasto.
        </EmptyState>
      ) : (
        <Card className="px-4 py-1">
          {lista.map((t) => {
            const cat = cats.find((x) => x.id === t.categoryId);
            return (
              <TransactionRow
                key={t.id}
                compacto
                t={{
                  id: t.id,
                  href: `/gastos/${t.id}`,
                  descricao: t.note ?? cat?.name ?? 'Lançamento',
                  categoria: cat ? { nome: cat.name, cor: cat.color ?? '#667085' } : null,
                  carteira: wallets.find((w) => w.id === t.walletId)?.name ?? '',
                  data: dataCurta(t.occurredOn),
                  cents: t.amountCents,
                  kind: t.kind,
                }}
              />
            );
          })}
        </Card>
      )}
    </>
  );
}
