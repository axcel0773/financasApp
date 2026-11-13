import Link from 'next/link';
import { estadoViagem, resumirViagem, type EstadoViagem } from '@/core/trips/domain';
import { carregarBase } from '@/features/base';
import { centavosParaCampo, dataCurta } from '@/ui/format';
import { ButtonLink } from '@/ui/primitives/button';
import { Card, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Chip } from '@/ui/primitives/chip';
import { EmptyState } from '@/ui/primitives/progress';

export const metadata = { title: 'Viagens' };
const GRUPOS: { estado: EstadoViagem; titulo: string }[] = [
  { estado: 'andamento', titulo: 'Em andamento' },
  { estado: 'planejada', titulo: 'Planejadas' },
  { estado: 'concluida', titulo: 'Concluídas' },
];

export default async function ViagensPage() {
  const { c, hoje } = await carregarBase();
  const viagens = await c.trips.list();
  const ids = new Set(viagens.map((v) => v.id));
  const gastos = ids.size
    ? (await c.transactions.list({ escopo: 'viagens', limite: 1000, de: viagens.reduce((m, v) => (v.startOn < m ? v.startOn : m), hoje) }))
    : [];
  const porViagem = new Map<string, { categoryId: string | null; cents: number }[]>();
  for (const t of gastos)
    if (t.tripId && t.kind === 'expense' && ids.has(t.tripId))
      porViagem.set(t.tripId, [...(porViagem.get(t.tripId) ?? []), { categoryId: t.categoryId, cents: t.amountCents }]);
  const resumos = viagens.map((v) => ({ v, r: resumirViagem(v, porViagem.get(v.id) ?? [], hoje), estado: estadoViagem(v, hoje) }));
  const totalAno = resumos.filter((x) => x.v.startOn.slice(0, 4) === hoje.slice(0, 4)).reduce((s, x) => s + x.r.totalCents, 0);

  return (
    <>
      <PageHeader voltar={{ href: '/mais' }} title="Viagens" subtitle="Orçamento e gastos de cada viagem" action={<ButtonLink href="/mais/viagens/nova">Nova</ButtonLink>} />
      {viagens.length === 0 ? (
        <EmptyState title="Nenhuma viagem">Crie uma viagem para acompanhar o orçamento e os gastos dela.</EmptyState>
      ) : (
        <>
          <Card className="mb-3"><p className="text-sm text-muted">Gasto em viagens em {hoje.slice(0, 4)}</p><p className="amount text-xl font-bold">R$ {centavosParaCampo(totalAno)}</p></Card>
          {GRUPOS.map((g) => {
            const itens = resumos.filter((x) => x.estado === g.estado);
            if (itens.length === 0) return null;
            return (
              <section key={g.estado}>
                <SectionTitle>{g.titulo}</SectionTitle>
                <div className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
                  {itens.map(({ v, r }) => (
                    <Link key={v.id} href={`/mais/viagens/${v.id}`} className="block">
                      <Card className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div><p className="font-semibold">{v.name}</p><p className="text-xs text-muted">{v.endOn ? `${dataCurta(v.startOn)} a ${dataCurta(v.endOn)}` : `${dataCurta(v.startOn)} · volta em aberto`}</p></div>
                          {r.usadoPct !== null && <Chip tom={r.estourou ? 'danger' : 'info'}>{r.usadoPct}%</Chip>}
                        </div>
                        {r.usadoPct !== null && (
                          <div className="h-2 overflow-hidden rounded-full bg-border" aria-hidden><div className={`h-full ${r.estourou ? 'bg-expense-text' : 'bg-trip'}`} style={{ width: `${Math.min(100, r.usadoPct)}%` }} /></div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="amount font-semibold">R$ {centavosParaCampo(r.totalCents)}</span>
                          <span className="text-muted">{v.budgetCents > 0 ? `de R$ ${centavosParaCampo(v.budgetCents)}` : 'sem orçamento'}</span>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </>
  );
}
