/** Cores de destaque do app. A primeira é o padrão. As cores reais (por tema) ficam em globals.css. */
export const DESTAQUES = [
  { id: 'lima', nome: 'Lima', cor: '#c5f04a' },
  { id: 'ciano', nome: 'Ciano', cor: '#5ee0d6' },
  { id: 'azul', nome: 'Azul', cor: '#7cc4ff' },
  { id: 'violeta', nome: 'Violeta', cor: '#c4a6ff' },
  { id: 'rosa', nome: 'Rosa', cor: '#ff9ccf' },
  { id: 'laranja', nome: 'Laranja', cor: '#ffb066' },
] as const;

export type Destaque = (typeof DESTAQUES)[number]['id'];
export const IDS_DESTAQUE = DESTAQUES.map((d) => d.id) as [Destaque, ...Destaque[]];
export const ehDestaque = (v: unknown): v is Destaque => typeof v === 'string' && (IDS_DESTAQUE as string[]).includes(v);
