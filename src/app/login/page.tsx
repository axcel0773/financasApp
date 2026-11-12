import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 p-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Finanças</h1>
        <p className="mt-1 text-muted">Acesse sua conta</p>
      </div>
      <LoginForm />
    </main>
  );
}
