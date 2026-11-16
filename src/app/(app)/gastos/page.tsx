import Link from 'next/link';
import { addMeses, isIsoDate, primeiroDia, ultimoDia } from '@/core/shared/competencia';
import { totaisPorCategoria } from '@/core/reports/domain';
import { ROTULO_CARTEIRA } from '@/core/wallets/domain';
import { viagensParaLancar } from '@/core/trips/domain';
import { carregarBase, opcoesLancamento } from '@/features/base';
import { ExcluirButton } from '@/features/gastos/acoes-gasto';
import { JanelaNovoLancamento } from '@/features/gastos/janela-novo-lancamento';
import { PainelNovo } from '@/features/gastos/painel-novo';
import { PendingQueue } from '@/features/gastos/pending-queue';
import { competenciaDoParam, dataCurta, dataLonga, rotuloCompetencia } from '@/ui/format';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { CategoryBreakdown } from '@/ui/patterns/category-breakdown';
import { MonthSwitch } from '@/ui/patterns/month-switch';
import { TransactionHeader, TransactionRow } from '@/ui/patterns/transaction-row';
import { ButtonLink } from '@/ui/primitives/button';
import { Card, Hero, PageHeader } from '@/ui/primitives/card';
import { FilterChip } from '@/ui/primitives/chip';
import { Input } from '@/ui/primitives/fields';
import { Icon } from '@/ui/primitives/icon';
import { EmptyState } from '@/ui/patterns/empty-state';

export const metadata = { title: 'Gastos' };
const PAGINA = 30;
type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function GastosPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { c, wallets, categories, mesAtual, hoje } = await carregarBase();
  const mes = competenciaDoParam(sp.mes, mesAtual);
  const carteira = typeof sp.carteira === 'string' ? sp.carteira : undefined;
  const categoria = typeof sp.categoria === 'string' ? sp.categoria : undefined;
  const tipo = sp.tipo === 'dia' || sp.tipo === 'viagens' ? sp.tipo : undefined;
  const selId = typeof sp.sel === 'string' && /^[0-9a-f-]{36}$/i.test(sp.sel) ? sp.sel : undefined;
  const novoAberto = sp.novo === '1';
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 80) : '';
  const deP = typeof sp.de === 'string' && isIsoDate(sp.de) ? sp.de : undefined;
  const ateP = typeof sp.ate === 'string' && isIsoDate(sp.ate) ? sp.ate : undefined;
  const periodoLivre = !!deP && !!ateP && deP <= ateP;
  // Busca vinda da barra superior (desktop): procura em todo o histórico, não só no mês.
  const buscaGlobal = sp.tudo === '1' && !!q && !periodoLivre;
  const inicio = buscaGlobal ? '2000-01-01' : periodoLivre ? deP! : primeiroDia(mes);
  const fim = buscaGlobal ? '2999-12-31' : periodoLivre ? ateP! : ultimoDia(mes);
  const cursorStr =
    typeof sp.cursor === 'string' && /^\d{4}-\d{2}-\d{2}_[0-9a-f-]{36}$/i.test(sp.cursor) ? sp.cursor : undefined;
  const cursor = cursorStr ? { occurredOn: cursorStr.slice(0, 10), id: cursorStr.slice(11) } : undefined;

  const [lista, mensal, viagensTodas, selecionado] = await Promise.all([
    c.transactions.list({
      de: inicio,
      ate: fim,
      texto: q || undefined,
      escopo: tipo,
      walletId: carteira,
      categoryId: categoria,
      limite: PAGINA + 1,
      cursor,
    }),
    buscaGlobal ? Promise.resolve([]) : c.queries.detalhado(inicio, fim),
    c.trips.list(),
    selId ? c.transactions.get(selId) : Promise.resolve(null),
  ]);
  const sel = selecionado && !selecionado.deletedAt ? selecionado : null;
  const nomeViagem = new Map(viagensTodas.map((v) => [v.id, v.name]));
  const paraLancar = viagensParaLancar(viagensTodas, hoje);
  const temMais = lista.length > PAGINA;
  const itens = lista.slice(0, PAGINA);
  const despesasPeriodo = mensal.filter((g) => g.kind === 'expense');
  const gastoViagens = despesasPeriodo.filter((g) => g.tripId).reduce((s, g) => s + g.cents, 0);
  const gastoDia = despesasPeriodo.filter((g) => !g.tripId).reduce((s, g) => s + g.cents, 0);
  const totalGasto = tipo === 'dia' ? gastoDia : tipo === 'viagens' ? gastoViagens : gastoDia + gastoViagens;
  const carteiras = Object.fromEntries(wallets.map((w) => [w.id, w.name]));
  const cats = Object.fromEntries(
    categories.map((x) => [x.id, { nome: x.name, cor: x.color ?? '#667085' }]),
  );

  const url = (extra: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const base = { mes, carteira, categoria, tipo, cursor: cursorStr, tudo: buscaGlobal ? '1' : undefined, q: q || undefined, de: periodoLivre ? deP : undefined, ate: periodoLivre ? ateP : undefined, ...extra };
    for (const [k, v] of Object.entries(base)) if (v) params.set(k, v);
    return `/gastos?${params.toString()}`;
  };
  // "Para onde foi": gastos do período por categoria, respeitando tipo e carteira (cada linha filtra a lista)
  const porCategoria = totaisPorCategoria(
    despesasPeriodo
      .filter((g) => (tipo === 'dia' ? !g.tripId : tipo === 'viagens' ? !!g.tripId : true))
      .filter((g) => !carteira || g.walletId === carteira)
      .map((g) => ({ categoryId: g.categoryId, cents: g.cents })),
    categories.map((x) => ({ id: x.id, name: x.name, color: x.color })),
  )
    .slice(0, 6)
    .map((f) => ({
      id: f.categoryId,
      nome: f.name,
      cor: f.categoryId ? f.color : null,
      cents: f.cents,
      pct: f.pct,
      href: f.categoryId ? url({ categoria: categoria === f.categoryId ? undefined : f.categoryId, cursor: undefined, sel: undefined }) : undefined,
      ativo: !!f.categoryId && categoria === f.categoryId,
    }));
  const ultimo = itens[itens.length - 1];

  return (
    <>
      <PageHeader
        title="Gastos"
        subtitle={
          buscaGlobal
            ? `Busca por “${q}” em todo o histórico`
            : periodoLivre
              ? `${dataCurta(inicio)} a ${dataCurta(fim)}`
              : rotuloCompetencia(mes)
        }
        action={
          <ButtonLink href="/gastos/novo" className="hidden md:inline-flex lg:hidden">
            <Icon name="plus" size={18} />
            Novo
          </ButtonLink>
        }
      />
      {!buscaGlobal && !periodoLivre && (
        <MonthSwitch
          anterior={url({ mes: addMeses(mes, -1), cursor: undefined, sel: undefined })}
          proximo={url({ mes: addMeses(mes, 1), cursor: undefined, sel: undefined })}
          rotulo={rotuloCompetencia(mes)}
        />
      )}
      {!buscaGlobal && (
        <div className="mb-4 space-y-3 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-6 lg:space-y-0">
          <Hero>
            <p className="text-sm text-white/75">
              {tipo === 'dia' ? 'Dia a dia' : tipo === 'viagens' ? 'Viagens' : periodoLivre ? 'Gastos no período' : 'Gastos no mês'}
            </p>
            <AmountDisplay cents={totalGasto} size="xl" tom="onDark" />
            {!tipo && gastoViagens > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-2.5 text-sm">
                <div className="rounded-[18px] bg-white/10 px-3.5 py-3">
                  <p className="text-white/75">Dia a dia</p>
                  <AmountDisplay cents={gastoDia} size="md" tom="onDark" />
                </div>
                <div className="rounded-[18px] bg-white/10 px-3.5 py-3">
                  <p className="text-white/75">Viagens</p>
                  <AmountDisplay cents={gastoViagens} size="md" tom="onDark" />
                </div>
              </div>
            )}
          </Hero>
          <Card>
            <h2 className="mb-3 font-display text-base font-semibold">Para onde foi</h2>
            {porCategoria.length === 0 ? (
              <p className="py-4 text-sm text-muted">Nenhum gasto neste período.</p>
            ) : (
              <>
                <CategoryBreakdown titulo="Gastos por categoria" itens={porCategoria} />
                {categoria && (
                  <Link href={url({ categoria: undefined, cursor: undefined })} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-link">
                    Mostrar todas as categorias
                  </Link>
                )}
              </>
            )}
          </Card>
        </div>
      )}
      <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0" aria-label="Filtrar por tipo e carteira">
        <FilterChip href={url({ tipo: undefined, cursor: undefined })} ativo={!tipo}>Tudo</FilterChip>
        <FilterChip href={url({ tipo: 'dia', cursor: undefined })} ativo={tipo === 'dia'}>Dia a dia</FilterChip>
        <FilterChip href={url({ tipo: 'viagens', cursor: undefined })} ativo={tipo === 'viagens'}>Viagens</FilterChip>
        <span aria-hidden className="mx-1 w-px shrink-0 self-stretch bg-border" />
        {wallets.map((w) => (
          <FilterChip
            key={w.id}
            href={url({ carteira: carteira === w.id ? undefined : w.id, cursor: undefined })}
            ativo={carteira === w.id}
          >
            {w.kind === 'checking' || w.kind === 'cash' ? w.name : ROTULO_CARTEIRA[w.kind]}
          </FilterChip>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-start gap-2">
        <details open={!!q || periodoLivre} className="min-w-0 flex-1 basis-full rounded-xl border border-border bg-surface px-4 lg:basis-auto">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">Buscar e escolher período</summary>
          <form action="/gastos" method="get" className="space-y-2 pb-4">
            <input type="hidden" name="mes" value={mes} />
            {carteira && <input type="hidden" name="carteira" value={carteira} />}
            {categoria && <input type="hidden" name="categoria" value={categoria} />}
            {tipo && <input type="hidden" name="tipo" value={tipo} />}
            {buscaGlobal && <input type="hidden" name="tudo" value="1" />}
            {/* No desktop a busca fica na barra superior (procura em todo o histórico). */}
            <div className="lg:hidden">
              <Input type="search" name="q" defaultValue={q} placeholder="Buscar na descrição" aria-label="Buscar lançamentos" maxLength={80} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" name="de" defaultValue={deP ?? ''} aria-label="De" />
              <Input type="date" name="ate" defaultValue={ateP ?? ''} aria-label="Até" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-fg">Filtrar</button>
              {(q || periodoLivre) && <Link href={`/gastos?mes=${mes}`} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-link">Limpar busca</Link>}
            </div>
          </form>
        </details>
        <ButtonLink href="/gastos/transferir" variant="secondary">Transferir</ButtonLink>
        <ButtonLink href="/gastos/importar" variant="secondary">Importar extrato</ButtonLink>
      </div>
      <PendingQueue carteiras={carteiras} categorias={cats} />
      <div className={sel ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-6' : undefined}>
      <div className="min-w-0">
      {itens.length === 0 ? (
        q ? (
          <EmptyState
            icone="list"
            title={`Nada encontrado para “${q}”`}
            acao={buscaGlobal || periodoLivre ? undefined : { href: url({ tudo: '1', cursor: undefined }), rotulo: 'Buscar em todo o histórico' }}
          >
            {buscaGlobal ? 'A busca olhou todo o histórico.' : 'A busca olhou só este período.'}
          </EmptyState>
        ) : (
          <EmptyState icone="receipt" title="Nenhum lançamento neste período" acao={{ href: '/gastos/novo', rotulo: 'Registrar gasto' }}>
            Os gastos e as entradas do período aparecem aqui.
          </EmptyState>
        )
      ) : (
        <Card className="px-4 py-2 lg:px-6 lg:py-3">
          <TransactionHeader />
          {itens.map((t) => (
            <TransactionRow
              key={t.id}
              compacto={!!sel}
              selecionada={sel?.id === t.id}
              t={{
                id: t.id,
                href: `/gastos/${t.id}`,
                hrefDesktop: url({ sel: t.id, novo: undefined }),
                descricao: t.note ?? cats[t.categoryId ?? '']?.nome ?? 'Lançamento',
                categoria: t.categoryId ? (cats[t.categoryId] ?? null) : null,
                carteira: carteiras[t.walletId] ?? '',
                data: dataCurta(t.occurredOn),
                cents: t.amountCents,
                kind: t.kind,
                viagem: t.tripId ? (nomeViagem.get(t.tripId) ?? 'Viagem') : undefined,
                origem:
                  t.origin === 'recurring'
                    ? 'Fixo'
                    : t.origin === 'installment'
                      ? `Parcela ${t.installmentNumber}`
                      : undefined,
              }}
            />
          ))}
        </Card>
      )}
      </div>
      {sel && (
        <aside aria-label="Detalhe do lançamento" className="mt-4 hidden lg:sticky lg:top-20 lg:mt-0 lg:block">
          <Card className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted">Lançamento selecionado</p>
                <h2 className="mt-1 break-words font-display text-xl font-semibold">
                  {sel.note ?? cats[sel.categoryId ?? '']?.nome ?? 'Lançamento'}
                </h2>
              </div>
              <Link
                href={url({ sel: undefined })}
                scroll={false}
                aria-label="Fechar detalhe"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border"
              >
                <Icon name="close" size={18} />
              </Link>
            </div>
            <AmountDisplay
              cents={sel.kind === 'expense' ? -sel.amountCents : sel.amountCents}
              sinal
              tom={sel.kind === 'expense' ? 'expense' : 'income'}
              size="lg"
            />
            <dl className="grid grid-cols-[96px_1fr] gap-y-3 text-sm">
              <dt className="text-muted">Data</dt>
              <dd>{dataLonga(sel.occurredOn)}</dd>
              <dt className="text-muted">Categoria</dt>
              <dd>{sel.categoryId ? (cats[sel.categoryId]?.nome ?? '—') : 'Sem categoria'}</dd>
              <dt className="text-muted">Carteira</dt>
              <dd>{carteiras[sel.walletId] ?? '—'}</dd>
              {sel.tripId && (
                <>
                  <dt className="text-muted">Viagem</dt>
                  <dd>{nomeViagem.get(sel.tripId) ?? 'Viagem'}</dd>
                </>
              )}
            </dl>
            <div className="grid gap-2">
              <ButtonLink href={`/gastos/${sel.id}`}>
                <Icon name="edit" size={16} />
                Editar lançamento
              </ButtonLink>
              <ExcluirButton id={sel.id} voltarPara={url({ sel: undefined })} />
            </div>
          </Card>
        </aside>
      )}
      </div>
      {temMais && ultimo && (
        <div className="mt-4">
          <ButtonLink
            href={url({ cursor: `${ultimo.occurredOn}_${ultimo.id}` })}
            variant="secondary"
            block
          >
            Carregar mais
          </ButtonLink>
        </div>
      )}
      <div className="mt-6 flex justify-center">
        <ButtonLink href="/gastos/lixeira" variant="secondary">
          <Icon name="trash" size={16} />
          Lixeira
        </ButtonLink>
      </div>
      {novoAberto && (
        <PainelNovo fecharHref={url({ novo: undefined, sel: undefined, cursor: undefined })}>
          <JanelaNovoLancamento
            {...opcoesLancamento({ wallets, categories })}
            viagens={paraLancar.opcoes}
            viagemAtual={paraLancar.atual}
            hoje={hoje}
            fecharHref={url({ novo: undefined, sel: undefined, cursor: undefined })}
          />
        </PainelNovo>
      )}
    </>
  );
}
