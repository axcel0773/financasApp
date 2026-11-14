/**
 * Navegação programática com garantia.
 *
 * No Next 15 + React 19 um `router.push` às vezes não é aplicado: a resposta chega (200) e a tela não muda
 * (medido no E2E: acontece de forma intermitente, sobretudo logo depois de salvar algo). Se em 2,5 s o
 * endereço não tiver mudado, a ida é forçada pelo navegador. Tirar quando o Next/React corrigirem.
 */
export function navegarComGarantia(
  router: { push: (href: string, opcoes?: { scroll?: boolean }) => void },
  href: string,
  opcoes?: { scroll?: boolean },
): void {
  const origem = window.location.pathname + window.location.search;
  router.push(href, opcoes);
  if (href === origem) return; // mesmo endereço: nada a conferir
  setTimeout(() => {
    if (window.location.pathname + window.location.search === origem) window.location.assign(href);
  }, 2500);
}
