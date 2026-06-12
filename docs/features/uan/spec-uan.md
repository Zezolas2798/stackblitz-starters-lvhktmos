# Feature Spec: UAN (Unidade de Alimentação e Nutrição)

## Feature Concept Graph

| Concept | Nature | Responsibility |
| :--- | :--- | :--- |
| `uan.FichaTecnica` | Knowledge | Gestão de receitas e per capita nutricional. |
| `uan.Cardapio` | Process | Agendamento e distribuição de refeições. |
| `uan.NSGA_Solver` | Algorithm | Otimização multi-objetivo (Custo vs Nutrição). |
| `uan.GeradorLista` | Service | Explosão de necessidades baseada em comensais. |

## Cross-Feature Dependencies

| Dependency | Direction | Reason |
| :--- | :--- | :--- |
| `ingredientes` | Upstream | Fornece dados nutricionais e de classificação (NOVA). |
| `financeiro` | Upstream | Fornece o CMP (Custo Médio Ponderado) para viabilidade. |
| `estoque` | Downstream | Recebe a reserva de insumos baseada na Lista de Compras. |
| `industria` | Downstream | Recebe a Ordem de Produção gerada pelo Cardápio. |

## Feature Constraints

- **Custo Máximo:** Todo cardápio deve respeitar o limite de custo diário definido pelo Financeiro.
- **RDC 216:** As fichas técnicas devem conter as etapas de preparo para segurança alimentar.
- **SLA de Otimização:** O motor de planejamento não deve exceder 10 segundos de processamento via Edge Function.

## Technical Architecture

| Domain | Link | Status |
| :--- | :--- | :--- |
| **Domain Model** | [[domain-uan]] | translated |
| **Operations** | [[technical/operations-uan]] | draft |
| **States** | [[technical/states-uan]] | draft |
| **Events** | [[technical/events-uan]] | draft |
| **Interfaces** | [[technical/interfaces-uan]] | draft |
| **Queries** | [[technical/queries-uan]] | draft |
| **Observability** | [[technical/observability-uan]] | draft |
| **Test Spec** | [[technical/test-spec-uan]] | draft |
| **UI Architecture** | [[technical/ui-architecture-uan]] | draft |
| **Cardapio Edge** | [[edge.calcularCardapioUAN]] | draft |

## Related Discovery Documents & Research

### Process & Operations
- [[features/uan/discovery/research/uan.cardapios|Processo de Cardápios]]
- [[features/uan/discovery/research/fichas_tecnicas_uan|Fichas Técnicas UAN]]
- [[features/uan/discovery/research/uan.lista_compras|Gestão de Compras]]
- [[features/uan/discovery/research/fluxograma_operacional_uan|Fluxograma Operacional]]
- [[features/uan/discovery/research/gestao_estoque_fornecedores_uan|Suprimentos em UAN]]

### Algorithms & Mathematics
- [[features/uan/discovery/research/otimizacao_cardapios_restricoes|Restrições do Solver]]
- [[features/uan/discovery/research/modelo_matematico_planejamento|Modelo Matemático]]
- [[features/uan/discovery/research/otimizacao_cardapios_uan|Benchmark de Otimização]]
- [[features/uan/discovery/research/planejamento_cardapios_ia|Planejamento IA]]

### Infrastructure & Integration
- [[features/uan/discovery/research/saas_uan_fichas_tecnicas|Requisitos SaaS]]
- [[features/uan/discovery/research/financeiro-integration|Integração com Financeiro]]
- [[features/uan/discovery/research/automacao-cardapios-gaps-arquitetura|Gaps de Arquitetura]]

### Requirements & Strategy
- [[features/uan/discovery/research/seguranca_alimentar_uan|Segurança e APPCC]]
- [[features/uan/discovery/research/inovacao_tecnologica_uan|Inovação Tecnológica]]
- [[features/uan/discovery/research/engenharia_cardapios_uan|Engenharia de Cardápios]]
- [[features/uan/discovery/research/mapeamento_cargos_uan|Estrutura Organizacional]]
- [[features/uan/discovery/research/indicadores_desperdicio_uan|Controle de Desperdício]]

### Validation & Sub-Agents
- [[features/uan/discovery/validacao-automacao-cardapios/domainspec-subagents-findings|Descobertas: Sub-Agentes]]
- [[features/uan/discovery/validacao-automacao-cardapios/domainspec-subagents-research|Pesquisa: Sub-Agentes]]
