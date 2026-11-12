# ADR 002 — Dinheiro em centavos inteiros

Status: aceita

## Contexto

Ponto flutuante gera erros de arredondamento.

## Decisão

Todo valor é inteiro em centavos (bigint no banco). Parcelas dão o resto à primeira.

## Consequências

Conversões só nas bordas (formatação e entrada).
