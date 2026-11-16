import Link from 'next/link';
import { estadoViagem, resumirViagem, type EstadoViagem } from '@/core/trips/domain';
import { carregarBase } from '@/features/base';
import { centavosParaCampo, dataCurta } from '@/ui/format';
import { ButtonLink } from '@/ui/primitives/button';
import { Card, Hero, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Ring } from '@/ui/charts/ring';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { Icon } from '@/ui/primitives/icon';
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
          <Hero className="mb-3">
            <p className="text-sm text-white/75">Gasto em viagens em {hoje.slice(0, 4)}</p>
            <AmountDisplay cents={totalAno} tom="onDark" size="xl" />
            <p className="mt-1 text-sm text-white/75">
              {viagens.length} {viagens.length === 1 ? 'viagem' : 'viagens'} · {resumos.filter((x) => x.estado === 'andamento').length} em andamento
            </p>
          </Hero>
          {GRUPOS.map((g) => {
            const itens = resumos.filter((x) => x.estado === g.estado);
            if (itens.length === 0) return null;
            return (
              <section key={g.estado}>
                <SectionTitle>{g.titulo}</SectionTitle>
                <div className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
                  {itens.map(({ v, r }) => (
                    <Link key={v.id} href={`/mais/viagens/${v.id}`} className="block">
                      <Card className="space-y-3 transition-colors hover:border-muted">
                        <div className="flex items-center gap-3">
                          <Ring
                            pct={r.usadoPct ?? 0}
                            size={52}
                            alerta={r.estourou}
                            rotulo={r.usadoPct !== null ? `${r.usadoPct}%` : '—'}
                            descricao={r.usadoPct !== null ? `${v.name}: ${r.usadoPct}% do orçamento usado` : `${v.name}: sem orçamento`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{v.name}</p>
                            <p className="truncate text-xs text-muted">{v.endOn ? `${dataCurta(v.startOn)} a ${dataCurta(v.endOn)}` : `${dataCurta(v.startOn)} · volta em aberto`}</p>
                          </div>
                          <Icon name="chevron" size={18} className="shrink-0 text-muted" />
                        </div>
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
