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

> Índice global de todos os conceitos de domínio do sistema. Cada conceito mapeia para exatamente um dos meta-tipos definidos em [[sistema.taxonomy]].


---

## Entidades

| ID | Conceito | Módulo | State Machine | Descrição |
|---|---|---|---|---|
| ingrediente.Ingrediente | Ingrediente | [[ingredientes]] | — | Insumo primário, composto ou aditivo com rastreabilidade nutricional |
| ingrediente.GrupoIngrediente | Grupo de Ingrediente | [[ingredientes]] | — | Classificação hierárquica para estoque/categoria |
| receita.Receita | Receita / Ficha Técnica | [[fichas_tecnicas_industrial]] | StatusReceita | Formulação industrial com rotulagem GxP |
| uan.FichaTecnicaUAN | Ficha Técnica UAN | [[fichas_tecnicas_uan]] | — | Receituário operacional para refeitórios com custo per capita |
| uan.CardapioUAN | Cardápio UAN | [[uan.cardapios]] | StatusCardapio | Ciclo mensal de planejamento alimentar com comensais variáveis |
| uan.ListaCompraUAN | Lista de Compras UAN | [[uan.lista_compras]] | StatusListaCompra | Snapshot calculado da necessidade de compra do ciclo |
| producao.OrdemProducao | Ordem de Produção | [[producao]] | StatusOP | Documento mestre de execução de produção |
| producao.SetorProducao | Setor de Produção | [[producao]] | — | Divisão física/lógica da fábrica |
| estoque.Lote | Lote de Estoque | [[estoque.lotes]] | StatusLote | Unidade fundamental de rastreabilidade com validade e saldo |
| estoque.Movimentacao | Movimentação | [[estoque.movimentacoes]] | — | Registro imutável de fluxo de estoque (Entrada, Saída, etc) |
| estoque.Inventario | Inventário | [[estoque.inventarios]] | StatusInventario | Sessão de auditoria física para reconciliação de saldos |
| estoque.Recebimento | Recebimento | [[estoque.recebimento]] | — | Protocolo de check-in físico e fiscal de mercadorias |

---

## Value Objects

| ID | Conceito | Módulo | Descrição |
|---|---|---|---|
| ingrediente.Alergenico | Alergênico | [[ingredientes]] | Propriedade sanitária vinculada à ANVISA |
| ingrediente.InfoNutricional | Informação Nutricional | [[ingredientes]] | Matriz de macros e micronutrientes por 100g |
| receita.Composicao | Composição | [[fichas_tecnicas_industrial]] | Relação NxN receita↔ingrediente com FC e IC |
| receita.Material | Material/Embalagem | [[fichas_tecnicas_industrial]] | Insumo não-comestível para custo |
| rotulagem.ResultadoCalculo | Resultado de Cálculo | [[GERENCIAMENTO_ROTULAGEM_E_PRODUTO]] | Objeto retornado pela Edge Function |
| uan.ComposicaoFichaUAN | Composição UAN | [[fichas_tecnicas_uan]] | Relação NxN ficha↔ingrediente com PB, PL, FC e IC (sem vínculo com rótulo) |
| uan.CardapioDiaUAN | Grade UAN | [[uan.cardapios]] | Alocação unitária: data × refeição × ficha técnica com fator_multiplicador |
| estoque.Local | Local de Estoque | [[estoque_locais]] | Endereço físico de armazenamento (Ex: Câmara, Prateleira) |

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
| estoque.CalculoValidade | Motor de Validade | [[estoque.lotes]] | Cruzamento: `MIN(Fabricante, Após Aberto, Lei Sanitária)` |
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
| [[RDC_727_2022]] | **enforces** | processarDeclaracoes() |
| [[RDC_727_2022]] | **supersedes** | [[fontes/RDC_26_Original]] |
| [[Decreto_4680_2003]] | **enforces** | gerarListaDeIngredientes() |
| [[RDC_429_2020_IN_75_2020]] | **enforces** | calculateLupas() |
| [[RDC_429_2020_IN_75_2020]] | **refines** | [[fontes/IN_75_Original]] |
| [[Lei_10674_2003]] | **enforces** | processarDeclaracoes() |
| receita.Receita | **emite** | ReceitaAprovada (Event) |
| producao.OrdemProducao | **queries** | receita.Receita |
| producao.OrdemProducao | **queries** | ingrediente.Ingrediente |
| [[Guia_Validacao_Sistemas_ANVISA_Original]] | **enforces** | [[sistema.guia.validacao]] |
| [[sistema.guia.validacao]] | **regula** | Todas as Operações GxP |
| [[sistema.registry]] | **derives-from** | [[CONSTITUTION]] |
| uan.FichaTecnicaUAN | **contains** | uan.ComposicaoFichaUAN |
| uan.ComposicaoFichaUAN | **queries** | ingrediente.Ingrediente |
| uan.ComposicaoFichaUAN | **queries** | ingrediente.ReferenciaNutricional (opcional) |
| uan.CardapioUAN | **contains** | uan.CardapioDiaUAN |
| uan.CardapioDiaUAN | **queries** | uan.FichaTecnicaUAN |
| uan.CardapioUAN | **produces** | uan.ListaCompraUAN |
| edge.calcularCardapioUAN | **queries** | uan.CardapioUAN |
| edge.calcularCardapioUAN | **queries** | uan.CardapioDiaUAN |
| edge.calcularCardapioUAN | **queries** | uan.FichaTecnicaUAN |
| edge.calcularCardapioUAN | **queries** | uan.ComposicaoFichaUAN |
| edge.calcularCardapioUAN | **queries** | ingrediente.Ingrediente |
| edge.calcularCardapioUAN | **produces** | uan.ListaCompraUAN |
| uan.PoliticaResolucaoComensais | **applies** | edge.calcularCardapioUAN |
| uan.PoliticaCategoriaFiltrada | **applies** | uan.FichaTecnicaUAN (formulário) |
| uan.RegraAntiFantasma | **enforces** | handleSalvar (Fichas UAN) |
| edge.calcularCardapioUAN | **derives-from** | edge.calcularNutrientes |


