import { ButtonLink } from '@/ui/primitives/button';

export const metadata = { title: 'Não encontrado' };

/** 404 dentro do app (ex.: lançamento ou viagem apagados): explica e leva de volta. */
export default function NaoEncontrado() {
  return (
    <div className="mx-auto max-w-sm space-y-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-muted">Este item não existe mais ou o endereço está incorreto.</p>
      <div className="flex flex-col gap-2">
        <ButtonLink href="/" block>
          Voltar ao Início
        </ButtonLink>
        <ButtonLink href="/gastos" variant="secondary" block>
          Ver gastos
        </ButtonLink>
      </div>
    </div>
  );
}
