import Link from 'next/link';
import { cache } from 'react';
import { getContainer } from '@/composition/container';
import { holeriteDaFonte, totalPrevistoPendente, totalRecebido } from '@/core/income/domain';
import { ocorrenciasPendentes } from '@/core/recurring/domain';
import { comoEstaMes, type ComoEstaMes } from '@/core/reports/mes';
import { competenciaDe, primeiroDia, ultimoDia } from '@/core/shared/competencia';
import { ehBeneficio } from '@/core/wallets/domain';
import { formatBRL } from '@/core/shared/money';
import { cx } from '@/ui/cx';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { IconeRedondo } from '@/ui/patterns/round-icon';

const brl = (c: number) => formatBRL(Math.abs(c));
const pct = (n: number) => `${Math.round(n)}%`;

/** Dados do mês corrente para "Como está o mês" (renda, gastos sem VR/VA, fixos pendentes e meta). */
export const carregarComoEstaMes = cache(async () => {
  const c = await getContainer();
  const hoje = c.clock.hoje(),
    mes = competenciaDe(hoje);
  const [receb, detalhe, regras, ja, ajustes, fontes, tabelas] = await Promise.all([
    c.income.recebimentos(mes, mes),
    c.queries.detalhado(primeiroDia(mes), ultimoDia(mes)),
    c.recurring.regras(),
    c.recurring.chavesGeradas(mes),
    c.settings.get(),
    c.income.fontes(),
    c.income.tabelas(),
  ]);
  const avulsas = detalhe.filter((d) => d.kind === 'income').reduce((s, d) => s + d.cents, 0);
  let rendaCents = totalRecebido(receb) + totalPrevistoPendente(receb) + avulsas;
  // Sem nada recebido nem previsto no mês, usa o líquido estimado do salário cadastrado
  let rendaEstimada = false;
  const fonte = fontes.find((f) => f.kind === 'salary' && f.active);
  if (rendaCents === 0 && fonte && tabelas) {
    rendaCents = holeriteDaFonte(fonte, tabelas).netCents;
    rendaEstimada = true;
  }
  const r = comoEstaMes({
    hoje,
    mes,
    rendaCents,
    gastos: detalhe
      .filter((d) => d.kind === 'expense' && !ehBeneficio(d.walletKind))
      .map((d) => ({ cents: d.cents, comprometido: d.comprometido })),
    fixosPendentesCents: ocorrenciasPendentes(regras, mes, ja).reduce((s, o) => s + o.amountCents, 0),
    metaPct: ajustes.savingsGoalPercent,
  });
  return { r, rendaEstimada };
});

function Linha({
  icone,
  titulo,
  explica,
  valor,
  situacao,
  bom,
  barra,
  rodape,
}: {
  icone: React.ReactNode;
  titulo: string;
  explica: string;
  valor: React.ReactNode;
  situacao: string;
  /** Situação boa (destaque) ou ruim (alerta); undefined = neutra. */
  bom?: boolean;
  barra: React.ReactNode;
  rodape?: React.ReactNode;
}) {
  return (
    <li className="border-b border-border py-4 first:pt-2 last:border-0 last:pb-1">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        {icone}
        <div className="min-w-0">
          <p className="font-semibold">{titulo}</p>
          <p className="text-xs text-muted">{explica}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold leading-tight">{valor}</div>
          <p
            className={cx(
              'whitespace-nowrap text-xs',
              bom === undefined ? 'text-muted' : bom ? 'text-income' : 'text-expense-text',
            )}
          >
            {situacao}
          </p>
        </div>
      </div>
      <div className="mt-3 sm:pl-[52px]">{barra}</div>
      {rodape && <p className="mt-2 text-xs text-muted sm:pl-[52px]">{rodape}</p>}
    </li>
  );
}

function Barra({ partes, marca, rotulo }: { partes: { pct: number; classe: string }[]; marca?: number; rotulo: string }) {
  return (
    <div role="img" aria-label={rotulo} className="relative flex h-2 gap-[3px] rounded-full bg-soft">
      {partes
        .filter((p) => p.pct > 0)
        .map((p, i) => (
          <span
            key={i}
            className={cx('crescer-x h-full rounded-full', p.classe)}
            style={{ width: `${Math.min(100, p.pct)}%` }}
          />
        ))}
      {marca !== undefined && (
        <span
          aria-hidden
          className="absolute -top-[5px] h-[18px] w-0.5 rounded-full bg-ink"
          style={{ left: `${Math.min(100, Math.max(0, marca))}%` }}
        />
      )}
    </div>
  );
}

/** Conteúdo do bloco, separado da carga para poder ser testado e reutilizado. */
export function ComoEstaMesCard({ r, rendaEstimada }: { r: ComoEstaMes; rendaEstimada: boolean }) {
  const semRenda = r.rendaCents === 0;
  const poup = r.poupancaPct;
  const custoPct = r.rendaCents > 0 ? (r.custoDeVidaCents / r.rendaCents) * 100 : null;
  const media = r.mediaDiariaCents;
  const limite = r.limiteDiarioCents;
  return (
    <section className="mt-3 rounded-xl border border-border bg-surface p-5" aria-labelledby="como-mes">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="como-mes" className="flex-1 font-display text-lg font-semibold">
          Como está o mês
        </h2>
        <span className="text-xs text-muted">
          {r.projetado ? `projeção até o dia ${r.diasNoMes}` : 'mês fechado'}
          {rendaEstimada && ' · renda estimada pelo salário'}
        </span>
      </div>
      {semRenda ? (
        <p className="mt-3 text-sm text-muted">
          Sem renda neste mês ainda.{' '}
          <Link href="/renda" className="font-semibold text-link">
            Cadastre o salário
          </Link>{' '}
          para ver poupança, custo de vida e limite por dia.
        </p>
      ) : (
        <ul className="mt-1">
          <Linha
            icone={<IconeRedondo nome="target" tom="destaque" />}
            titulo="Poupança"
            explica={`meta: ${pct(r.metaPct)} da renda`}
            valor={<span className="amount">{poup === null ? '—' : pct(poup)}</span>}
            situacao={
              poup === null ? '' : poup >= r.metaPct ? 'dentro da meta' : poup < 0 ? 'gastando mais que a renda' : 'abaixo da meta'
            }
            bom={poup === null ? undefined : poup >= r.metaPct}
            barra={
              <Barra
                partes={[{ pct: Math.max(0, poup ?? 0), classe: (poup ?? 0) >= r.metaPct ? 'bg-chart' : 'bg-expense' }]}
                marca={r.metaPct}
                rotulo={`Poupança de ${poup === null ? '—' : pct(poup)} da renda; meta de ${pct(r.metaPct)}`}
              />
            }
            rodape={
              <>
                {r.sobraFimCents >= 0 ? 'Deve sobrar ' : 'Deve faltar '}
                <span className="amount whitespace-nowrap">{brl(r.sobraFimCents)}</span> de{' '}
                <span className="amount whitespace-nowrap">{brl(r.rendaCents)}</span> · meta{' '}
                <span className="amount whitespace-nowrap">{brl(r.metaCents)}</span>
              </>
            }
          />
          <Linha
            icone={<IconeRedondo nome="home" tom="viagem" />}
            titulo="Custo de vida"
            explica="fixos + dia a dia"
            valor={<AmountDisplay cents={r.custoDeVidaCents} size="md" className="!text-lg !font-bold" />}
            situacao={custoPct === null ? '' : custoPct > 100 ? `${pct(custoPct)} · acima da renda` : `${pct(custoPct)} da renda`}
            bom={custoPct !== null && custoPct > 100 ? false : undefined}
            barra={
              <Barra
                partes={[
                  { pct: (r.fixosCents / Math.max(r.rendaCents, r.custoDeVidaCents)) * 100, classe: 'bg-trip' },
                  { pct: (r.diaADiaFimCents / Math.max(r.rendaCents, r.custoDeVidaCents)) * 100, classe: 'bg-chart' },
                ]}
                rotulo={`Fixos ${brl(r.fixosCents)} e dia a dia ${brl(r.diaADiaFimCents)} de uma renda de ${brl(r.rendaCents)}`}
              />
            }
            rodape={
              <span className="flex flex-wrap gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-trip" />
                  Fixos <span className="amount whitespace-nowrap">{brl(r.fixosCents)}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-chart" />
                  Dia a dia <span className="amount whitespace-nowrap">{brl(r.diaADiaFimCents)}</span>
                  {r.projetado && ' (projeção)'}
                </span>
              </span>
            }
          />
          <Linha
            icone={<IconeRedondo nome="calendar" />}
            titulo="Gasto por dia"
            explica={`média em ${r.diasDecorridos} de ${r.diasNoMes} dias`}
            valor={<AmountDisplay cents={media} size="md" className="!text-lg !font-bold" />}
            situacao={limite === null ? '' : `limite ${brl(limite)} por dia`}
            bom={limite === null ? undefined : media <= limite}
            barra={
              <Barra
                partes={[{ pct: limite ? (media / limite) * 100 : 0, classe: limite !== null && media > limite ? 'bg-expense' : 'bg-chart' }]}
                rotulo={`Média de ${brl(media)} por dia; limite de ${limite === null ? '—' : brl(limite)}`}
              />
            }
            rodape={
              r.podePorDiaCents === null ? undefined : r.podePorDiaCents > 0 ? (
                <>
                  Dá para gastar até <span className="amount whitespace-nowrap">{brl(r.podePorDiaCents)}</span> por dia nos{' '}
                  {r.diasRestantes} {r.diasRestantes === 1 ? 'dia que falta' : 'dias que faltam'}
                </>
              ) : (
                'O dia a dia já passou do que cabe na meta deste mês'
              )
            }
          />
        </ul>
      )}
      <p className="mt-3 text-right">
        <Link href="/mais#meta-poupanca" className="text-sm font-semibold text-link">
          Ajustar meta de poupança
        </Link>
      </p>
    </section>
  );
}

export async function BlocoComoEstaMes() {
  const { r, rendaEstimada } = await carregarComoEstaMes();
  return <ComoEstaMesCard r={r} rendaEstimada={rendaEstimada} />;
}
