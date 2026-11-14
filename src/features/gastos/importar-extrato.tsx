'use client';

import { useMemo, useState } from 'react';
import { importarLancamentosAction } from '@/app/_actions/importar';
import { categorizar, lerExtrato, type ResultadoExtrato } from '@/core/import/extrato';
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
const MAX_BYTES = 1_000_000;
const MAX_LINHAS = 300;

/** Lê o CSV no próprio aparelho, mostra a prévia com a categoria sugerida e só então envia. */
export function ImportarExtrato({
  carteiras,
  categorias,
  regras,
}: {
  carteiras: Op[];
  categorias: Op[];
  regras: { keyword: string; categoryId: string }[];
}) {
  const { show } = useToast();
  const { pending, enviar: comTrava } = useEnvio();
  const [texto, setTexto] = useState<string | null>(null);
  const [cartao, setCartao] = useState(false);
  const [walletId, setWalletId] = useState(carteiras[0]?.id ?? '');
  const [excluidas, setExcluidas] = useState<Set<number>>(new Set());
  const [escolhidas, setEscolhidas] = useState<Record<number, string>>({});

  const lido: ResultadoExtrato | null = useMemo(
    () => (texto === null ? null : lerExtrato(texto, { positivoEhGasto: cartao })),
    [texto, cartao],
  );
  const catDe = (linha: number, desc: string) =>
    linha in escolhidas ? escolhidas[linha]! : (categorizar(desc, regras) ?? '');
  const visiveis = lido?.linhas.slice(0, MAX_LINHAS) ?? [];
  const incluidas = visiveis.filter((l) => !excluidas.has(l.linha));

  const aoEscolherArquivo = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_BYTES) return show('Arquivo grande demais (máximo 1 MB).');
    setExcluidas(new Set());
    setEscolhidas({});
    setTexto(await f.text());
  };
  const enviar = () =>
    comTrava(async () => {
      try {
        const r = await importarLancamentosAction({
          walletId,
          itens: incluidas.map((l) => ({ data: l.data, descricao: l.descricao, cents: l.cents, kind: l.kind, categoryId: catDe(l.linha, l.descricao) || null })),
        });
        show(r.message ?? (r.ok ? 'Importado.' : 'Não foi possível importar.'));
        if (r.ok) setTexto(null);
      } catch {
        show('Não foi possível importar. Confira a conexão e tente de novo.');
      }
    });

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
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" checked={cartao} onChange={(e) => setCartao(e.target.checked)} className="h-5 w-5" />
          Fatura de cartão (valores positivos são gastos)
        </label>
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

      {lido && lido.linhas.length > 0 && (
        <>
          <p className="text-sm text-muted">{incluidas.length} de {visiveis.length} linhas selecionadas. Revise as categorias antes de importar.</p>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {visiveis.map((l) => (
              <li key={l.linha} className="flex flex-col gap-2 p-3">
                <label className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 h-5 w-5" checked={!excluidas.has(l.linha)} onChange={(e) => setExcluidas((s) => { const n = new Set(s); if (e.target.checked) n.delete(l.linha); else n.add(l.linha); return n; })} aria-label={`Incluir ${l.descricao}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{l.descricao}</span>
                    <span className="text-xs text-muted">{dataLonga(l.data)}</span>
                  </span>
                  <span className="amount shrink-0 font-semibold">{l.kind === 'expense' ? '−' : '+'} {formatBRL(l.cents)}</span>
                </label>
                <Select aria-label={`Categoria de ${l.descricao}`} value={catDe(l.linha, l.descricao)} onChange={(e) => setEscolhidas((s) => ({ ...s, [l.linha]: e.target.value }))}>
                  <option value="">Sem categoria</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </Select>
              </li>
            ))}
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
