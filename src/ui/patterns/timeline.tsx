/** Lista agrupada por dia: o dia vira cabeçalho, com um valor opcional à direita (ex.: saldo no fim do dia). */
export function LinhaDoTempo({
  grupos,
}: {
  grupos: { chave: string; titulo: React.ReactNode; direita?: React.ReactNode; itens: React.ReactNode }[];
}) {
  return (
    <ol className="space-y-3">
      {grupos.map((g) => (
        <li key={g.chave} className="rounded-xl border border-border bg-surface">
          <div className="flex min-h-11 items-center justify-between gap-3 border-b border-border px-4 text-sm">
            <span className="font-semibold first-letter:uppercase">{g.titulo}</span>
            {g.direita && <span className="text-xs text-muted">{g.direita}</span>}
          </div>
          <div className="px-4 py-1">{g.itens}</div>
        </li>
      ))}
    </ol>
  );
}
