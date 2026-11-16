# ADR 011 — Escuro por padrão, um só destaque e cartões-widget

- **Data:** 16/11/2026
- **Situação:** aceita; substitui a direção visual do ADR 010 (opção D, azul-marinho e dourado).

## Contexto

O app é de uso pessoal, aberto quase sempre no celular. A direção anterior (claro, azul-marinho, dourado) ficou boa,
mas as telas eram longas, com formulários abertos e números soltos em texto. A referência escolhida pelo usuário foi
o app Pierre: fundo escuro, um único destaque, informação em cartões pequenos.

## Decisão

1. **Tema escuro é o padrão.** O claro continua como opção em Mais → Ajustes. O tema escolhido vai num cookie para o
   servidor já entregar a página no tema certo (sem piscar). Quem estava em "Sistema" passou para "Escuro".
2. **Um destaque só** (`--accent`, verde-limão `#c5f04a`) para o que é ativo ou positivo: item do menu, botão "+",
   gráficos, links. Vermelho só para despesa e alerta. No claro o destaque não é usado como cor de texto (contraste).
3. **Estrutura das telas:**
   - um número principal em cartão escuro de destaque (`Hero`), com até dois números de apoio;
   - indicadores em cartões-widget (`Widget` + `GradeWidgets`): mini-visualização, valor, uma linha de contexto;
   - listas com ícone (`Linha`, `CategoryIcon`, `IconeRedondo`), valor à direita;
   - formulários recolhidos (`Recolhivel`), que fecham sozinhos ao salvar;
   - troca de mês em pílula (`MonthSwitch`); gasto por categoria como barra segmentada + lista (`CategoryBreakdown`).
4. **Ícone de categoria automático pelo nome** (palavras como "mercado", "uber", "aluguel"); não há escolha manual.
5. **Gráficos:** barras em pílula, anéis (`Ring`), mapa de calor de gastos por dia. A rosca (`Donut`) saiu.
6. **Contas dos indicadores ficam no `core`**, com teste: uso do limite do cartão, maior compra, próximo fixo,
   restante de um parcelamento, próximo recebimento.

## Como é conferido

O CI gera capturas de todas as telas (celular 390 px e desktop 1280 px, escuro e claro) com dados de exemplo gravados
no Supabase local, e roda o teste de acessibilidade também no tema claro. As capturas ficam no ramo `ci-capturas`
e são olhadas antes de a `main` avançar.

## Consequências

- O mobile mudou (ao contrário do trabalho de desktop de 13/11).
- Telas mais curtas e escaneáveis; menos campos visíveis de cara.
- O ícone do app e as telas de abertura foram refeitos na paleta nova (`scripts/gerar-icones.py`).
