---
id: ontology-gaps
title: "Ontology Gaps — Brownfield Translation"
type: ontology-gaps
status: active
created: 2026-05-10
feature-scope: ingredientes
---
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-architecture]]
---




# Ontology Gaps

> Inconsistências terminológicas e conceituais identificadas durante a brownfield translation.

## Duplicate Terms

### ONT-001 — `fonte` vs `marca` (ingrediente origin)

| Aspect | Detail |
|---|---|
| **Term A** | `fonte` — campo no banco de dados (`ingredientes.fonte`) |
| **Term B** | `marca` — label no QuickIngredienteDialog ("Marca / Fonte") |
| **Resolution** | São o mesmo conceito. O banco de dados já utiliza a coluna `marca` nativamente. Vamos padronizar utilizando **exclusivamente `marca`** em todo o sistema e na interface, descontinuando o termo `fonte`. |

### ONT-002 — `grupo_id` vs `grupo_estoque_id` vs `categoria_produto_id`

| Aspect | Detail |
|---|---|
| **Term A** | `grupo_id` — usado no QuickIngredienteDialog |
| **Term B** | `grupo_estoque_id` — citado no doc `ingredientes.md` |
| **Term C** | `categoria_produto_id` — citado no doc `ingredientes.md` |
| **Resolution** | Estes campos representam uma taxonomia hierárquica. O sistema usa `grupo_id` e `subgrupo_id` na tabela `ingredientes` para formar a estrutura em árvore das categorias de estoque e compras, onde cada nível possui significado específico. |
| **Status** | 🟢 **Resolved** |

## Overloaded Terms

### ONT-003 — `Ingrediente` como conceito duplo

| Aspect | Detail |
|---|---|
| **Meaning A** | Insumo alimentar (tabela `ingredientes`) — usado em receitas e fichas técnicas |
| **Meaning B** | Material genérico (QuickIngredienteDialog suporta EMBALAGENS, LIMPEZA, etc.) — redireciona para tabela `materiais` |
| **Impact** | O QuickIngredienteDialog é um ponto de criação para dois tipos de entidade diferentes (ingredientes vs materiais), o que pode causar confusão |
| **Resolution** | Considerar renomear o dialog para `QuickItemDialog` ou separar os fluxos |

## Missing Definitions

### ONT-004 — `classificacao_nova` sem presença no registry

| Aspect | Detail |
|---|---|
| **Term** | `classificacao_nova` (escala NOVA 1-4 do USP/Nupens) |
| **Issue** | Presente no código mas ausente do `sistema.registry.md` |
| **Resolution** | Adicionado ao UI (`QuickIngredienteDialog`) como campo de cadastro obrigatório para alimentos e registrado como Enum. |
| **Status** | 🟢 **Resolved** |

### ONT-005 — `contem_gluten` sem regra formal

| Aspect | Detail |
|---|---|
| **Term** | `contem_gluten` (checkbox no formulário) |
| **Issue** | Existe como campo, mas precisa de adequação legal na interface. |
| **Legislation** | Lei 10674/2003 — Exige declaração explícita de presença ou ausência de glúten ("CONTÉM GLÚTEN" / "NÃO CONTÉM GLÚTEN"). |
| **Resolution** | A interface do `QuickIngredienteDialog` foi atualizada para explicitar a regra da Lei 10674/2003 e garantir o preenchimento explícito da declaração. |
| **Status** | 🟢 **Resolved** |

---

## Summary

## Summary

| Category | Count |
|---|---|
| Duplicate Terms | 2 (Resolved) |
| Overloaded Terms | 1 (Resolved) |
| Missing Definitions | 2 (Resolved) |
| **Total** | **5** |
