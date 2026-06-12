---
id: sistema.registry
titulo: "Concept Registry — Índice Global de Conceitos"
tipo: registry
status: consolidated
layer: ontology
nature: reference
veracidade: high
convicção: high
version: 1.2.0
last_updated: 2026-04-17
tags:
  - sistema/registry
  - sistema/indice
---

# Concept Registry

> Índice global de todos os conceitos de domínio do sistema. Cada conceito mapeia para exatamente um dos meta-tipos definidos em [[shared/discovery/sistema.taxonomy]].


---

## Entidades

| ID | Conceito | Módulo | State Machine | Descrição |
|---|---|---|---|---|
| ingrediente.Ingrediente | Ingrediente | [[spec-ingredientes]] | — | Insumo primário, composto ou aditivo com rastreabilidade nutricional |
| ingrediente.GrupoIngrediente | Grupo de Ingrediente | [[spec-ingredientes]] | — | Classificação hierárquica para estoque/categoria |
| receita.Receita | Receita / Ficha Técnica | [[spec-ingredientes]] | StatusReceita | Formulação industrial com rotulagem GxP |
| uan.FichaTecnica | Ficha Técnica UAN | [[spec-uan]] | — | Receituário operacional para refeitórios com custo per capita |
| uan.Cardapio | Cardápio UAN | [[spec-uan]] | StatusCardapio | Ciclo mensal de planejamento alimentar com comensais variáveis |
| uan.ListaCompras | Lista de Compras UAN | [[spec-uan]] | StatusListaCompra | Snapshot calculado da necessidade de compra do ciclo |
| producao.OrdemProducao | Ordem de Produção | [[spec-industria]] | StatusOP | Documento mestre de execução de produção |
| producao.SetorProducao | Setor de Produção | [[spec-industria]] | — | Divisão física/lógica da fábrica |
| estoque.Lote | Lote de Estoque | [[spec-estoque]] | StatusLote | Unidade fundamental de rastreabilidade com validade e saldo |
| estoque.Movimentacao | Movimentação | [[spec-estoque]] | — | Registro imutável de fluxo de estoque (Entrada, Saída, etc) |
| estoque.Inventario | Inventário | [[spec-estoque]] | StatusInventario | Sessão de auditoria física para reconciliação de saldos |
| estoque.Recebimento | Recebimento | [[spec-estoque]] | — | Protocolo de check-in físico e fiscal de mercadorias |
| suprimentos.Fornecedor | Fornecedor | [[spec-suprimentos]] | StatusHomologacao | Parceiro comercial de suprimentos com homologação GED |
| suprimentos.PrestadorServico | Prestador de Serviço | [[spec-suprimentos]] | StatusHomologacao | Especialista técnico vinculado a ativos e áreas |
| compras.Orcamento | Cotação/Orçamento | [[spec-compras]] | StatusOrcamento | Matriz de cotações vigentes de ingredientes por fornecedor |
| financeiro.Transacao | Transação | [[spec-financeiro]] | — | Raiz agregada de movimentação financeira (previsão ou efetivação) |
| financeiro.Lancamento | Lançamento | [[spec-financeiro]] | — | Item rateado de uma transação vinculado ao DRE |
| financeiro.Conta | Plano de Contas | [[spec-financeiro]] | — | Estrutura hierárquica do fluxo de caixa e DRE |
| qualidade.ChecklistModelo | Modelo de Checklist | [[spec-qualidade]] | — | Molde estrutural para formulários de auditoria |
| qualidade.ChecklistSecao | Seção de Checklist | [[spec-qualidade]] | — | Agrupamento lógico de itens na auditoria |
| qualidade.ChecklistExecucao | Execução de Auditoria | [[spec-qualidade]] | AuditoriaStatus | Instância viva e assinada de uma inspeção in loco |
| qualidade.AcaoCorretiva | Ação Corretiva | [[spec-qualidade]] | AcaoStatus | Plano de ação para tratar desvios/não-conformidades |
| qualidade.ControleTemperatura | Log de Temperatura | [[spec-qualidade]] | — | Registro imutável de temperatura de um equipamento |

---

## Value Objects

| ID | Conceito | Módulo | Descrição |
|---|---|---|---|
| ingrediente.Alergenico | Alergênico | [[spec-ingredientes]] | Propriedade sanitária vinculada à ANVISA |
| ingrediente.InfoNutricional | Informação Nutricional | [[spec-ingredientes]] | Matriz de macros e micronutrientes por 100g |
| receita.Composicao | Composição | [[spec-ingredientes]] | Relação NxN receita↔ingrediente com FC e IC |
| receita.Material | Material/Embalagem | [[spec-ingredientes]] | Insumo não-comestível para custo |
| rotulagem.ResultadoCalculo | Resultado de Cálculo | [[spec-ingredientes]] | Objeto retornado pela Edge Function |
| uan.ComposicaoFicha | Composição UAN | [[spec-uan]] | Relação NxN ficha↔ingrediente com PB, PL, FC e IC (sem vínculo com rótulo) |
| uan.GradeCardapio | Grade UAN | [[spec-uan]] | Alocação unitária: data × refeição × ficha técnica com fator_multiplicador |
| estoque.Local | Local de Estoque | [[spec-estoque]] | Endereço físico de armazenamento (Ex: Câmara, Prateleira) |
| equipamentos.Equipamento | Equipamento | [[spec-equipamentos]] | Maquinário produtivo ou conservador |
| compras.MatrizKraljic | Matriz de Risco | [[spec-compras]] | Avaliação de risco e impacto financeiro (Kraljic) |
| financeiro.DreNode | DRE Node | [[spec-financeiro]] | Nó da árvore do relatório de Demonstrativo de Resultados |
| qualidade.ChecklistItem | Item de Auditoria | [[spec-qualidade]] | Questão de verificação com peso e obrigatoriedade |
| qualidade.ChecklistResposta | Resposta de Auditoria | [[spec-qualidade]] | Valor submetido a um item, incluindo fotos e status |

---

## Enums / Types

| ID | Conceito | Valores | Descrição |
|---|---|---|---|
| ingrediente.TipoIngrediente | TipoIngrediente | `SIMPLES`, `COMPOSTO`, `ADITIVO` | Classificação que determina comportamento na rotulagem |
| receita.StatusReceita | StatusReceita | `RASCUNHO`, `EM_ANALISE`, `APROVADO`, `OBSOLETO` | Lifecycle da ficha técnica |
| producao.StatusOP | StatusOP | `PENDENTE`, `EM_PREPARO`, `FINALIZADA`, `CANCELADA` | Estado da ordem de produção |
| receita.LayoutTabela | LayoutTabela | `VERTICAL`, `HORIZONTAL`, `LINEAR` | Formato da tabela nutricional |
| receita.EstadoAlimento | EstadoAlimento | `solido`, `liquido` | Impacta limites da Lupa FOP (lowercase string) |
| uan.CategoriaUAN | CategoriaUAN | `Prato Base`, `Prato Principal`, `Alternativa`, `Opção Vegetariana`, `Guarnição`, `Saladas`, `Bebidas`, `Complemento`, `Sopa`, `Bebida Quente`, `Bebida Fria`, `Base`, `Recheio`, `Sobremesa` | 14 categorias de preparação divididas em 2 grupos de refeição |
| uan.StatusCardapio | StatusCardapio | `Rascunho`, `Em Planejamento`, `Aprovado`, `Enviado para Compras`, `Em Execução` | Lifecycle do ciclo de cardápio |
| estoque.StatusLote | StatusLote | `PREVISTO`, `APROVADO`, `REJEITADO`, `VENCIDO` | Estado de disponibilidade do lote físico |
| estoque.StatusInventario | StatusInventario | `EM_ANDAMENTO`, `FINALIZADO`, `CANCELADO` | Estado da auditoria física |
| fornecedor.StatusHomologacao | StatusHomologacao | `PENDENTE`, `APROVADO`, `REJEITADO` | Lifecycle de conformidade documental do parceiro |
| qualidade.AuditoriaStatus | AuditoriaStatus | `EM_ANDAMENTO`, `CONCLUIDO`, `CANCELADO` | Lifecycle de uma execução de checklist |
| qualidade.AcaoStatus | AcaoStatus | `PENDENTE`, `CONCLUIDO` | Lifecycle de uma NC / Plano de ação |
| qualidade.StatusEquipamento | StatusEquipamento | `LIGADO`, `DESLIGADO`, `VAZIO` | Estado operacional do equipamento no monitoramento |

---

## Calculations

| ID | Conceito | Usado Por | Fórmula / Descrição |
|---|---|---|---|
| rotulagem.CalculoNutricional | Cálculo Nutricional | calcular-nutrientes | Soma ponderada de macros por peso líquido na composição |
| rotulagem.CalculoLupa | Cálculo de Lupa FOP | calcular-nutrientes | Compara açúcar/sódio/gordura com limites IN 75 |
| rotulagem.CalculoPorcao | Cálculo de Porção | calcular-nutrientes | Harmonização Art. 8/10 RDC 429 |
| rotulagem.FormatarValue | Formatação de Valor | calcular-nutrientes | Arredondamento Anexo III IN 75 |
| receita.CalculoCusto | Cálculo de Custo | Frontend | `(Peso Líquido / Peso Unitário) × Preço` |
| uan.CalculoFC | Fator de Correção UAN | Frontend (inline) | `FC = Peso Bruto (g) / Peso Líquido (g)` — auto-calculado no onChange |
| uan.CalculoPesoFinal | Peso Final UAN | Frontend (inline) | `Peso Final = Peso Líquido × IC` — exibido em tempo real, não persistido |
| uan.CalculoPerCapita | Custo Per Capita | Frontend (inline) | `Custo Porção = Σ(PB_kg × Preço/kg) / Rendimento` |
| uan.CalculoNecessidadeBruta | Necessidade Bruta | edge.calcularCardapioUAN | `Necessidade_g = Σ(PB_g × comensais × fator_multiplic)` por ingrediente/ciclo |
| uan.CalculoQtdComprar | Quantidade a Comprar | edge.calcularCardapioUAN | `MAX(0, necessidade_kg - estoque_atual + estoque_mínimo)` |
| uan.CalculoNutricionalClinico | Análise Nutricional Clínica | Frontend (Modal) | `Nutriente_porção = Σ(PesoFinal_i/100 × valor_nutriente_i) / rendimento` via TACO/TBCA |
| estoque.CalculoValidade | Motor de Validade | [[spec-estoque]] | Cruzamento: `MIN(Fabricante, Após Aberto, Lei Sanitária)` |
| estoque.CalculoCMP | Custo Médio Ponderado | trigger_atualiza_custo | `Σ(Valor Lotes) / Σ(Qtd Lotes)` por ingrediente |

---

## Rules

| ID | Conceito | Enforces | Expressão |
|---|---|---|---|
| ingrediente.RegraLactoseOmissao | Omissão de Lactose | processarDeclaracoes | `SE alergenico("Leite") E lactose_g IS NULL → "CONTÉM LACTOSE"` |
| ingrediente.RegraGMOAditivo | Limpeza GMO Aditivo | handleSalvar | `SE tipo === 'ADITIVO' → limpar todos os campos GMO` |
| receita.RegraDuplicidadeRisco | Anti-Duplicidade de Risco | Aba Riscos | `SE alérgeno é nativo → bloquear como risco cruzado` |
| receita.RegraAprovacaoFantasma | Bloqueio de Aprovação | ReceitaHeader | `SE rascunho === último snapshot → bloquear botão` |
| uan.RegraAntiFantasma | Filtro de Linhas Vazias | handleSalvar (Fichas UAN) | `SE todos os campos da linha estão vazios → remover antes de persistir` |
| uan.RegraLinhaCompleta | Validação de Completude | handleSalvar (Fichas UAN) | `SE ingrediente_id OU peso_bruto_g OU peso_liquido_g faltarem → bloquear salvar` |

---

## Policies

| ID | Conceito | Aplica-se a | Lógica |
|---|---|---|---|
| ingrediente.PoliticaTransgenico | Política de Transgênico | gerarListaDeIngredientes | Contextual por tipo: SIMPLES=sufixo, COMPOSTO=sem alteração, ADITIVO=ignorar |
| ingrediente.PoliticaOverride | Override Nutricional | calcular-nutrientes | Se `referencia_id` presente → sobrescrever macros; manter alergênicos do original |
| sistema.PoliticaMultiTenant | Multi-Tenant | Todas as queries | `(cliente_id = tenant) OR (cliente_id IS NULL)` |
| uan.PoliticaCategoriaFiltrada | Categorias por Refeição | Frontend (Fichas UAN) | Se refeições selecionadas → exibir apenas categorias do grupo correspondente (`MEAL_CATEGORY_GROUPS`) |
| uan.PoliticaResolucaoComensais | Resolução de Comensais | edge.calcularCardapioUAN | Hierarquia: `config_excecoes_dias[data][ref]` → `comensais_modelo[dia_semana][ref]` → `comensais_estimados_dia` |
| estoque.PoliticaUnitIsolation | Isolamento de Unidade | RLS (estoque) | `unidade_id = user.unidade_id` (Strict Multi-Tenancy) |
| estoque.PoliticaFEFO | Regra de Consumo | Frontend/Produção | Sugestão automática do lote com validade mais próxima (First-Expired, First-Out) |

---

## Interfaces (Edge Functions)

| ID | Conceito | Tipo | Expõe |
|---|---|---|---|
| edge.calcularNutrientes | calcular-nutrientes | Edge Function (Deno) | Cálculo nutricional, Lupas, Lista de Ingredientes, Declarações |
| edge.aprovarReceita | aprovar-receita | Edge Function (Deno) | Aprovação de versão com snapshot |
| edge.calcularCardapioUAN | calcular-cardapio-uan | Edge Function (Deno) — **status: draft** | Motor de lista de compras UAN: grade → comensais → necessidade bruta → qtd comprar |

---

## Mappings

| ID | Conceito | De → Para | Descrição |
|---|---|---|---|
| rotulagem.IngredienteParaLista | Ingrediente → Lista | DB → String formatada | Transforma ingredientes em lista decrescente com sub-ingredientes |
| rotulagem.CalculoParaRotulo | ResultadoCalculo → Rótulo | JSON → React Component | Renderiza NutritionalLabel a partir do objeto de cálculo |

---

## Concept Graph (Edges)

| From | Edge | To |
|---|---|---|
| receita.Receita | **contains** | receita.Composicao |
| ingrediente.Ingrediente | **contains** | receita.Composicao |
| receita.Receita | **refines** | receita.SubReceita (recursiva) |
| edge.calcularNutrientes | **queries** | receita.Receita |
| edge.calcularNutrientes | **produces** | rotulagem.ResultadoCalculo |
| rotulagem.ResultadoCalculo | **exemplifies** | NutritionalLabel (Render) |
| ingrediente.RegraLactoseOmissao | **enforces** | edge.calcularNutrientes |
| ingrediente.RegraGMOAditivo | **enforces** | handleSalvar |
| ingrediente.PoliticaTransgenico | **applies** | edge.calcularNutrientes |
| ingrediente.PoliticaOverride | **applies** | edge.calcularNutrientes |
| [[legislacao/RDC_727_2022]] | **enforces** | processarDeclaracoes() |
| [[legislacao/RDC_727_2022]] | **supersedes** | [[legislacao/fontes/RDC_26_Original]] |
| [[legislacao/Decreto_4680_2003]] | **enforces** | gerarListaDeIngredientes() |
| [[legislacao/RDC_429_2020_IN_75_2020]] | **enforces** | calculateLupas() |
| [[legislacao/RDC_429_2020_IN_75_2020]] | **refines** | [[legislacao/fontes/IN_75_Original]] |
| [[legislacao/Lei_10674_2003]] | **enforces** | processarDeclaracoes() |
| receita.Receita | **emite** | ReceitaAprovada (Event) |
| producao.OrdemProducao | **queries** | receita.Receita |
| producao.OrdemProducao | **queries** | ingrediente.Ingrediente |
| [[legislacao/fontes/Guia_Validacao_Sistemas_ANVISA_Original]] | **enforces** | [[governanca/compliance-validation-guide]] |
| [[governanca/compliance-validation-guide]] | **regula** | Todas as Operações GxP |
| [[registry]] | **derives-from** | [[shared/CONSTITUTION]] |
| uan.FichaTecnica | **contains** | uan.ComposicaoFicha |
| uan.ComposicaoFicha | **queries** | ingrediente.Ingrediente |
| uan.ComposicaoFicha | **queries** | ingrediente.ReferenciaNutricional (opcional) |
| uan.Cardapio | **contains** | uan.GradeCardapio |
| uan.GradeCardapio | **queries** | uan.FichaTecnica |
| uan.Cardapio | **produces** | uan.ListaCompras |
| edge.calcularCardapioUAN | **queries** | uan.Cardapio |
| edge.calcularCardapioUAN | **queries** | uan.GradeCardapio |
| edge.calcularCardapioUAN | **queries** | uan.FichaTecnica |
| edge.calcularCardapioUAN | **queries** | uan.ComposicaoFicha |
| edge.calcularCardapioUAN | **queries** | ingrediente.Ingrediente |
| edge.calcularCardapioUAN | **produces** | uan.ListaCompras |
| uan.PoliticaResolucaoComensais | **applies** | edge.calcularCardapioUAN |
| uan.PoliticaCategoriaFiltrada | **applies** | uan.FichaTecnica (formulário) |
| uan.RegraAntiFantasma | **enforces** | handleSalvar (Fichas UAN) |
| edge.calcularCardapioUAN | **derives-from** | edge.calcularNutrientes |
| suprimentos.Fornecedor | **regulado-por** | taxonomia-materiais.Config |
| suprimentos.Fornecedor | **vincula** | ged.Documento |
| suprimentos.Fornecedor | **provê** | estoque.Lote |
| suprimentos.Fornecedor | **gera-tarefa** | tarefas.Checklist (future) |
| suprimentos.PrestadorServico | **regulado-por** | taxonomia-materiais.Config |
| suprimentos.PrestadorServico | **vincula** | ged.Documento |
| suprimentos.PrestadorServico | **atende** | equipamentos.Equipamento |
| suprimentos.PrestadorServico | **atua** | areas.Setor |
| estoque.Material | **refina** | subgrupos.Especialidade |
| compras.Orcamento | **calculates** | financeiro.CMVProjetado |
| compras.Orcamento | **queries** | suprimentos.Fornecedor |
| compras.Orcamento | **queries** | ingrediente.Ingrediente |
| estoque.Movimentacao | **produces** | financeiro.Transacao |
| estoque.Movimentacao | **calculates** | financeiro.CustoMedioPonderado |
| edge.calcularCardapioUAN | **queries** | compras.Orcamento |

## System Discovery Hub (Knowledge Orphans)

Esta seção garante que documentos de descoberta e rascunhos de arquitetura sejam mapeados no grafo de conhecimento.

| Category | Document | Description |
|---|---|---|
| Strategy | [[shared/discovery/project-overview|Project Overview]] | Visão geral do ecossistema e escopo. |
| Strategy | [[shared/discovery/initial-definitions|Definições Iniciais]] | Premissas básicas do projeto. |
| Strategy | [[shared/glossary|Glossário de Domínio]] | Termos técnicos e definições de negócio. |
| Strategy | [[governanca/tenancy-mapping|Mapeamento de Multi-tenancy]] | Estrutura de isolamento de dados por unidade. |
| Research | [[shared/discovery/HYPOTHESES|Hipóteses de Trabalho]] | Suposições validadas durante o desenvolvimento. |
| Research | [[shared/discovery/EXPERIMENT-CANDIDATES|Candidatos a Experimento]] | Ideias para testes A/B ou novas tecnologias. |
| Architecture | [[shared/discovery/infraestrutura.ambientes|Guia de Ambientes]] | Configurações de dev/staging/prod. |
| Architecture | [[shared/discovery/sistema.taxonomy|Taxonomia do Sistema]] | Regras de nomenclatura e classificação. |
| Architecture | [[shared/discovery/sistema.map.relatorios|Mapa de Relatórios]] | Inventário de outputs do sistema. |
| Architecture | [[shared/adr-log|Log de ADRs]] | Registro de decisões arquiteturais significativas. |
| Architecture | [[shared/spec-architecture|Arquitetura de Especificação]] | Padrões de documentação e desenvolvimento. |
| Gaps | [[shared/discovery/GOVERNANCE-GAPS|Gaps de Governança]] | Débito técnico em processos regulatórios. |
| Gaps | [[shared/discovery/ontology-gaps|Gaps de Ontologia]] | Inconsistências identificadas no modelo de dados. |
| UAN Research | [[features/uan/discovery/research/seguranca_alimentar_uan|Segurança Alimentar]] | GxP, APPCC e RDC 216 em UAN. |
| UAN Research | [[features/uan/discovery/research/fluxograma_operacional_uan|Fluxograma Operacional]] | Engenharia de processos e layout. |
| UAN Research | [[features/uan/discovery/research/modelo_matematico_planejamento|Modelo Matemático]] | Otimização de cardápio e restrições. |
| UAN Research | [[features/uan/discovery/research/planejamento_cardapios_ia|Planejamento IA]] | Heurísticas e automação de ciclos. |
| UAN Research | [[features/uan/discovery/research/mapeamento_cargos_uan|Mapeamento de Cargos]] | Dimensionamento de equipe técnica. |
| UAN Research | [[features/uan/discovery/research/saas_uan_fichas_tecnicas|SaaS UAN Spec]] | Requisitos de software para operação. |
| UAN Research | [[features/uan/discovery/research/legislacao_nutricional_automacao|Legislação Nutricional]] | Conformidade em cardápios automatizados. |
| UAN Research | [[features/uan/discovery/research/gestao_estoque_fornecedores_uan|Gestão de Suprimentos]] | Relação com fornecedores em UAN. |
| UAN Research | [[features/uan/discovery/research/engenharia_cardapios_uan|Engenharia de Cardápios]] | Estratégia de mix e aceitação. |
| UAN Research | [[features/uan/discovery/research/indicadores_desperdicio_uan|Desperdício (Vigie)]] | Monitoramento de sobras e perdas. |
| UAN Research | [[features/uan/discovery/research/otimizacao_cardapios_uan|Otimização UAN]] | Benchmarking de técnicas de otimização. |
| UAN Research | [[features/uan/discovery/research/otimizacao_cardapios_restricoes|Restrições Matemáticas]] | Detalhamento de solver e constraints. |
| UAN Research | [[features/uan/discovery/research/inovacao_tecnologica_uan|Inovação Tecnológica]] | Futuro das operações de A&B. |
| Materiais | [[spec-taxonomia-materiais]] | Gestão de itens não-comestíveis. |
