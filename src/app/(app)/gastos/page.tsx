import Link from 'next/link';
import { addMeses, isIsoDate, primeiroDia, ultimoDia } from '@/core/shared/competencia';
import { ROTULO_CARTEIRA } from '@/core/wallets/domain';
import { carregarBase } from '@/features/base';
import { ExcluirButton } from '@/features/gastos/acoes-gasto';
import { NovoLancamentoForm } from '@/features/gastos/novo-lancamento-form';
import { PainelNovo } from '@/features/gastos/painel-novo';
import { PendingQueue } from '@/features/gastos/pending-queue';
import { centavosParaCampo, competenciaDoParam, dataCurta, dataLonga, rotuloCompetencia } from '@/ui/format';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { TransactionHeader, TransactionRow } from '@/ui/patterns/transaction-row';
import { ButtonLink } from '@/ui/primitives/button';
import { Card, PageHeader } from '@/ui/primitives/card';
import { FilterChip } from '@/ui/primitives/chip';
import { Input } from '@/ui/primitives/fields';
import { Icon } from '@/ui/primitives/icon';
import { EmptyState } from '@/ui/primitives/progress';

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
  const inicio = periodoLivre ? deP! : primeiroDia(mes);
  const fim = periodoLivre ? ateP! : ultimoDia(mes);
  const cursor =
    typeof sp.cursor === 'string' && /^\d{4}-\d{2}-\d{2}_[0-9a-f-]{36}$/i.test(sp.cursor)
      ? { occurredOn: sp.cursor.slice(0, 10), id: sp.cursor.slice(11) }
      : undefined;

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
    c.queries.detalhado(inicio, fim),
    c.trips.list(),
    selId ? c.transactions.get(selId) : Promise.resolve(null),
  ]);
  const sel = selecionado && !selecionado.deletedAt ? selecionado : null;
  const nomeViagem = new Map(viagensTodas.map((v) => [v.id, v.name]));
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
    const base = { mes, carteira, categoria, tipo, q: q || undefined, de: periodoLivre ? deP : undefined, ate: periodoLivre ? ateP : undefined, ...extra };
    for (const [k, v] of Object.entries(base)) if (v) params.set(k, v);
    return `/gastos?${params.toString()}`;
  };
  const ultimo = itens[itens.length - 1];

  return (
    <>
      <PageHeader
        title="Gastos"
        subtitle={periodoLivre ? `${dataCurta(inicio)} a ${dataCurta(fim)}` : rotuloCompetencia(mes)}
        action={
          <ButtonLink href="/gastos/novo" className="hidden md:inline-flex lg:hidden">
            <Icon name="plus" size={18} />
            Novo
          </ButtonLink>
        }
      />
      <form action="/gastos" method="get" className="mb-3 space-y-2">
        <input type="hidden" name="mes" value={mes} />
        {carteira && <input type="hidden" name="carteira" value={carteira} />}
        {categoria && <input type="hidden" name="categoria" value={categoria} />}
        {tipo && <input type="hidden" name="tipo" value={tipo} />}
        <Input type="search" name="q" defaultValue={q} placeholder="Buscar na descrição" aria-label="Buscar lançamentos" maxLength={80} />
        <details open={periodoLivre}>
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-link">Período livre</summary>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" name="de" defaultValue={deP ?? ''} aria-label="De" />
            <Input type="date" name="ate" defaultValue={ateP ?? ''} aria-label="Até" />
          </div>
        </details>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-fg">Filtrar</button>
          {(q || periodoLivre) && <Link href={`/gastos?mes=${mes}`} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-link">Limpar busca</Link>}
          <Link href="/gastos/transferir" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-link">Transferir</Link>
          <Link href="/gastos/importar" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-link">Importar extrato</Link>
        </div>
      </form>
      <div className="mb-3 flex items-center justify-between">
        <Link
          href={url({ mes: addMeses(mes, -1), cursor: undefined })}
          aria-label="Mês anterior"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-soft"
        >
          <Icon name="back" />
        </Link>
        <Card className="mx-3 flex-1 border-0 bg-soft py-3 text-center">
          <p className="text-xs text-muted">{tipo === 'dia' ? 'Dia a dia' : tipo === 'viagens' ? 'Viagens' : 'Gastos no mês'}</p>
          <AmountDisplay cents={totalGasto} size="lg" tom="expense" />
          {!tipo && gastoViagens > 0 && (
            <p className="mt-0.5 text-xs text-muted">
              Dia a dia <span className="amount">{centavosParaCampo(gastoDia)}</span> · Viagens <span className="amount">{centavosParaCampo(gastoViagens)}</span>
            </p>
          )}
        </Card>
        <Link
          href={url({ mes: addMeses(mes, 1), cursor: undefined })}
          aria-label="Próximo mês"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-soft"
        >
          <Icon name="chevron" />
        </Link>
      </div>
      <div className="mb-3 flex gap-2" aria-label="Filtrar por tipo de gasto">
        <FilterChip href={url({ tipo: undefined, cursor: undefined })} ativo={!tipo}>Tudo</FilterChip>
        <FilterChip href={url({ tipo: 'dia', cursor: undefined })} ativo={tipo === 'dia'}>Dia a dia</FilterChip>
        <FilterChip href={url({ tipo: 'viagens', cursor: undefined })} ativo={tipo === 'viagens'}>Viagens</FilterChip>
      </div>
      <div
        className="-mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar"
        aria-label="Filtrar por carteira"
      >
        <FilterChip href={url({ carteira: undefined, cursor: undefined })} ativo={!carteira}>
          Todas
        </FilterChip>
        {wallets.map((w) => (
          <FilterChip
            key={w.id}
            href={url({ carteira: w.id, cursor: undefined })}
            ativo={carteira === w.id}
          >
            {ROTULO_CARTEIRA[w.kind]}
            {w.kind === 'checking' || w.kind === 'cash' ? '' : ''}
          </FilterChip>
        ))}
      </div>
      <div
        className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar"
        aria-label="Filtrar por categoria"
      >
        {categories.map((x) => (
          <FilterChip
            key={x.id}
            href={url({ categoria: categoria === x.id ? undefined : x.id, cursor: undefined })}
            ativo={categoria === x.id}
          >
            {x.name}
          </FilterChip>
        ))}
      </div>
      <PendingQueue carteiras={carteiras} categorias={cats} />
      <div className={sel ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-6' : undefined}>
      <div className="min-w-0">
      {itens.length === 0 ? (
        <EmptyState title="Nenhum lançamento neste período">
          Toque em “+” para registrar o primeiro gasto.
        </EmptyState>
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
                href={url({ sel: undefined, cursor: undefined })}
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
              <ExcluirButton id={sel.id} />
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
          <NovoLancamentoForm
            carteiras={wallets.map((w) => ({
              id: w.id,
              nome: w.kind === 'checking' || w.kind === 'cash' ? w.name : `${ROTULO_CARTEIRA[w.kind]} · ${w.name}`,
            }))}
            categorias={categories.map((x) => ({ id: x.id, nome: x.name, cor: x.color }))}
            hoje={hoje}
            carteiraInicial={(wallets.find((w) => w.kind === 'checking') ?? wallets[0])?.id ?? ''}
          />
        </PainelNovo>
      )}
    </>
  );
}
