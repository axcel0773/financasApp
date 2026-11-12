# ADR 007 — Idioma dos nomes

Status: aceita (12/11/2026)

## Contexto

O código mistura português e inglês. Sem regra, cada arquivo escolhe um lado.

## Decisão

- **Português:** linguagem do domínio e da tela — tipos, funções e textos em `core/` e `features/` (`Viagem`, `resumirViagem`, `BlocoGastosMes`), rótulos, mensagens e rotas.
- **Inglês:** o que é técnico — tabelas e colunas do banco (`trips.start_on`), pastas e portas de infraestrutura (`TripRepository`), nomes de pastas de módulos em `core/` (`trips`, `wallets`), utilitários genéricos.
- Na fronteira (repositórios), o mapeamento converte colunas em inglês para o tipo de domínio em português (`toDomain`).

## Consequências

Código novo segue esta regra; não vale renomear em massa o que já existe só por coerência.
