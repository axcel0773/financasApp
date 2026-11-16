import { ButtonLink } from '@/ui/primitives/button';
import { Marca } from '@/ui/primitives/marca';

export const metadata = { title: 'Não encontrado' };

/** 404 fora do app (endereço que não existe): mesma linguagem da tela de entrada. */
export default function NaoEncontradoRaiz() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <Marca />
        <h1 className="mt-5 font-display text-3xl font-semibold text-ink">Página não encontrada</h1>
        <p className="mt-1 text-muted">O endereço está incorreto ou a página não existe mais.</p>
      </div>
      <ButtonLink href="/" block>
        Voltar ao Início
      </ButtonLink>
    </main>
  );
}
