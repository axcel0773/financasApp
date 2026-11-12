# ADR 010 — Direção visual "Extrato aberto"

Status: aceita (12/11/2026)

## Contexto

O dono queria um app sério como um banco, mas moderno e fluido. Foram comparadas quatro direções (A Extrato, B Aberto, C Painel, D = A + B); a D foi escolhida.

## Decisão

Fundo branco, azul-marinho (`--primary`) como cor de ação, azul de link, verde para entradas, vermelho para saídas, azul próprio para viagens, dourado só como detalhe (sublinhado de ação, aro do botão "+"). Fonte Onest. Cantos arredondados, botões e filtros em pílula, barra inferior flutuante, saldo em bloco escuro arredondado, listas separadas por linhas finas em vez de cartões. Modo escuro na mesma paleta (azul-noite).

## Consequências

Cores só por tokens (`bg-primary`, `text-link`, `text-income`, `bg-trip`…), nunca hexadecimal solto em telas novas. Ícone e splash do iOS seguem a paleta.
