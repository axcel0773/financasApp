import { AmountDisplay } from '@/ui/patterns/amount-display';
import { Card, Hero } from '@/ui/primitives/card';

/**
 * Esqueleto das calculadoras: campos à esquerda e resultado à direita no desktop;
 * no celular o resultado vem antes, porque é ele que a pessoa quer ver ao mexer nos valores.
 */
export function LayoutCalculadora({
  campos,
  resultado,
  aviso,
}: {
  campos: React.ReactNode;
  resultado: React.ReactNode;
  aviso?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      <Card className="space-y-3">{campos}</Card>
      <div className="order-first space-y-4 lg:order-none" aria-live="polite">
        {resultado}
        {aviso && <p className="text-xs text-muted">{aviso}</p>}
      </div>
    </div>
  );
}

/** Cartão de destaque: um número principal e até dois de apoio. */
export function Destaque({
  rotulo,
  cents,
  texto,
  apoio = [],
  rodape,
}: {
  rotulo: string;
  /** Sem `cents`, mostra `texto` grande no lugar do valor. */
  cents?: number;
  texto?: string;
  apoio?: { rotulo: string; cents?: number; texto?: string }[];
  rodape?: React.ReactNode;
}) {
  return (
    <Hero>
      <p className="text-sm text-white/75">{rotulo}</p>
      {cents !== undefined ? (
        <AmountDisplay cents={cents} size="xl" tom="onDark" />
      ) : (
        <p className="text-[clamp(1.75rem,8vw,2.5rem)] font-semibold leading-tight tracking-tight">{texto}</p>
      )}
      {apoio.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-2.5 text-sm">
          {apoio.slice(0, 2).map((a) => (
            <div key={a.rotulo} className="min-w-0 rounded-[18px] bg-white/10 px-3.5 py-3">
              <p className="truncate text-white/75">{a.rotulo}</p>
              {a.cents !== undefined ? (
                <AmountDisplay cents={a.cents} size="md" tom="onDark" />
              ) : (
                <p className="text-base font-semibold leading-snug">{a.texto}</p>
              )}
            </div>
          ))}
        </div>
      )}
      {rodape && <div className="mt-3 text-sm text-white/75">{rodape}</div>}
    </Hero>
  );
}

/** Linha "rótulo ........ valor" para detalhamentos. */
export function LinhaValor({ rotulo, cents, forte }: { rotulo: string; cents: number; forte?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 border-b border-border py-2 text-sm last:border-0 ${forte ? 'font-semibold' : ''}`}>
      <span className="min-w-0">{rotulo}</span>
      <AmountDisplay cents={cents} size="sm" className={forte ? '' : 'font-normal'} />
    </div>
  );
}

/** Seletor segmentado acessível (botões com aria-pressed). */
export function Segmentos<T extends string>({
  rotulo,
  valor,
  opcoes,
  aoMudar,
}: {
  rotulo: string;
  valor: T;
  opcoes: { valor: T; rotulo: string }[];
  aoMudar: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap gap-2">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={valor === o.valor}
          onClick={() => aoMudar(o.valor)}
          className={
            valor === o.valor
              ? 'inline-flex min-h-11 items-center rounded-full border border-primary bg-primary px-4 text-sm font-semibold text-primary-fg'
              : 'inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm font-semibold'
          }
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

export function SemTabelas() {
  return (
    <Card>
      Esta calculadora usa as tabelas de INSS e IRRF. Cadastre-as em Mais → Tabelas de INSS e IRRF.
    </Card>
  );
}
