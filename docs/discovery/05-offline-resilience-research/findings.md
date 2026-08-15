---
tags: [nutridev-v2, offline-resilience, subagents, architecture, continuity]
node_type: subagents-findings
is_session: false
layer: [architecture, domain, application]
nature: [explanatory, reference, technical]
status: draft
version: 0.1.0
last_updated: 2026-08-14
---

## Goal

Determinar os requisitos e uma trajetória arquitetural incremental para a continuidade operacional do Nutridev V2 sob falhas de WAN, LAN, backend, aplicativo, dispositivo e energia, sem escolher antecipadamente PWA, cliente híbrido/nativo, edge, Next.js ou Supabase.

## TL;DR

**REVISE / decision-not-ready.** A evidência permite fixar agora a independência entre captura, efeito e autoridade e executar três probes discriminatórios. Os seis eixos permanecem um modelo candidato sujeito à classificação de casos concretos e aos probes, não um contrato fechado. A evidência não permite escolher arquitetura final, prometer SLA ou autorizar efeitos críticos durante partição. Online/manual permanece a baseline; PWA é `candidate-pilot/deferred`; híbrido/nativo e os perfis de edge são `alternative/deferred` ([S-C2–S-C7, S-C9–S-C12](#registro-de-claims-da-sintese)).

## Context

Os processos do Nutridev não têm a mesma relação com continuidade, integridade e autoridade. Capturar uma temperatura, imprimir uma etiqueta, consumir estoque, fechar CAPA e homologar documento produzem efeitos distintos e não podem compartilhar uma noção genérica de “funciona offline” ([E2-C2–E2-C11](./research.md)). Os precedentes externos também mostram que operação degradada costuma depender de preparação prévia, retenção local limitada, reconciliação posterior e transferência explícita de risco ao operador ([E0-C1–E0-C7](./research.md)).

A amostra interna não comprova resiliência offline robusta: a única capacidade local implantada observada na amostra representativa pesquisada é o rascunho de temperatura em `sessionStorage`, sujeito à perda ao fechar a sessão ou o dispositivo ([E2-C4 e seção “Superfícies pesquisadas e exclusões”](./research.md); [S-C15](#registro-de-claims-da-sintese)). Falta total de energia exige procedimento manual e reconciliação posterior; não é uma variante de falha de rede ([E1 — Local inferences](./research.md), [E2 — Matriz de falhas e riscos](./research.md); [S-C1](#registro-de-claims-da-sintese)).

## Veredito e limite da evidência

A decisão arquitetural permanece bloqueada até os probes e a validação do titular. O pacote fechou requisitos e constraints como `bound`, mas manteve taxonomia operacional concreta, escolha de cliente, edge, custo, targets e criticidade por perfil como `deferred`. Nenhuma linha pendente deve ser tratada como pronta para implementação ampla ou aprovação de SLA ([S-C3–S-C12](#registro-de-claims-da-sintese)).

<a id="registro-de-claims-da-sintese"></a>

## Registro de claims da síntese

| ID | Claim fechado | Fundamentação | proof_status | Estado |
|---|---|---|---|---|
| S-C1 | Modos de falha precisam ser separados | [E0-C3 e matrizes E1/E2](./research.md) | observed | requirement / `bound` |
| S-C2 | Captura, efeito e autoridade são independentes | [E0-C1–E0-C2; E2-C2–E2-C10](./research.md) | observed | requirement / `bound` |
| S-C3 | Os seis eixos independentes são um modelo candidato sujeito a casos concretos e probes | [E1-C10–E1-C11, E1-C14; taxonomia E2](./research.md) | unverified | redesign / `deferred` |
| S-C4 | Recibos, ID estável, deduplicação e reservas tipadas são requisitos | [E0-C1–E0-C2; E1-C3, E1-C12; E2-C5–E2-C7](./research.md) | unverified | requirement / `bound` |
| S-C5 | PWA suporta somente piloto seletivo | [E0-C6; E1-C1–E1-C2, E1-C5](./research.md) | observed quanto aos limites | candidate-pilot / `deferred` |
| S-C6 | Nativo pode ampliar garantias locais, condicionado ao substrato | [E1-C6–E1-C8](./research.md) | observed quanto aos limites | alternative / `deferred` |
| S-C7 | Edge exige perfil e fencing explícitos | [E1-C14 e resíduo técnico](./research.md) | observed + design unverified | redesign / `deferred` |
| S-C8 | Revogação, wipe, relógio e replay são ameaças estruturais | [E0-C5, E0-C7; E1-C7, E1-C9, E1-C12–E1-C13; E2-C7, E2-C10](./research.md) | observed | requirement / `bound` |
| S-C9 | Dependência e TCO variam entre alternativas | [Resíduos e exclusões E0/E1/E2](./research.md) | unverified | hypothesis / `deferred` |
| S-C10 | Contrato → probes → escolha pode reduzir risco de reescrita | [E1-C1–E1-C8, E1-C12, E1-C14; E2-C1–E2-C10](./research.md) | unverified | hypothesis / `deferred` |
| S-C11 | Quatro continuity targets precisam de números do titular | [Resíduos operacionais E0/E1/E2](./research.md) | unverified | operator-reading / `deferred` |
| S-C12 | Perfil pode alterar criticidade | [E2-C11](./research.md) | unverified | titular-validation / `deferred` |
| S-C13 | HTTP sozinho não prova exactly-once | [E0-C1–E0-C2; E1-C12](./research.md) | observed | constraint / `bound` |
| S-C14 | Sob o modelo CAP, edge/cloud não podem ser sempre disponíveis e linearizáveis na partição | [E1-C14](./research.md) | observed | constraint / `bound` |
| S-C15 | A única capacidade local implantada observada na amostra representativa pesquisada é rascunho de temperatura em `sessionStorage` | [E2-C4 e seção “Superfícies pesquisadas e exclusões”](./research.md) | observed | constraint / `bound` |

## Modelo candidato de classificação: seis eixos independentes

A independência entre captura, efeito e autoridade é um requisito `bound`. Os seis eixos abaixo são um modelo candidato: devem ser aplicados a casos concretos e aos probes antes de qualquer adoção como contrato fechado. Um valor em um eixo não implica autoridade, durabilidade ou efeito em outro; em particular, captura local não equivale a conclusão, baixa, emissão ou homologação ([E0-C1–E0-C4](./research.md), [E2-C2–E2-C10](./research.md); [S-C2–S-C4](#registro-de-claims-da-sintese)).

| Eixo | Valores mínimos |
|---|---|
| `intent` | `cached_read`, `draft`, `observation`, `command` |
| `local_durability` | `volatile`, `session_scoped`, `persistent_unproven`, `persistent_tested`, `manual_primary` |
| `business_effect` | `none`, `provisional_fact`, `reserved`, `physical_effect`, `authoritative_effect` |
| `authority_source` | `none`, `actor_attestation`, `preissued_lease`, `online_authority`, `local_system_of_record` |
| `reconciliation_rule` | `append`, `deduplicate`, `revalidate`, `merge`, `arbitrate`, `manual_review` |
| `user_status` | Derivado somente de recibos comprovados, nunca apenas de otimismo da UI |

Uma aferição pode ser uma observação durável e ainda não representar consolidação autorizada. Uma etiqueta pode produzir efeito físico sem que a baixa associada tenha sido aplicada. Essa separação preserva a fronteira de autoridade já identificada no domínio ([E2-C2–E2-C7](./research.md); [S-C2–S-C4](#registro-de-claims-da-sintese)).

## Modos de falha

| Falha | Continuidade admissível | O que não deve ser presumido | Evidência |
|---|---|---|---|
| WAN indisponível, LAN viva | Leitura materializada, rascunho e captura provisória; edge somente se previamente instalado, alimentado e autorizado | Cloud, revogação atual, sincronização externa ou autoridade local automática | [E0-C3](./research.md), [E1-C1–E1-C5](./research.md), [S-C1](#registro-de-claims-da-sintese) |
| LAN indisponível | Estado individual já presente em cada dispositivo | Coordenação entre tablets, periféricos ou edge | [E1 — Local inferences](./research.md), [E2 — Matriz de falhas](./research.md) |
| Backend indisponível | Captura e leitura local previamente preparadas | Confirmação, arbitragem ou autoridade exclusivamente central | [E0 — Open residue](./research.md), [E2-C2–E2-C10](./research.md) |
| Aplicativo encerrado | Somente dados já commitados localmente | Memória, transação aberta ou envio em background | [E1-C3](./research.md), [E1-C5–E1-C6](./research.md) |
| Dispositivo perdido | Recuperação apenas de réplica ou backup já concluído | Disponibilidade da única cópia; wipe sem perda de pendências | [E0-C5](./research.md), [E0-C7](./research.md), [E1-C7](./research.md) |
| Concorrência e sincronização tardia | Fatos distintos podem coexistir até reconciliação | “Último horário vence”, saldo autoritativo cacheado ou ausência de duplicidade | [E1-C11–E1-C13](./research.md), [E2-C6–E2-C8](./research.md) |
| Energia da unidade cai, tablet continua | UI e store local do tablet | Roteador, impressora, edge, câmara ou balança disponíveis sem UPS | [E1 — Local inferences](./research.md), [E2 — Matriz de falhas](./research.md) |
| Falta total de energia | Procedimento manual para atos físicos ainda possíveis | Qualquer continuidade digital ou timestamp eletrônico contemporâneo | [E2-C4](./research.md), [S-C1](#registro-de-claims-da-sintese) |

## Máquina de recibos

A máquina mínima é:

`locally_committed → submitted → received → { accepted | rejected | conflicted }`

`accepted → effect_applied`

| Recibo | Afirmação permitida |
|---|---|
| `locally_committed` | A gravação local terminou; nenhuma recepção remota é alegada |
| `submitted` | Uma tentativa de envio foi registrada |
| `received` | O receptor persistiu a operação, mas ainda não decidiu sua validade |
| `accepted` | A operação passou pelas regras e pela autoridade atuais |
| `rejected` | A operação falhou definitivamente, com motivo auditável |
| `conflicted` | A operação exige regra determinística ou arbitragem |
| `effect_applied` | O efeito de domínio foi transacionado e possui recibo reapresentável |

`accepted` não pode ser exibido como `effect_applied`. Timeout exige consulta ou replay com o mesmo `operation_id`; sem ID estável, deduplicação durável e resposta reapresentável, a semântica HTTP não prova exactly-once ([E0-C1–E0-C2](./research.md), [E1-C12](./research.md); [S-C4, S-C13](#registro-de-claims-da-sintese)).

## Reservas tipadas

“Reserva prévia” só é válida quando declara `scope`, `issuer`, `validity`, `consumption` e `fencing`. Um cache de saldo não substitui reserva ([E2-C5–E2-C7](./research.md); [S-C4, S-C7](#registro-de-claims-da-sintese)).

| Tipo | Escopo e emissor | Validade e consumo | Fencing mínimo |
|---|---|---|---|
| `identity_allocation` | Faixa ou namespace de IDs de lote, etiqueta ou operação; autoridade central ou edge autorizado | Expiração e uso único | Epoch e unicidade global |
| `inventory_hold` | Lote, local, SKU e quantidade; autoridade de estoque | TTL, quantidade consumível e saldo residual | Token e versão do agregado |
| `capacity_lease` | Recurso, unidade, janela e capacidade | TTL e consumo limitado | Epoch monotônico |
| `authority_lease` | Ator, organização, unidade, ação e recurso | Curta, auditável e limitada por ato e escopo | Token de fencing; revogação offline imediata não presumida |

## Matriz processo/perfil

Perfis: **C** comercial; **I** institucional; **E** catering/eventos; **F** indústria; **H** híbrido. A indicação de pressão por perfil é hipótese sujeita a validação do titular, não criticidade comprovada ([E2-C11](./research.md); [S-C12](#registro-de-claims-da-sintese)).

| Processo / perfis pressionados | Continuidade candidata | Autoridade e efeito | Integridade mínima |
|---|---|---|---|
| Auditoria — todos; I/F/H | Snapshot versionado, rascunho, observações e fotos | Concluir, assinar e emitir online | Ator, unidade, versão do checklist e recibo por anexo ([E2-C2](./research.md)) |
| CAPA — todos; I/F/H | Plano local; execução e evidência provisórias | Validar, fechar e reabrir online | Origem imutável e validador elegível ([E2-C3](./research.md)) |
| Temperatura — C/I/E/H | Aferição provisória; manual na falta total de energia | Consolidação posterior | Hora física, equipamento e período; estado atual é `session_scoped` ([E2-C4](./research.md)) |
| Etiquetas — C/E/F/H | Composição; impressão somente com `identity_allocation` e, quando aplicável, reserva | Baixa não é inferida da impressão | Unicidade, lote, destino e recibos separados ([E2-C5](./research.md)) |
| Produção e estoque — I/F/H | Apontamentos provisórios; cálculo reconciliável | Consumo e transferência requerem `inventory_hold`; fechamento online | Atomicidade, fencing e histórico ([E2-C6–E2-C7](./research.md)) |
| Tarefas e comunicação — todos; E/H | Progresso e mensagem com ID único | Atribuição, aceite e ciência formal online | UI otimista distinta do recibo ([E2-C8](./research.md)) |
| Documentos — todos; I/F/H | Snapshot com versão e validade; upload como rascunho | Homologar e superseder online | Blob e metadata consistentes; obsolescência visível ([E2-C9](./research.md)) |

## Alternativas condicionais

| Alternativa | Escopo permitido | Limites decisivos | Veredito | Owner |
|---|---|---|---|---|
| **Online-only + manual** | Autoridade central; procedimento manual durante falha e transcrição posterior | Não oferece continuidade digital; concentra risco em interrupção e reconciliação humana | `baseline/retained` | Titular do Nutridev e Operações ([E2-C2–E2-C10](./research.md)) |
| **PWA seletiva** | Cache, rascunho e intake provisório | Retenção removível, quota variável e Background Sync sem garantia de SLA | `candidate-pilot/deferred` | Arquitetura, sob precedentes externos ([E1-C1–E1-C5](./research.md); [S-C5](#registro-de-claims-da-sintese)) |
| **Híbrido/nativo** | O mesmo contrato, com store e APIs de dispositivo | Processo também pode ser encerrado; keystore não recupera cópia única; durabilidade depende do substrato | `alternative/deferred` | Arquitetura Mobile ([E1-C6–E1-C8](./research.md); [S-C6](#registro-de-claims-da-sintese)) |
| **Edge `read_replica`** | Leitura local de snapshots | Estar na LAN não concede autoridade de escrita | `alternative/deferred` | Arquitetura e Operações ([E1-C14](./research.md); [S-C7](#registro-de-claims-da-sintese)) |
| **Edge `provisional_intake`** | Recepção e persistência de fatos provisórios | Cloud continua responsável por arbitragem e autorização | `alternative/deferred` | Arquitetura e Operações ([E1-C14](./research.md); [S-C7](#registro-de-claims-da-sintese)) |
| **Edge `leased_authority`** | Comandos estritamente limitados por leases e fencing | Partição, expiração, escritor obsoleto e retomada exigem protocolo testado | `alternative/deferred` | Arquitetura, Segurança e Operações ([E1-C9](./research.md), [E1-C14](./research.md); [S-C7–S-C8](#registro-de-claims-da-sintese)) |
| **Edge `local_system_of_record`** | Autoridade primária deliberadamente transferida ao site | Muda ownership, backup, alta disponibilidade, suporte e reconciliação | `alternative/deferred` e decisão separada | Titular do Nutridev ([S-C7, S-C9, S-C14](#registro-de-claims-da-sintese)) |

Nenhuma alternativa é promovida como arquitetura final. A frase genérica “edge mantém o serviço” fica rejeitada enquanto o perfil de edge e sua autoridade não forem declarados ([S-C7, S-C14](#registro-de-claims-da-sintese)).

## Segurança, operação e dependência

- Revogação posterior é invisível ao cliente isolado; uma `authority_lease` deve ser curta, limitada e auditável ([E1-C9](./research.md), [E2-C10](./research.md); [S-C8](#registro-de-claims-da-sintese)).
- Cifra e keystore reduzem exposição, mas não restauram a única cópia; lock e wipe colocam confidencialidade e recuperação de pendências em tensão ([E0-C5](./research.md), [E0-C7](./research.md), [E1-C7](./research.md)).
- Relógio de parede não prova causalidade; devem ser preservados identidade, origem, versão-base, sequência e fencing ([E1-C13](./research.md); [S-C8](#registro-de-claims-da-sintese)).
- Idade e profundidade da fila, último recibo, anexos incompletos, rejeições e conflitos precisam ser observáveis para que “offline” não esconda dívida operacional ([E0-C1](./research.md), [E0-C4](./research.md), [E0-C6](./research.md); [S-C8](#registro-de-claims-da-sintese)).
- **Inferência arquitetural não medida:** online/manual concentra custo em interrupção e transcrição; PWA adiciona variabilidade de browser; nativo adiciona gestão de dispositivos e releases; edge adiciona hardware, UPS, backup, monitoramento, patching e suporte por unidade. A ordem real de TCO permanece hipótese e deve ser medida localmente ([S-C9](#registro-de-claims-da-sintese)).

## Continuity targets para validação do titular

Estes são quatro targets independentes, sem números comprovados e sem valor de SLA neste estágio ([E0 — Open residue](./research.md), [E1 — Open residue](./research.md); [S-C11](#registro-de-claims-da-sintese)).

| Target | Tempo-alvo a decidir | Perda tolerável a decidir |
|---|---|---|
| `capture_continuity` | Quanto tempo até voltar a registrar local ou manualmente? | Quantos inputs ainda não `locally_committed` podem ser perdidos? |
| `local_durability` | Quanto tempo até recuperar ou reabrir o store local? | Quais recibos locais sobrevivem a kill, eviction e falta de energia? |
| `reconciliation_recovery` | Quanto após a reconexão até drenar e classificar pendências? | Alguma operação `received` pode desaparecer ou reaplicar efeito? |
| `authority_restoration` | Quanto tempo até decisões autoritativas voltarem? | Quais efeitos aceitos ou aplicados precisam ser reconstruídos? |

## Decisões para fixar agora e decisões a adiar

| Momento | Decisão | Estado e evidência |
|---|---|---|
| Agora | Separar explicitamente os modos de falha | `bound` ([S-C1](#registro-de-claims-da-sintese)) |
| Agora | Fixar a independência entre captura, efeito e autoridade; testar os seis eixos somente como modelo candidato | independência `bound` em S-C2; redesign dos seis eixos `deferred` em S-C3 ([S-C2–S-C3](#registro-de-claims-da-sintese)) |
| Agora | Exigir recibos, `operation_id`, deduplicação durável e resultado reapresentável | `bound` ([E1-C12](./research.md); [S-C4, S-C13](#registro-de-claims-da-sintese)) |
| Agora | Usar reservas tipadas para identidade, estoque, capacidade e autoridade | `bound` ([E2-C5–E2-C7](./research.md); [S-C4](#registro-de-claims-da-sintese)) |
| Agora | Preservar fallback manual numerado para falta total de energia | `bound` ([E2-C4](./research.md); [S-C1](#registro-de-claims-da-sintese)) |
| Adiar | Escolha entre PWA e híbrido/nativo | Depende dos probes nos dispositivos-alvo ([S-C5–S-C6](#registro-de-claims-da-sintese)) |
| Adiar | Qualquer promoção de edge | Depende de perfil explícito, fencing, partição, UPS e operação ([S-C7, S-C14](#registro-de-claims-da-sintese)) |
| Adiar | Targets numéricos, autonomia e SLA | Exigem decisão do titular por processo e perfil ([S-C11–S-C12](#registro-de-claims-da-sintese)) |
| Adiar | Comparação de TCO e dependência | Não medida no ambiente Nutridev ([S-C9](#registro-de-claims-da-sintese)) |

## Três probes discriminatórios

1. **Foto grande, kill/eviction e recibo:** capturar um anexo, obter `locally_committed`, encerrar o processo ou induzir eviction, reabrir, sincronizar e conferir recibos e hash. O probe discrimina a retenção operacional real da promessa abstrata de APIs web ([E1-C1–E1-C5](./research.md); [S-C5](#registro-de-claims-da-sintese)).

2. **Dois tablets, revogação, replay e arbitragem:** alterar o mesmo objeto em isolamento, revogar um vínculo, perder a resposta após commit, reenviar o mesmo ID e verificar deduplicação, autoria, rejeição e conflito. O probe testa autoridade envelhecida, causalidade e efeito duplicado ([E1-C9](./research.md), [E1-C11–E1-C13](./research.md), [E2-C10](./research.md); [S-C8, S-C13](#registro-de-claims-da-sintese)).

3. **Edge, partição e fencing:** particionar edge e cloud, exercer e expirar lease, tentar escrita com emissor obsoleto, validar fencing, reconectar e repetir com WAN, energia e UPS degradadas. O probe discrimina os perfis de edge e impede que disponibilidade local seja confundida com consistência autoritativa ([E1-C14](./research.md); [S-C7, S-C14](#registro-de-claims-da-sintese)).

## Prestação de contas aos explorers

| Explorer | Contribuição preservada | Como entrou na síntese |
|---|---|---|
| **Agent 0 — precedentes operacionais externos** | Preparação online, limites temporais e de armazenamento, IDs locais, reconciliação posterior, perda no dispositivo, conflitos e responsabilidade humana ([E0-C1–E0-C7](./research.md)) | Fundamentou recibos, limites de custódia local, separação entre aceite e confirmação e risco operacional |
| **Agent 1 — garantias e limites técnicos** | Condicionalidade de PWA, quota/eviction, atomicidade local, lifecycle móvel, revogação, causalidade, idempotência e partição ([E1-C1–E1-C14](./research.md)) | Limitou as promessas de PWA, nativo e edge e definiu os probes de retenção, replay e fencing |
| **Agent 2 — continuidade do domínio Nutridev** | Fronteiras de autoridade por processo, riscos físicos, reservas, diferenças de perfil e evidência do legado ([E2-C1–E2-C11](./research.md)) | Produziu a matriz processo/perfil, impediu a promoção do legado a requisito e manteve atos físicos separados de efeitos autoritativos |

## Dissent e resíduo preservados

- Os precedentes externos demonstram mecanismos e limites, mas não provam continuidade sob backend Nutridev indisponível com WAN saudável, nem oferecem targets universais ([E0 — Open residue](./research.md)).
- As garantias de plataforma limitam escolhas, mas não escolhem entre PWA e nativo: browser e mobile têm modos de falha distintos que só os probes no substrato-alvo podem discriminar ([E1-C1–E1-C8](./research.md)).
- A modelagem de domínio é mais forte para as fronteiras já definidas de Auditoria, CAPA e documentos; estoque, produção, etiquetas e tarefas incluem pressões futuras e evidência brownfield, não requisitos automaticamente promovidos ([E2-C1](./research.md)).
- Criticidade por perfil, TCO, targets, suporte por browser/dispositivo, capacidade de anexos, janela de revogação e desenho de edge continuam `deferred`, não `unresolved` mascarado como recomendação ([S-C9–S-C12](#registro-de-claims-da-sintese)).
- A arquitetura só estará pronta para decisão quando evidência experimental e leitura do titular substituírem essas hipóteses. Até lá, qualquer promoção de PWA, nativo ou edge excederia a prova ([S-C5–S-C12](#registro-de-claims-da-sintese)).

## Connections

| Document | Type | Description |
|---|---|---|
| [research.md](./research.md) | `derives-from` | Este documento sintetiza os retornos dos três explorers registrados no research do dispatch. |

## Open Questions

- **OQ-1 (BLOCKER)** — Quais valores de tempo-alvo e perda tolerável valem para cada continuity target, processo e perfil? Recomendação: o Titular classificar primeiro Auditoria, CAPA, Temperatura, Etiquetas, Produção/Estoque, Tarefas/Comunicação e Documentos, incluindo autonomia manual e dependências físicas. Owner: **Titular do Nutridev**.

- **OQ-2 (BLOCKER)** — A PWA preserva anexos, recibos e outbox nos tablets e browsers-alvo sob kill, eviction e pressão de armazenamento? Recomendação: executar o Probe 1 antes de autorizar qualquer piloto operacional além de cache, rascunho e intake provisório. Owner: **Liderança de Arquitetura e QA**.

- **OQ-3 (BLOCKER)** — O contrato preserva autoria, deduplicação e arbitragem quando dois tablets divergem e uma permissão é revogada durante o isolamento? Recomendação: executar o Probe 2 com critérios de aceite definidos por processo. Owner: **Liderança de Segurança e Domínio**.

- **OQ-4** — Algum perfil requer edge e, se requer, qual perfil explícito — `read_replica`, `provisional_intake`, `leased_authority` ou `local_system_of_record` — é justificável? Recomendação: manter edge `alternative/deferred` até o Titular escolher o caso operacional e o Probe 3 comprovar fencing, retomada e dependências de UPS. Owner: **Titular do Nutridev e Operações**.

- **OQ-5** — Na perda de dispositivo, a prioridade é wipe imediato ou recuperação das pendências ainda não replicadas? Recomendação: definir política por sensibilidade, processo e prazo da `authority_lease`, sem presumir que ambos os objetivos podem ser garantidos simultaneamente. Owner: **Liderança de Segurança**.

- **OQ-6** — Qual alternativa apresenta menor TCO real depois de incluir interrupção/manual, gestão de browsers, gestão de dispositivos e operação de edge por unidade? Recomendação: medir somente após os probes, usando o mesmo contrato e os mesmos processos de referência. Owner: **Titular do Nutridev e Operações**.
