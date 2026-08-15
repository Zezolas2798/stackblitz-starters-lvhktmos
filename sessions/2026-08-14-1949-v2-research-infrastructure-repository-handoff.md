---
tags: [nutridev-v2, zelus-food-solution, repository-bootstrap, technical-decisions, session-handoff]
artifact_kind: session
layer: project
version: 0.1.0
created_at: 2026-08-14T19:49:43-03:00
updated_at: 2026-08-15T10:13:51-03:00
expires: 2026-10-13
decisions_made: true
contradictions_found: true
specs_updated:
  - docs/PROJECT-DECISIONS.md
promoted_candidates:
  - docs/PROJECT-OVERVIEW.md
  - docs/INITIAL-DEFINITIONS.md
  - docs/PROJECT-DECISIONS.md
  - docs/HYPOTHESES.md
  - docs/EXPERIMENT-CANDIDATES.md
  - docs/discovery/
expected_importance: 9
importance_rationale: "Fecha a pesquisa de resiliência, resolve o destino do repositório da V2 e preserva a sequência de decisões técnicas para o bootstrap do Zelus Food Solution."
---

# Fechamento da pesquisa, infraestrutura e destino do repositório da V2

## Summary

A pesquisa governada de resiliência offline foi concluída e mostrou que captura, efeito e autoridade precisam ser separados, mas suas decisões arquiteturais e probes não são necessários para a primeira fatia. O titular decidiu iniciar online, avaliar offline ou servidor local futuramente conforme módulos, necessidade operacional e custo, criar a V2 em um repositório GitHub privado e independente e usar Zelus Food Solution como nome público inicial do produto. GitHub CLI/MCP e Supabase CLI/MCP foram configurados e verificados; o token Supabase que apareceu na conversa foi revogado. A próxima sessão pode criar o repositório e conduzir as decisões técnicas sem reabrir o escopo de produto já aprovado.

## Decisions closed

- Nome público inicial do produto: `Zelus Food Solution`; `Nutridev` permanece como identificador do projeto legado e de sua evidência histórica.
- Repositório: `Zezolas2798/zelus-food-solution`.
- Visibilidade: privada.
- Titular e único acesso inicial: `Zezolas2798` / José Augusto Leite Teixeira.
- Branch padrão: `main`.
- Regras iniciais: sem proteção ou governança adicional além do padrão; endurecer quando houver equipe ou CI relevante.
- O repositório atual permanece como legado e evidência, sem migração automática de código ou schema.
- Arcanum, DomainSpec e CyberAlchemy Orchestrator são ferramentas externas de desenvolvimento; não entram como componentes, submódulos ou dependências de runtime do produto.
- A primeira fatia não terá requisito offline. PWA offline, cliente híbrido/nativo, edge e servidor local permanecem alternativas futuras e condicionais.
- Audit/CAPA continua como primeira fatia vertical; Document Control continua como fatia seguinte.
- Next.js/TypeScript e Supabase continuam candidatos plausíveis, não decisões técnicas ratificadas.

## Research disposition

- O dispatch `2026-08-14-nutridev-offline-resilience-architecture` foi executado e produziu `research.md` e `findings.md`.
- O resultado foi `REVISE / decision-not-ready` para uma arquitetura offline final.
- Permanecem válidos como constraints futuros: modos de falha separados; captura, efeito e autoridade independentes; IDs estáveis; recibos; deduplicação; reservas tipadas; fallback manual para falta total de energia.
- Os três probes, targets de continuidade, escolha PWA versus nativo, edge e TCO foram adiados conscientemente. Não bloqueiam a primeira fatia online.

## Infrastructure checkpoint

- GitHub CLI autenticado como `Zezolas2798`.
- GitHub MCP configurado por wrapper local e imagem oficial; depende do Docker Desktop em execução.
- Supabase CLI autenticado no perfil `codex-zelus`.
- Supabase MCP autenticado por OAuth e inicialmente limitado a `docs,account` até existir um projeto de desenvolvimento específico.
- Uma nova sessão do Codex deve recarregar os MCPs.
- Nenhuma credencial deve ser copiada para o novo repositório. O token exposto anteriormente foi revogado pelo titular.
- O repositório GitHub e o projeto Supabase específicos do Zelus ainda não foram criados.

## Decision completeness

Não falta decisão bloqueadora para criar o repositório privado vazio. Permanecem decisões técnicas deliberadamente abertas, que devem ser tomadas antes do scaffold executável ou durante seu desenho:

1. Definir arquitetura de aplicação e fronteira entre Next.js, APIs, jobs e eventuais serviços.
2. Ratificar Supabase/Postgres e decidir organização, projeto, região, ambientes e plano de custo.
3. Definir o modelo multi-tenant: organização, consultoria, empresa, unidade, vínculo, escopo e isolamento.
4. Definir autenticação, autorização, entitlement por módulo, RLS e trilha de auditoria.
5. Definir modelagem inicial e estratégia de migrations, seeds, tipos e dados de teste.
6. Definir runtime, versões, gerenciador de pacotes e estrutura do repositório.
7. Definir hospedagem, CI/CD, ambientes, secrets, observabilidade, backups e recuperação.
8. Definir estratégia de testes e comandos mínimos de verificação.
9. Delimitar tecnicamente a primeira fatia Audit/CAPA sem antecipar os módulos posteriores.

Os detalhes de assinatura eletrônica, prazos, matriz exata de validação, retenção/exportação, manifestação para correção e ownership de remediação multiorigem continuam adiados para suas respectivas especificações; não bloqueiam a criação do repositório.

## Document promotion recommendation

Promover por revisão, sem copiar o legado inteiro:

- núcleo inicial: `PROJECT-OVERVIEW.md`, `PROJECT-DECISIONS.md`, `INITIAL-DEFINITIONS.md`, `HYPOTHESES.md` e `EXPERIMENT-CANDIDATES.md`;
- discovery aprovada: documentos `01` a `04` e os perfis de negócio relacionados;
- pesquisa offline: manter como referência adiada, preferencialmente em uma área de pesquisa/decisões futuras;
- legislação: copiar somente fontes com proveniência e aplicabilidade revisadas para a primeira fatia;
- não copiar: aplicação legada, migrations antigas do Supabase, backups, arquivos de ambiente, secrets, caches, artefatos gerados ou os três repositórios de ferramentas.

A seleção final e a adaptação de nomes/caminhos devem ocorrer na nova sessão, depois de criar o repositório e antes do primeiro commit documental.

## Next session

1. Recarregar e verificar GitHub/Supabase MCPs.
2. Criar `Zezolas2798/zelus-food-solution` como repositório privado com `main`.
3. Inicializar localmente uma pasta limpa, fora do legado, sem copiar código.
4. Fazer a revisão técnica orientada por decisões, começando pela topologia da aplicação e adequação de Supabase/Postgres.
5. Definir o conjunto documental promovido e fazer um primeiro commit somente de documentação/governança.
6. Criar o scaffold executável apenas após ratificar stack, tenancy, segurança e baseline de verificação.

## Connections

| Document | Type | Description |
|---|---|---|
| [Handoff anterior](./2026-08-14-1217-v2-pre-spec-review-offline-research-handoff.md) | `revisits` | Continua a revisão pré-especificação e fecha o dispatch que antes estava apenas proposto. |
| [Project decisions](../docs/PROJECT-DECISIONS.md) | `modifies` | Resolve DD-009/A9 e registra o destino do repositório, a fronteira das ferramentas e o adiamento de offline. |
| [Research](../docs/discovery/05-offline-resilience-research/research.md) | `consumes` | Preserva a evidência primária e interna reunida pelo dispatch. |
| [Findings](../docs/discovery/05-offline-resilience-research/findings.md) | `revisits` | Mantém as constraints, mas adia a decisão arquitetural offline para depois da primeira fatia. |

## Files touched

- `docs/PROJECT-DECISIONS.md`
- `sessions/2026-08-14-1949-v2-research-infrastructure-repository-handoff.md`
