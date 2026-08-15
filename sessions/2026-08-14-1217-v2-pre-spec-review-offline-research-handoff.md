---
tags: [nutridev-v2, food-operations, offline-resilience, product-governance, multi-tenant-saas]
artifact_kind: session
layer: project
version: 0.1.0
created_at: 2026-08-14T12:17:08-03:00
updated_at: 2026-08-14T12:17:08-03:00
expires: 2026-10-13
decisions_made: true
contradictions_found: true
specs_updated: []
promoted_candidates: []
expected_importance: 9
importance_rationale: "Consolida decisões do titular e preserva a fronteira da pesquisa arquitetural antes das escolhas de scaffold da V2."
---

# Revisão pré-especificação da V2 e handoff da pesquisa offline

## Summary

Esta sessão retomou a discovery da Nutridev V2 usando o legado e os artefatos existentes como evidência, com foco nas decisões necessárias antes da especificação e do scaffold. José Augusto Leite Teixeira aprovou as direções A1–A8, declarou-se o único titular atual do projeto e de tudo que o envolve e manteve a decisão de repositório A9 em aberto. Foram registrados os insumos do fundador para EX-1, EX-6 e a autorização de EX-9, incluindo experiência com FoodChecker, Excel, auditorias do legado, consultoria multiunidade e uma operação de eventos com cozinha central. A revisão distinguiu ciência de recebimento de concordância técnica, preservou a possibilidade de correção objetiva separada e definiu princípios para planos de ação multiorigem, validação por contexto e risco, efetividade, término de vínculo e aplicabilidade regulatória progressiva. A segmentação por tipos de negócio e perfis híbridos foi aceita como fundamento que precisa permanecer explícito no domínio. A discussão técnica manteve Next.js/TypeScript e Supabase como candidatos adequados, mas reconheceu que a escolha final depende de uma arquitetura de continuidade que trate offline, sincronização, autoridade e falhas de energia como problemas distintos. A discrepância entre clones externos atualizados e cópias internas defasadas foi corrigida: Arcanum, DomainSpec e CyberAlchemy Orchestrator agora são repositórios Git atualizados dentro do Nutridev, com as versões anteriores preservadas fora do projeto. As skills `subagent-strategy`, `research`, `research-tower` e `dispatch-spec` foram instaladas para as próximas sessões. Foi preparado e validado um rascunho de dispatch para pesquisa de resiliência offline, com schema 0.8.0 e gate de tensão PASS/PASS, mas ele não foi confirmado, registrado nem executado. A maior parte da revisão conceitual e de produto está concluída; permanecem a pesquisa arquitetural, as decisões técnicas decorrentes e alguns detalhes deferidos que exigem evidência, especificação ou validação de campo.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [Tipos de negócio](../docs/discovery/02-tipos-de-negocio.md) | `contextualizes` | O fechamento registra a aprovação do titular para manter explícitas as diferenças entre segmentos e perfis híbridos. |
| [Founder evidence intake](../docs/discovery/03-founder-evidence-intake-ex1-ex6-ex9.md) | `derives-from` | A síntese incorpora os insumos fornecidos para EX-1, EX-6 e EX-9 e preserva seus limites de evidência. |
| [Decisões pré-especificação](../docs/discovery/04-pre-specification-decisions-action-validation-acknowledgement.md) | `derives-from` | O fechamento consolida as decisões e obrigações ainda abertas sobre ciência, ações, validação, vínculo e regulação. |
| [Rascunho do dispatch de resiliência offline](../docs/discovery/05-offline-resilience-research/dispatch-sheet.json) | `contextualizes` | Registra por que o rascunho foi criado, seu gate PASS/PASS e o fato de ainda não haver confirmação ou execução. |

## Open questions

- Quais RTO, RPO e níveis de continuidade cada processo precisa quando falham apenas a WAN, a LAN, o backend, um dispositivo ou toda a energia da unidade?
- Qual combinação entre SaaS online, PWA offline seletiva, cliente híbrido/nativo e edge local oferece a melhor relação entre continuidade, integridade, custo e operação?
- Quais comandos de cada módulo podem ser rascunho ou fato provisório offline, quais exigem reserva prévia e quais permanecem sob autoridade exclusivamente online?
- Como fechar os detalhes ainda deferidos de assinatura eletrônica, manifestação para correção objetiva, prazos de ação, matriz de validação, retenção/exportação e aplicabilidade regulatória por módulo?
- A V2 deve ocupar um repositório novo e, nesse caso, Arcanum, DomainSpec e Orchestrator devem entrar como submódulos, dependências externas ou outra integração versionada?

## Next steps

1. Na próxima sessão, revisar a pergunta de pesquisa, os cenários de falha, a fronteira de evidência e os artefatos esperados usando `subagent-strategy`, `dispatch-spec` e `research`.
2. Decidir se `research-tower` agrega valor como promoção compacta posterior ou se `research.md` e `findings.md` são suficientes.
3. Somente depois da estratégia completa, confirmar, registrar e executar formalmente o dispatch de pesquisa.
4. Converter os achados em decisão arquitetural antes de fechar Next.js/PWA versus cliente híbrido, edge local, protocolo de sincronização, backend Supabase e estratégia de índices.
5. Receber e inventariar os exemplos reais prometidos para EX-1, verificando proveniência e dados de terceiros antes do uso.
6. Auditar os arquivos locais extras e os backups dos três repositórios de conhecimento antes de qualquer limpeza, commit ou estruturação do repositório da V2.

## Recommendation

Começar a próxima sessão pela matriz de modos de falha e pelos requisitos de continuidade por processo, e não pela escolha de tecnologia; essa ordem reduz o risco de selecionar PWA, aplicativo nativo ou edge sem um nível de serviço operacional que justifique a complexidade.

## Files touched

- `docs/discovery/02-tipos-de-negocio.md`
- `docs/discovery/02.1-servico-comercial.md`
- `docs/discovery/02.2-cozinha-institucional.md`
- `docs/discovery/02.3-catering-eventos.md`
- `docs/discovery/02.4-industria-fabricacao.md`
- `docs/discovery/02.5-perfis-hibridos.md`
- `docs/discovery/03-founder-evidence-intake-ex1-ex6-ex9.md`
- `docs/discovery/04-pre-specification-decisions-action-validation-acknowledgement.md`
- `docs/discovery/05-offline-resilience-research/dispatch-sheet.json`
- `Arcanum/`
- `domainspec/`
- `cyberalchemy-orchestrator-master/`
- `C:/Users/julia/.codex/skills/subagent-strategy/`
- `C:/Users/julia/.codex/skills/research/`
- `C:/Users/julia/.codex/skills/research-tower/`
- `C:/Users/julia/.codex/skills/dispatch-spec/`
- `C:/Users/julia/Downloads/Nutridev-repo-backups/2026-08-14/`
- `sessions/2026-08-14-1217-v2-pre-spec-review-offline-research-handoff.md`

## Repository checkpoint

- `Arcanum`: `33d3ebf`, alinhado com `origin/main`; um arquivo local não rastreado foi preservado.
- `domainspec`: `151e438`, alinhado e limpo em `origin/main`.
- `cyberalchemy-orchestrator-master`: `51ccd80`, alinhado com `origin/master`; os arquivos rastreados estão limpos e os itens locais extras foram preservados como não rastreados.
- Os três caminhos internos passaram em `git pull --ff-only` e retornaram `Already up to date`.
- Backups das versões anteriores estão em `C:/Users/julia/Downloads/Nutridev-repo-backups/2026-08-14/`.
- O dispatch `2026-08-14-nutridev-offline-resilience-architecture` permanece apenas como proposta validada, sem registro no ledger e sem execução.
