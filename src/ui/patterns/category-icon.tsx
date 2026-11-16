import { cx } from '../cx';
import { Icon, type IconName } from '../primitives/icon';

/** Palavras do nome da categoria → ícone. A ordem importa: a primeira que casar vence. */
const REGRAS: [RegExp, IconName][] = [
  [/morad|alugu|casa|condom|luz|energia|agua|internet/, 'home'],
  [/mercad|super|feira|padar|acougue/, 'cart'],
  [/restaur|aliment|comida|lanche|delivery|ifood|bar\b|cafe/, 'fork'],
  [/transp|uber|taxi|combust|gasolin|carro|moto|onibus|metro|estacion/, 'car'],
  [/saude|farm|medic|plano|dentist|academ/, 'heart'],
  [/lazer|divers|cinema|jogo|show|passei/, 'star'],
  [/assinat|stream|mensalid/, 'repeat'],
  [/educa|curso|livro|escola|faculd/, 'book'],
  [/compra|roupa|shopping|presente|vestu/, 'bag'],
  [/viag|passag|hosped/, 'plane'],
  [/invest|reserva|poupan/, 'trend'],
  [/salari|renda|receb/, 'wallet'],
];
const semAcento = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function iconeDaCategoria(nome: string | null | undefined): IconName {
  if (!nome) return 'tag';
  const n = semAcento(nome);
  return REGRAS.find(([re]) => re.test(n))?.[1] ?? 'tag';
}

/** Cor da categoria ajustada ao tema: misturada com a tinta para aparecer no escuro e no claro. */
export const tomDaCategoria = (cor: string | null | undefined) =>
  `color-mix(in srgb, ${cor ?? 'var(--muted)'} 55%, var(--ink))`;

/**
 * Ícone da categoria num quadrado arredondado, tingido com a cor dela.
 * A cor é misturada com a tinta do tema para ter contraste no escuro e no claro; o nome vem sempre ao lado.
 */
export function CategoryIcon({
  nome,
  cor,
  className,
}: {
  nome: string | null | undefined;
  cor?: string | null;
  className?: string;
}) {
  const base = cor ?? 'var(--muted)';
  return (
    <span
      aria-hidden
      className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]', className)}
      style={{
        background: `color-mix(in srgb, ${base} 22%, var(--soft))`,
        color: `color-mix(in srgb, ${base} 45%, var(--ink))`,
      }}
    >
      <Icon name={iconeDaCategoria(nome)} size={18} />
    </span>
  );
}
