import Link from 'next/link';
import { LoginForm } from './login-form';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 p-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Finanças</h1>
        <p className="mt-1 text-muted">Acesse sua conta</p>
      </div>
      {erro === 'link' && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-expense-text">
          O link expirou ou já foi usado. Peça um novo em &quot;Esqueci a senha&quot;.
        </p>
      )}
      <LoginForm />
      <Link href="/login/esqueci" className="-mt-4 block min-h-12 py-3 text-center text-sm font-medium text-link underline">
        Esqueci a senha
      </Link>
    </main>
  );
}
