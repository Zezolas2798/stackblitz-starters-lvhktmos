# Feature Spec: Equipamentos

## Feature Concept Graph

| Concept | Nature | Responsibility |
| :--- | :--- | :--- |
| `equipamentos.Hierarquia` | Structure | Organização via `parent_id` (Self-referencing). |
| `equipamentos.Termometria` | Service | Gatilho para aferições obrigatórias (RDC 216). |
| `equipamentos.AlertaPCC` | Trigger | Notificação de falha quando a temperatura excede o ideal. |

## Cross-Feature Dependencies

| Dependency | Direction | Reason |
| :--- | :--- | :--- |
| `estoque` | Downstream | Vincula locais de armazenamento a equipamentos refrigerados. |
| `qualidade` | Downstream | Alimenta os checklists de APPCC com a lista de equipamentos. |
| `suprimentos` | Upstream | Fornece dados de Prestadores de Serviço para manutenção. |

## Feature Constraints

- **Gatilho de Temperatura:** Equipamentos sob o grupo `"Temperaturas"` são obrigatórios para aferição no APPCC.
- **Isolamento de Unidade:** Aferições e equipamentos são estritamente vinculados à `unidade_id`.
- **Zero Trust:** Acesso validado via RLS (Row Level Security).

## Related Discovery Documents
- [[features/equipamentos/discovery/equipamentos]]
