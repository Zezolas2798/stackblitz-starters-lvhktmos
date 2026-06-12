---
tags:
  - feature/taxonomia-materiais
feature: taxonomia-materiais
aspect: operations
status: brownfield-translated
evidence: observed + planned
---

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-taxonomia-materiais]]

---

# Operations: Taxonomia de Materiais

## CadastrarMaterial

**Type:** Operation (mutation)
**Actor:** Authenticated User (Nutricionista, Gestor UAN)
**Triggers:** Clique em "Salvar" no `QuickMaterialDialog` ou na página de cadastro de materiais

### Input

| Field | Type | Required | Description |
|---|---|---|---|
| `nome` | string | yes | Nome do material |
| `marca` | string | no | Marca do fabricante |
| `tipo_material` | string | yes | Discriminador de modalidade — determina o schema de validação |
| `grupo_id` | UUID | no | FK → `grupos_produto` filtrado por modalidade |
| `especificacoes` | object | conditional | Dados específicos da modalidade — validados pelo Zod schema correspondente |

### Rules

| ID | Rule | Formal |
|---|---|---|
| R1 | Nome é obrigatório e não pode ser vazio | `nome.trim().length > 0` |
| R2 | O schema de validação é selecionado por `tipo_material` | `getSchemaForModalidade(tipo_material).parse(especificacoes)` |
| R3 | Se `tipo_material = 'EPI_EPC'`, `numero_ca` e `validade_ca` são obrigatórios | `tipo_material === 'EPI_EPC' → especificacoes.numero_ca && especificacoes.validade_ca` |
| R4 | Se `tipo_material = 'LIMPEZA'`, `registro_anvisa_ms` é obrigatório | `tipo_material === 'LIMPEZA' → especificacoes.registro_anvisa_ms` |
| R5 | Se `tipo_material = 'EMBALAGEM'`, `apropriado_alimentos` e `certificado_contato_alimentos` são obrigatórios | `tipo_material === 'EMBALAGEM' → especificacoes.apropriado_alimentos != null && especificacoes.certificado_contato_alimentos` |
| R6 | Grupo selecionado deve pertencer à modalidade correta | `grupo.modalidade === modalidadeFromTipoMaterial(tipo_material)` |

### Postconditions

- Registro inserido em `public.materiais` com `especificacoes_adicionais` populado como JSONB válido
- `tipo_material` persistido conforme mapeamento `TipoMaterialMap`
- `grupo_id` vinculado corretamente (se fornecido)

### Error States

| Condition | Result |
|---|---|
| Validação Zod falha | Toast com mensagem de campo(s) inválido(s). Formulário não é submetido |
| `nome` vazio | Campo marcado com erro "Nome é obrigatório" |
| Erro de rede no insert | Toast "Erro ao salvar material" + log no console |

---

## AtualizarEspecificacoes

**Type:** Operation (mutation)
**Actor:** Authenticated User
**Triggers:** Edição de material existente (futuro — não implementado nesta iteração)

### Input

| Field | Type | Required | Description |
|---|---|---|---|
| `material_id` | UUID | yes | ID do material a atualizar |
| `especificacoes` | object | yes | Novo payload de especificações — deve passar pelo Zod schema da modalidade |

### Rules

| ID | Rule | Formal |
|---|---|---|
| R1 | Material deve existir e pertencer ao tenant | `material.cliente_id === current_user.cliente_id` |
| R2 | `tipo_material` não pode mudar | `tipo_material` is read-only after creation |
| R3 | Schema de validação é determinado pelo `tipo_material` existente | `getSchemaForModalidade(material.tipo_material).parse(especificacoes)` |

### Postconditions

- `materiais.especificacoes_adicionais` atualizado com JSONB validado
- `updated_at` atualizado

### Error States

| Condition | Result |
|---|---|
| Material não encontrado | Error 404 |
| Validação Zod falha | Error 422 com detalhes dos campos |
| Tentativa de mudar `tipo_material` | Error 400 "Tipo de material não pode ser alterado" |
