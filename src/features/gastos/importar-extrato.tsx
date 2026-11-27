'use client';

import { useId, useMemo, useState } from 'react';
import { importarLancamentosAction } from '@/app/_actions/importar';
import {
  dentroDaViagem,
  ehPagamentoDaFatura,
  marcarJaLancados,
  pareceFaturaDeCartao,
  sugerirRegras,
  type FixoAtivo,
  type LancamentoExistente,
} from '@/core/import/conferencia';
import { categorizar, lerExtrato, type LinhaExtrato, type ResultadoExtrato } from '@/core/import/extrato';
import { formatBRL } from '@/core/shared/money';
import { dataLonga } from '@/ui/format';
import { Button } from '@/ui/primitives/button';
import { Card } from '@/ui/primitives/card';
import { Field, Select } from '@/ui/primitives/fields';
import { useToast } from '@/ui/primitives/toast';
import { useEnvio } from '@/features/shared/use-envio';

interface Op {
  id: string;
  nome: string;
}
interface Carteira extends Op {
  cartao: boolean;
}
interface ViagemOp extends Op {
  startOn: string;
  endOn: string | null;
}
const MAX_BYTES = 1_000_000;
const MAX_LINHAS = 300;

/** Por que a linha começa desmarcada (nulo = entra na importação). */
type Motivo = { tipo: 'pagamento' } | { tipo: 'repetido'; com: string } | null;

/** Lê o CSV no próprio aparelho, mostra a prévia conferida e só então envia. */
export function ImportarExtrato({
  carteiras,
  categorias,
  regras,
  viagens,
  viagemAtual,
  existentes,
  fixos,
}: {
  carteiras: Carteira[];
  categorias: Op[];
  regras: { keyword: string; categoryId: string }[];
  viagens: ViagemOp[];
  viagemAtual: string | null;
  existentes: LancamentoExistente[];
  fixos: FixoAtivo[];
}) {
  const ids = useId();
  const { show } = useToast();
  const { pending, enviar: comTrava } = useEnvio();
  const [texto, setTexto] = useState<string | null>(null);
  const [cartao, setCartao] = useState(false);
  const [walletId, setWalletId] = useState(carteiras[0]?.id ?? '');
  const [tripId, setTripId] = useState(viagemAtual ?? '');
  /** Escolhas feitas à mão, por linha: valem mais que o padrão calculado. */
  const [incluir, setIncluir] = useState<Record<number, boolean>>({});
  const [naViagem, setNaViagem] = useState<Record<number, boolean>>({});
  const [escolhidas, setEscolhidas] = useState<Record<number, string>>({});
  const [recusadas, setRecusadas] = useState<Set<string>>(new Set());

  const lido: ResultadoExtrato | null = useMemo(
    () => (texto === null ? null : lerExtrato(texto, { positivoEhGasto: cartao })),
    [texto, cartao],
  );
  const visiveis = useMemo(() => lido?.linhas.slice(0, MAX_LINHAS) ?? [], [lido]);
  const viagem = viagens.find((v) => v.id === tripId) ?? null;

  const repetidos = useMemo(() => marcarJaLancados(visiveis, existentes, fixos), [visiveis, existentes, fixos]);
  const motivoDe = (l: LinhaExtrato): Motivo =>
    cartao && ehPagamentoDaFatura(l.descricao)
      ? { tipo: 'pagamento' }
      : repetidos.has(l.linha)
        ? { tipo: 'repetido', com: repetidos.get(l.linha)! }
        : null;

  const sugestoes = useMemo(
    () => sugerirRegras(visiveis.filter((l) => l.kind === 'expense').map((l) => l.descricao), regras, categorias),
    [visiveis, regras, categorias],
  );
  const aceitas = useMemo(() => sugestoes.filter((s) => !recusadas.has(s.keyword)), [sugestoes, recusadas]);
  const regrasEmUso = useMemo(
    () => [...regras, ...aceitas.map((s) => ({ keyword: s.keyword, categoryId: s.categoryId }))],
    [regras, aceitas],
  );

  const incluida = (l: LinhaExtrato) => incluir[l.linha] ?? motivoDe(l) === null;
  const catDe = (l: LinhaExtrato) => escolhidas[l.linha] ?? categorizar(l.descricao, regrasEmUso) ?? '';
  const viagemDe = (l: LinhaExtrato): string | null =>
    viagem && l.kind === 'expense' && (naViagem[l.linha] ?? dentroDaViagem(l.data, viagem)) ? viagem.id : null;
  const incluidas = visiveis.filter(incluida);
  const totalGasto = incluidas.filter((l) => l.kind === 'expense').reduce((s, l) => s + l.cents, 0);
  const nRepetidos = visiveis.filter((l) => motivoDe(l)?.tipo === 'repetido').length;

  const aoEscolherArquivo = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_BYTES) return show('Arquivo grande demais (máximo 1 MB).');
    const t = await f.text();
    setIncluir({});
    setNaViagem({});
    setEscolhidas({});
    setRecusadas(new Set());
    if (pareceFaturaDeCartao(t)) {
      setCartao(true);
      const doCartao = carteiras.find((w) => w.cartao && /nu/i.test(w.nome)) ?? carteiras.find((w) => w.cartao);
      if (doCartao) setWalletId(doCartao.id);
    }
    setTexto(t);
  };
  const enviar = () =>
    comTrava(async () => {
      try {
        const r = await importarLancamentosAction({
          walletId,
          itens: incluidas.map((l) => ({
            data: l.data,
            descricao: l.descricao,
            cents: l.cents,
            kind: l.kind,
            categoryId: catDe(l) || null,
            tripId: viagemDe(l),
          })),
          regras: aceitas.map((s) => ({ keyword: s.keyword, categoryId: s.categoryId })),
        });
        show(r.message ?? (r.ok ? 'Importado.' : 'Não foi possível importar.'));
        if (r.ok) setTexto(null);
      } catch {
        show('Não foi possível importar. Confira a conexão e tente de novo.');
      }
    });

  const idCartao = `${ids}-cartao`;
  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <Field label="Arquivo CSV do extrato ou da fatura" hint="Colunas: data, descrição e valor. Nada sai do aparelho antes de você confirmar.">
          <input type="file" accept=".csv,.txt,text/csv" onChange={(e) => void aoEscolherArquivo(e.target.files?.[0])} className="min-h-12 w-full rounded-md border border-border bg-surface p-3" />
        </Field>
        <Field label="Importar para a carteira">
          <Select value={walletId} onChange={(e) => setWalletId(e.target.value)}>
            {carteiras.map((w) => (
              <option key={w.id} value={w.id}>{w.nome}</option>
            ))}
          </Select>
        </Field>
        <div className="flex min-h-11 items-center gap-3 text-sm">
          <input id={idCartao} type="checkbox" checked={cartao} onChange={(e) => setCartao(e.target.checked)} className="h-5 w-5" />
          <label htmlFor={idCartao}>Fatura de cartão (valores positivos são gastos)</label>
        </div>
        {viagens.length > 0 && (
          <Field
            label="Viagem"
            hint={viagem ? `Os gastos de ${dataLonga(viagem.startOn)}${viagem.endOn ? ` a ${dataLonga(viagem.endOn)}` : ' em diante'} entram na viagem. Dá para tirar linha por linha.` : 'Nenhum gasto do arquivo vai para uma viagem.'}
          >
            <Select value={tripId} onChange={(e) => { setTripId(e.target.value); setNaViagem({}); }}>
              <option value="">Nenhuma</option>
              {viagens.map((v) => (
                <option key={v.id} value={v.id}>{v.nome}</option>
              ))}
            </Select>
          </Field>
        )}
      </Card>

      {lido && lido.erros.length > 0 && (
        <Card role="status" className="text-sm">
          <p className="font-semibold text-expense-text">{lido.erros.length} linha(s) ignorada(s)</p>
          <ul className="mt-1 list-disc pl-5 text-muted">
            {lido.erros.slice(0, 5).map((e) => (
              <li key={e.linha}>Linha {e.linha}: {e.motivo}</li>
            ))}
          </ul>
        </Card>
      )}

      {sugestoes.length > 0 && (
        <Card className="space-y-2">
          <h2 className="font-semibold">Regras de categoria sugeridas</h2>
          <p className="text-sm text-muted">As marcadas já categorizam a prévia e ficam salvas ao importar, para as próximas faturas.</p>
          <ul className="space-y-1">
            {sugestoes.map((s) => {
              const id = `${ids}-regra-${s.keyword}`;
              return (
                <li key={s.keyword} className="flex min-h-11 items-center gap-3 text-sm">
                  <input
                    id={id}
                    type="checkbox"
                    className="h-5 w-5"
                    checked={!recusadas.has(s.keyword)}
                    onChange={(e) => setRecusadas((r) => { const n = new Set(r); if (e.target.checked) n.delete(s.keyword); else n.add(s.keyword); return n; })}
                  />
                  <label htmlFor={id} className="min-w-0 flex-1">
                    Contém <strong>“{s.keyword}”</strong> → {s.categoria}
                    <span className="text-muted"> · {s.linhas} linha(s)</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {lido && lido.linhas.length > 0 && (
        <>
          <p role="status" className="text-sm text-muted">
            {incluidas.length} de {visiveis.length} linhas selecionadas ({formatBRL(totalGasto)} em gastos).
            {nRepetidos > 0 && ` ${nRepetidos} já lançada(s) ficaram de fora.`} Revise antes de importar.
          </p>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {visiveis.map((l) => {
              const motivo = motivoDe(l);
              const dentro = viagemDe(l) !== null;
              const idViagem = `${ids}-viagem-${l.linha}`;
              return (
                <li key={l.linha} className={`flex flex-col gap-2 p-3 ${incluida(l) ? '' : 'opacity-70'}`}>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1 h-5 w-5" checked={incluida(l)} onChange={(e) => setIncluir((s) => ({ ...s, [l.linha]: e.target.checked }))} aria-label={`Incluir ${l.descricao}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{l.descricao}</span>
                      <span className="text-xs text-muted">{dataLonga(l.data)}</span>
                      {motivo && (
                        <span className="mt-1 block text-xs font-medium text-expense-text">
                          {motivo.tipo === 'pagamento' ? 'Pagamento da fatura anterior: não é receita' : `Já lançado: ${motivo.com}`}
                        </span>
                      )}
                    </span>
                    <span className="amount shrink-0 font-semibold">{l.kind === 'expense' ? '−' : '+'} {formatBRL(l.cents)}</span>
                  </label>
                  {incluida(l) && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <Select className="min-w-0 flex-1" aria-label={`Categoria de ${l.descricao}`} value={catDe(l)} onChange={(e) => setEscolhidas((s) => ({ ...s, [l.linha]: e.target.value }))}>
                        <option value="">Sem categoria</option>
                        {categorias.map((c) => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </Select>
                      {viagem && l.kind === 'expense' && (
                        <span className="flex min-h-11 items-center gap-2 text-sm">
                          <input id={idViagem} type="checkbox" className="h-5 w-5" checked={dentro} onChange={(e) => setNaViagem((s) => ({ ...s, [l.linha]: e.target.checked }))} />
                          <label htmlFor={idViagem}>Na viagem<span className="sr-only"> {viagem.nome}: {l.descricao}</span></label>
                        </span>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {lido.linhas.length > MAX_LINHAS && (
            <p role="status" className="text-xs text-muted">
              O arquivo tem {lido.linhas.length} linhas. Só as {MAX_LINHAS} primeiras serão importadas agora; importe de novo para o restante (as já importadas são ignoradas).
            </p>
          )}
          <Button block disabled={pending || incluidas.length === 0 || !walletId} onClick={() => void enviar()}>
            {pending ? 'Importando…' : `Importar ${incluidas.length} lançamento(s)`}
          </Button>
        </>
      )}
    </div>
  );
}
