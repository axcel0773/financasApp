# ADR 001 — Clean Architecture em camadas

Status: aceita

## Contexto

App de uso pessoal que precisa de regras financeiras testáveis e troca fácil de infraestrutura.

## Decisão

core/ (domínio e casos de uso) puro; infra/ implementa as portas; app/ e ui/ só orquestram. Imports validados por dependency-cruiser e ESLint.

## Consequências

Mais arquivos, porém regras testadas sem banco nem React.
