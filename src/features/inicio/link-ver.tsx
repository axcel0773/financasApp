import Link from 'next/link';

export const linkVer = (href: string, texto = 'Ver tudo') => (
  <Link
    href={href}
    className="inline-flex min-h-11 items-center text-sm font-medium text-link"
  >
    {texto}
  </Link>
);

