import { RedefinirForm } from './redefinir-form';

export const metadata = { title: 'Nova senha' };

export default function RedefinirPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 p-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Nova senha</h1>
        <p className="mt-1 text-muted">Escolha uma senha nova para entrar.</p>
      </div>
      <RedefinirForm />
    </main>
  );
}
