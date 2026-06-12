---
tags:
  - feature/ingredientes
feature: ingredientes
aspect: ui-architecture
status: drafted
created: 2026-05-10
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-ingredientes]]

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-ingredientes]]

---



# UI Architecture — Ingredientes

> Documentação das decisões de interface, acessibilidade e gestão de estado no frontend.

## Component Tree

```
app/ingredientes/page.tsx (Listagem)
├── Page Header (Breadcrumb, Search, Actions)
└── Data Table
    ├── Row (Ingrediente)
    │   ├── Chips de Status (Incompleto/Transgênico)
    │   └── Ações (Editar, Excluir)
    └── Pagination

app/ingredientes/[id]/editar/page.tsx (Editor)
├── Header (Voltar, Título Contextual)
├── Tabs (Gerais vs Nutricional)
└── Form Container
    ├── Grid Layout
    │   ├── Autocomplete Científico (TACO/TBCA)
    │   ├── Alergênicos (Autocomplete Múltiplo + Checks de Contato)
    │   └── Transgênicos (Dynamic Fields)
    └── NutrientInput (Componente Padronizado)

components/QuickIngredienteDialog.tsx (Injected)
└── Modal Dialog
    ├── Formulário Compacto
    └── Feedback de Redirecionamento (Material vs Ingrediente)
```

## State Management

1. **Local State (`useState`)**: Utilizado predominantemente. O formulário inteiro de edição é mantido em um grande objeto de estado (`formData`).
2. **Context API (`useClient`)**: Usado estritamente para obter o `activeClientId` e as propriedades do tenant selecionado.
3. **Data Fetching**: Gerenciado via `useEffect` no mount do componente (sem `react-query` ou `swr` até o momento).

## Accessibility (A11y) Gaps

| Element | Issue | Severity |
|---|---|---|
| Nutrient Inputs | Não possuem `aria-label` descritivo associando o campo à unidade de medida para screen readers | Medium |
| Accordions (Nutrientes) | Navegação por teclado é possível, mas o contraste de foco no Material UI não foi customizado para alta visibilidade | Low |
| Delete Confirmation | O uso de `window.confirm` bloqueia a thread e não é estilizado ou acessível via leitores de tela padrão de forma consistente | Medium |

## Design Tokens

- **Cores Semânticas**:
  - Incompleto: `warning.main` (Laranja)
  - Transgênico: `error.main` (Vermelho)
  - Classificação NOVA: Cores hardcoded (ex: `#4CAF50` para G1). *Recomendação: migrar para theme tokens.*
- **Layout**: Uso massivo de `Grid` do MUI (sistema de 12 colunas) e `Stack` para flexbox.
