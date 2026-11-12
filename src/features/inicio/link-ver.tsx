import Link from 'next/link';

export const linkVer = (href: string, texto = 'Ver tudo') => (
  <Link
    href={href}
    className="inline-flex min-h-11 items-center text-sm font-medium text-ink underline decoration-brass decoration-2 underline-offset-[5px]"
  >
    {texto}
  </Link>
);

