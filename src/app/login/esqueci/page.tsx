import { EsqueciForm } from './esqueci-form';

export const metadata = { title: 'Esqueci a senha' };

export default function EsqueciPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 p-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Esqueci a senha</h1>
        <p className="mt-1 text-muted">Enviamos um link para você criar uma nova senha.</p>
      </div>
      <EsqueciForm />
    </main>
  );
}
