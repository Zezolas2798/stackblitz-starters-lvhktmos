---
id: sistema.taxonomy
titulo: "Taxonomia de Meta-Conceitos"
tipo: taxonomy
status: auditado
ultima_revisao: 2026-04-15
tags:
  - sistema/taxonomia
  - sistema/meta-modelo
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[../../registry|Global Registry]]

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-architecture]]

---



# Taxonomia de Meta-Conceitos

> Os blocos fundamentais para descrever o domínio do sistema. Cada conceito no [[registry]] mapeia para exatamente um desses tipos.

## Visão Geral

| Categoria | Meta-Conceito | Propósito |
|---|---|---|
| **Estrutural** | Entity | Objetos com identidade e lifecycle (Ingrediente, Receita) |
| | Value Object | Conceitos sem identidade, definidos por seus valores (InfoNutricional, Alergênico) |
| | Enum / Type | Conjuntos finitos de estados ou categorias (TipoIngrediente, StatusReceita) |
| **Comportamental** | Calculation | Deriva valor a partir de inputs (Cálculo Nutricional, Lupa) |
| | Rule | Constraint que bloqueia uma ação (Omissão de Lactose, Anti-Duplicidade) |
| | Policy | Lógica de decisão que escolhe comportamento (Override Nutricional, Transgênico Contextual) |
| **Conectivo** | Interface | Boundary de API — Edge Functions, módulos internos |
| | Mapping | Transformação de dados entre shapes (DB → Rótulo) |
| **Regulatório** | Legislação | Norma legal que regula o comportamento do sistema |
| | Fonte Legal | Texto original da legislação (DOU) |
| **Lifecycle** | State Machine | Estados + transições + guards (StatusOP, StatusReceita) |

---

## Decisão Rápida: Qual Meta-Tipo Usar?

| Se está descrevendo... | É um(a)... | Documente em... |
|---|---|---|
| Uma coisa com ID e histórico | Entity | [[features/ingredientes/discovery/ingredientes]], [[features/industria/discovery/fichas_tecnicas_industrial]], [[features/industria/discovery/producao]] |
| Uma coisa definida por seus valores, sem ID | Value Object | Dentro do doc da Entity que contém |
| Um conjunto fixo de opções | Enum / Type | [[registry]] |
| Uma fórmula que computa um valor | Calculation | [[registry]] + doc do módulo |
| Uma condição que bloqueia uma ação | Rule | [[registry]] + doc do módulo |
| Uma estratégia que escolhe comportamento | Policy | [[registry]] + doc do módulo |
| Um boundary onde dados cruzam | Interface | [[registry]] |
| Uma conversão de shape | Mapping | [[registry]] |
| Uma norma legal | Legislação | `legislacao/` |
| O texto original de uma lei | Fonte Legal | `legislacao/fontes/` |
| Como algo se move entre estados | State Machine | Doc do módulo |

---

## Adaptações ao Domínio Food Tech

### Meta-Conceito: Legislação (Exclusivo deste sistema)

Diferente do DomainSpec genérico, nosso domínio tem uma camada regulatória obrigatória. A legislação não é apenas documentação — ela é um **ator ativo** que impõe constraints ao sistema.

**Hierarquia:**

```
Fonte Legal (texto original do DOU)
  └── Especificação de Engenharia (tradução para requisitos)
        └── Rule/Policy/Calculation (implementação no código)
```

### O Grupo como Âncora de Regras

No domínio UAN, os **Grupos de Produto** deixaram de ser apenas categorias estruturais para se tornarem âncoras funcionais para o meta-conceito de **Rule**. 

- **Ação:** O sistema utiliza o `grupo_id` para disparar constraints de monotonia e frequência.
- **Vantagem:** A taxonomia de estoque (estoque.suprimentos) agora governa a segurança e variedade nutricional (uan.cardapios) sem necessidade de re-classificação manual de pratos.

**Edge types regulatórios:**

| Edge | De → Para | Significado |
|---|---|---|
| `interpreta` | Spec → Fonte | A spec traduz o texto legal |
| `regula` | Legislação → Função de código | A lei impõe comportamento |
| `referenciada_por` | Legislação → Hub | O hub agrega a legislação |

---

## Confusões Comuns

| Conceito A | vs. | Conceito B | Como diferenciar |
|---|---|---|---|
| Rule | vs. | Policy | Rules **bloqueiam** (sim/não). Policies **escolhem** (qual estratégia). |
| Entity | vs. | Value Object | Entities têm **IDs**. Value Objects são iguais por **campos**. |
| Calculation | vs. | Rule | Calculations **produzem valores**. Rules **checam condições**. |
| Legislação | vs. | Fonte Legal | Legislação é a **spec de engenharia**. Fonte é o **texto original**. |
