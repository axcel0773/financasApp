import { VerificarForm } from './verificar-form';

export const metadata = { title: 'Verificação em duas etapas' };

export default function VerificarPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 p-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Verificação</h1>
        <p className="mt-1 text-muted">
          Abra o aplicativo autenticador e digite o código de 6 dígitos.
        </p>
      </div>
      <VerificarForm />
    </main>
  );
}
