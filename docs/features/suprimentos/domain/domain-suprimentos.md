---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-suprimentos]]

---

# Domain: Suprimentos

Responsável pela gestão de fornecedores, prestadores de serviço e conformidade documental (homologação).

## Concept Registry

| ID | Name | Type | Description |
| :--- | :--- | :--- | :--- |
| `suprimentos.Fornecedor` | Fornecedor | Entity | Entidade que provê insumos (ingredientes/materiais). |
| `suprimentos.PrestadorServico` | Prestador de Serviço | Entity | Entidade que provê serviços técnicos (manutenção, auditoria). |
| `suprimentos.DocumentoCompliance` | Documento de Compliance | Value Object | Registro documental exigido para homologação (ex: Alvará). |
| `suprimentos.Homologacao` | Homologação | Operation | Processo de validação de um fornecedor para operações. |

## Relationships

- `suprimentos.Fornecedor` **provides** `ingredientes.Ingrediente`
- `suprimentos.Fornecedor` **provides** `estoque.Lote`
- `suprimentos.Fornecedor` **enforces** `suprimentos.DocumentoCompliance`
- `suprimentos.Homologacao` **updates** `suprimentos.Fornecedor` (Status)

## States: suprimentos.Fornecedor

- `PENDENTE`: Cadastro inicial, aguardando documentos.
- `HOMOLOGADO`: Aprovado para compras e recebimento.
- `REJEITADO`: Bloqueado por falta de conformidade.
- `SUSPENSO`: Temporariamente inativo.
