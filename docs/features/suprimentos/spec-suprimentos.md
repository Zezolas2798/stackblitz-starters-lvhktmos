---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-architecture]]
---

# Feature Spec: Suprimentos


## Feature Concept Graph

| Concept | Nature | Responsibility |
| :--- | :--- | :--- |
| `suprimentos.Cadastro` | Interface | Integração com Brasil API para captura de CNPJ. |
| `suprimentos.GED_Automation` | Trigger | Geração automática de placeholders de documentos. |
| `suprimentos.Taxonomia_Portfolio` | Service | Vinculação do fornecedor a categorias de compra. |

## Cross-Feature Dependencies

| Dependency | Direction | Reason |
| :--- | :--- | :--- |
| `taxonomia-materiais` | Upstream | Define as categorias que disparam obrigatoriedade documental. |
| `compras` | Downstream | Consome o status de homologação para permitir pedidos. |
| `estoque` | Downstream | Registra a origem (Fornecedor) na entrada de lotes. |

## Feature Constraints

- **Integridade de CNPJ:** O CNPJ deve ser único por tenant (cliente_id).
- **GED Mandatório:** Não é possível mover para `HOMOLOGADO` sem que todos os placeholders obrigatórios tenham arquivos válidos.
- **Isolamento RLS:** Garantir que fornecedores de um tenant não sejam visíveis para outros.

## Related Discovery Documents
- [[features/suprimentos/discovery/suprimentos.fornecedores]]
- [[features/suprimentos/discovery/servicos.prestadores]]
