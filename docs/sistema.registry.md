---
id: sistema.registry
titulo: "Concept Registry — Índice Global de Conceitos"
tipo: registry
status: consolidated
layer: ontology
nature: reference
veracidade: high
convicção: high
version: 1.1.0
last_updated: 2026-04-15
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
| uan.FichaTecnicaUAN | Ficha Técnica UAN | [[fichas_tecnicas_uan]] | — | Receituário operacional para refeitórios |
| producao.OrdemProducao | Ordem de Produção | [[producao]] | StatusOP | Documento mestre de execução de produção |
| producao.SetorProducao | Setor de Produção | [[producao]] | — | Divisão física/lógica da fábrica |

---

## Value Objects

| ID | Conceito | Módulo | Descrição |
|---|---|---|---|
| ingrediente.Alergenico | Alergênico | [[ingredientes]] | Propriedade sanitária vinculada à ANVISA |
| ingrediente.InfoNutricional | Informação Nutricional | [[ingredientes]] | Matriz de macros e micronutrientes por 100g |
| receita.Composicao | Composição | [[fichas_tecnicas_industrial]] | Relação NxN receita↔ingrediente com FC e IC |
| receita.Material | Material/Embalagem | [[fichas_tecnicas_industrial]] | Insumo não-comestível para custo |
| rotulagem.ResultadoCalculo | Resultado de Cálculo | [[GERENCIAMENTO_ROTULAGEM_E_PRODUTO]] | Objeto retornado pela Edge Function |

---

## Enums / Types

| ID | Conceito | Valores | Descrição |
|---|---|---|---|
| ingrediente.TipoIngrediente | TipoIngrediente | `SIMPLES`, `COMPOSTO`, `ADITIVO` | Classificação que determina comportamento na rotulagem |
| receita.StatusReceita | StatusReceita | `RASCUNHO`, `EM_ANALISE`, `APROVADO`, `OBSOLETO` | Lifecycle da ficha técnica |
| producao.StatusOP | StatusOP | `PENDENTE`, `EM_PREPARO`, `FINALIZADA`, `CANCELADA` | Estado da ordem de produção |
| receita.LayoutTabela | LayoutTabela | `VERTICAL`, `HORIZONTAL`, `LINEAR` | Formato da tabela nutricional |
| receita.EstadoAlimento | EstadoAlimento | `solido`, `liquido` | Impacta limites da Lupa FOP (lowercase string) |

---

## Calculations

| ID | Conceito | Usado Por | Fórmula / Descrição |
|---|---|---|---|
| rotulagem.CalculoNutricional | Cálculo Nutricional | calcular-nutrientes | Soma ponderada de macros por peso líquido na composição |
| rotulagem.CalculoLupa | Cálculo de Lupa FOP | calcular-nutrientes | Compara açúcar/sódio/gordura com limites IN 75 |
| rotulagem.CalculoPorcao | Cálculo de Porção | calcular-nutrientes | Harmonização Art. 8/10 RDC 429 |
| rotulagem.FormatarValue | Formatação de Valor | calcular-nutrientes | Arredondamento Anexo III IN 75 |
| receita.CalculoCusto | Cálculo de Custo | Frontend | `(Peso Líquido / Peso Unitário) × Preço` |

---

## Rules

| ID | Conceito | Enforces | Expressão |
|---|---|---|---|
| ingrediente.RegraLactoseOmissao | Omissão de Lactose | processarDeclaracoes | `SE alergenico("Leite") E lactose_g IS NULL → "CONTÉM LACTOSE"` |
| ingrediente.RegraGMOAditivo | Limpeza GMO Aditivo | handleSalvar | `SE tipo === 'ADITIVO' → limpar todos os campos GMO` |
| receita.RegraDuplicidadeRisco | Anti-Duplicidade de Risco | Aba Riscos | `SE alérgeno é nativo → bloquear como risco cruzado` |
| receita.RegraAprovacaoFantasma | Bloqueio de Aprovação | ReceitaHeader | `SE rascunho === último snapshot → bloquear botão` |

---

## Policies

| ID | Conceito | Aplica-se a | Lógica |
|---|---|---|---|
| ingrediente.PoliticaTransgenico | Política de Transgênico | gerarListaDeIngredientes | Contextual por tipo: SIMPLES=sufixo, COMPOSTO=sem alteração, ADITIVO=ignorar |
| ingrediente.PoliticaOverride | Override Nutricional | calcular-nutrientes | Se `referencia_id` presente → sobrescrever macros; manter alergênicos do original |
| sistema.PoliticaMultiTenant | Multi-Tenant | Todas as queries | `(cliente_id = tenant) OR (cliente_id IS NULL)` |

---

## Interfaces (Edge Functions)

| ID | Conceito | Tipo | Expõe |
|---|---|---|---|
| edge.calcularNutrientes | calcular-nutrientes | Edge Function (Deno) | Cálculo nutricional, Lupas, Lista de Ingredientes, Declarações |
| edge.aprovarReceita | aprovar-receita | Edge Function (Deno) | Aprovação de versão com snapshot |

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

