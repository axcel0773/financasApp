'use client';

import { usePathname } from 'next/navigation';

/** O template remonta a cada navegação: o conteúdo entra com fade + deslize. "Novo lançamento" sobe como uma folha. */
export default function Template({ children }: { children: React.ReactNode }) {
  const rota = usePathname();
  return (
    <div key={rota} className={rota === '/gastos/novo' ? 'page-up' : 'page-in'}>
      {children}
    </div>
  );
}
