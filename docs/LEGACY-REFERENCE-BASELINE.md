---
tags: [nutridev-legacy, zelus-food-solution, provenance, repository-governance]
artifact_kind: governance
layer: project
status: proposed
version: 0.1.0
created_at: 2026-08-15
updated_at: 2026-08-15
---

# Baseline de referência do legado Nutridev

## Objetivo

Preservar o Nutridev como evidência histórica consultável pelo Zelus Food Solution sem transformar código, schema, documentação antiga ou ferramentas de desenvolvimento em autoridade automática ou dependência do novo produto.

Este documento operacionaliza as decisões PD-001, PD-024, PD-025, PD-030, PD-039, PD-040 e PD-042 de `PROJECT-DECISIONS.md`.

## Estado do congelamento

| Campo | Valor atual |
|---|---|
| Repositório legado | `Zezolas2798/stackblitz-starters-lvhktmos` |
| Branch de trabalho observada | `v2-arquitetura-limpa` |
| HEAD anterior ao congelamento | `d7d680748f061b29f7a6d724a3e09ce50836ae98` |
| Commit definitivo da baseline | pendente |
| Tag definitiva da baseline | pendente; sugestão: `nutridev-legacy-baseline-2026-08-15` |
| Repositório sucessor | `Zezolas2798/zelus-food-solution` |

O HEAD acima não representa sozinho a baseline definitiva: há documentos de discovery e decisão ainda não versionados e uma reorganização local ampla que não deve ser registrada indiscriminadamente.

## Classes de artefato

### 1. Autoridade semântica candidata à promoção

Estes documentos registram a baseline aprovada. Devem ser preservados no legado e revisados antes de serem adaptados ao Zelus:

- `docs/PROJECT-OVERVIEW.md`
- `docs/PROJECT-DECISIONS.md`
- `docs/INITIAL-DEFINITIONS.md`
- `docs/HYPOTHESES.md`
- `docs/EXPERIMENT-CANDIDATES.md`
- `docs/discovery/01-analise-transcricao-entrevista.md`
- `docs/discovery/02-tipos-de-negocio.md`
- `docs/discovery/02.1-servico-comercial.md`
- `docs/discovery/02.2-cozinha-institucional.md`
- `docs/discovery/02.3-catering-eventos.md`
- `docs/discovery/02.4-industria-fabricacao.md`
- `docs/discovery/02.5-perfis-hibridos.md`
- `docs/discovery/03-founder-evidence-intake-ex1-ex6-ex9.md`
- `docs/discovery/04-pre-specification-decisions-action-validation-acknowledgement.md`

### 2. Pesquisa preservada, com promoção condicionada

- `docs/discovery/05-offline-resilience-research/`: preservada como pesquisa adiada; não impõe requisito offline à primeira fatia.
- Demais arquivos de pesquisa em `docs/discovery/`: fontes de apoio que exigem revisão de proveniência e aplicabilidade.
- `docs/incamp-2025-v0/`: evidência histórica do processo de candidatura e pesquisa; não é especificação do Zelus.
- `sessions/`: handoffs e contexto de decisão; não substituem o registro de decisões.

### 3. Evidência brownfield, sem autoridade normativa

- Árvore de aplicação, componentes, bibliotecas, testes, scripts e configuração existente no histórico Git.
- Conteúdo reorganizado localmente em `_legacy/`.
- Documentação anterior de funcionalidades, arquitetura e governança.
- Schema, migrations, funções e tipos antigos do Supabase.

Esses artefatos podem responder perguntas como “o que já foi tentado?” ou “qual fluxo existia?”, mas não respondem sozinhos “como o Zelus deve funcionar?”.

### 4. Fontes que exigem revisão antes de qualquer promoção

- legislação e cópias de fontes regulatórias;
- atas, transcrições e documentos de terceiros;
- imagens, marcas e outros ativos com direitos possivelmente externos;
- dados, exemplos ou backups que possam conter informações pessoais, operacionais ou de clientes.

### 5. Fora da baseline e proibidos no commit de congelamento

- `.env*`, credenciais, tokens, chaves e secrets;
- `node_modules/`, `.next/`, caches, logs e artefatos gerados;
- backups de banco e dumps com dados;
- diretórios temporários do Supabase, especialmente `_legacy/supabase/.temp/` e `_legacy/supabase/.branches/`;
- `Arcanum/`, `domainspec/`, `domainspec_backup/` e `cyberalchemy-orchestrator-master/`;
- debris de desenvolvimento, testes ad hoc e arquivos `test_mammoth*`;
- qualquer mudança fora da lista explícita revisada para o commit.

## Regra de consulta no Zelus

O legado deve ser consultado pelo repositório e por uma referência Git imutável. Um clone local lado a lado é permitido para leitura, mas não deve virar submódulo, pacote, diretório versionado ou dependência de runtime do Zelus.

Toda conclusão derivada do legado deve distinguir:

1. fato observado no artefato antigo;
2. interpretação ou aprendizado extraído;
3. decisão atual do Zelus que aceita, altera ou rejeita esse aprendizado.

## Registro mínimo de promoção

Cada artefato adaptado ao Zelus deve registrar, no próprio documento ou em um catálogo de proveniência:

```yaml
legacy_source:
  repository: Zezolas2798/stackblitz-starters-lvhktmos
  ref: <commit-ou-tag-imutavel>
  path: <caminho-original>
  disposition: adapted | referenced | rejected
  reviewed_at: <AAAA-MM-DD>
  decision_refs: [<PD-ou-ADR>]
```

`adapted` significa que o conteúdo foi revisto e alterado para a autoridade atual. `referenced` significa que serviu apenas como evidência. `rejected` preserva a decisão de não herdar determinada solução ou premissa.

## Conjunto proposto para o primeiro commit de congelamento

O primeiro commit deve nomear explicitamente apenas:

- os cinco documentos centrais em `docs/`;
- os documentos de `docs/discovery/` após inspeção de proveniência e secrets;
- `docs/incamp-2025-v0/` como evidência histórica, se aprovado na revisão;
- a ata em `Reuniões/` que serve como fonte primária da discovery, preservada como material restrito;
- os dois handoffs em `sessions/`;
- este manifesto.

Não se deve usar `git add .`, `git add -A` nem registrar as remoções e movimentações locais nesse commit.

## Gates para declarar a baseline congelada

- [ ] Revisar a lista exata de arquivos do commit.
- [ ] Verificar secrets, dados pessoais e materiais de terceiros.
- [ ] Inspecionar o diff staged e confirmar que não há código, schema, ferramentas ou remoções.
- [ ] Criar commit documental com caminhos explícitos.
- [ ] Criar uma tag anotada apontando para esse commit.
- [ ] Enviar commit e tag ao repositório remoto.
- [ ] Registrar o commit/tag definitivo neste documento e no catálogo de fontes do Zelus.
