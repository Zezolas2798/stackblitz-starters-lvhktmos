---
tags: [ontology, governance, tenancy]
node_type: discovery
layer: ontology
nature: reference
status: exploratory
veracidade: high
convicção: high
version: 1.0.0
last_updated: 2026-04-19
---

# Master Data Ownership & Multi-Tenancy Mapping (Exploratory)

> Este documento mapeia rigorosamente todos os módulos do sistema para definir como a informação é segregada entre a **Matriz (Cliente/Tenant)** e as **Unidades (Filiais/Branches)**.

---

## 1. Core Principles of Ownership

1.  **Inheritance (Herança)**: A Unidade herda definições da Matriz (ex: Fichas Técnicas), mas não as altera diretamente.
2.  **Allocation (Alocação)**: Entidades globais (ex: Funcionários) são atribuídas a contextos locais (unidade).
3.  **Strict Isolation (Isolamento Estrito)**: Dados transacionais (ex: Estoque, Auditoria) e de infraestrutura operacional (ex: Equipamentos, Setores) de uma Unidade nunca são visíveis para outra, exceto em relatórios consolidados no nível Matriz.
4.  **Database-Layer Enforcement (RLS)**: O isolamento não é apenas lógico no código, mas físico no banco de dados via Supabase RLS.

---

## 2. Global Module Mapping

| Módulo | Entidade / Função | Escopo (Ownership) | Lógica de Negócio |
| :--- | :--- | :--- | :--- |
| **Pessoas/Acesso** | Perfis (Profiles) | **Matrix (Global)** | Cadastro único do CPF/Usuário na empresa. (`profiles`) |
| | Alocação (Memberships) | **Unit (Local)** | Define em quais unidades o usuário atua. (`app_user_memberships`) |
| | Cargos (Roles) | **Matrix (Global)** | Níveis de permissão padronizados. (`app_roles`) |
| **Ingredientes** | Catálogo | **Matrix (Shared)** | Nome, Alérgenos, Info Nutricional. (`ingredientes`) |
| | Estoque (Lotes) | **Unit (Unique)** | Quantidade física, validade real. (`estoque_lotes`) |
| | Grupos | **Matrix (Shared)** | Categorias (Secos, Resfriados). (`ingredientes_grupos`) |
| **Industrial / P&D**| Fichas Técnicas | **Matrix (Shared)** | Formulação canônica, rótulo padrão. (`receitas`, `composicao_receitas`) |
| | Ordens de Produção | **Unit (Unique)** | Execução física da receita. (`producao_ordens`, `producao_apontamentos`) |
| **UAN (Refeitórios)**| Fichas UAN | **Matrix (Shared)** | Receituário base. (`fichas_tecnicas_uan`) |
| | Ciclo/Cardápio | **Unit (Unique)** | Planejamento mensal da unidade. (`cardapios_uan`, `cardapio_dias_uan`) |
| **Qualidade** | Modelos (Checklists) | **Matrix (Shared)** | Templates padronizados. (`checklist_modelos`, `checklist_secoes`, `checklist_itens`) |
| | Auditorias Realizadas | **Unit (Unique)** | Inspeção feita na unidade. (`checklist_auditorias`, `checklist_respostas`) |
| | Ações Corretivas | **Unit (Unique)** | Desvios encontrados localmente. (`acoes_corretivas`) |
| **Ativos/IoT** | Config. Equipamento | **Unit (Unique)** | Instância física e metas termais. (`equipamentos_config`) |
| | Logs de Temperatura | **Unit (Unique)** | Histórico de aferições APPCC. (`controle_temperatura`) |
| | Setores/Locais | **Unit (Unique)** | Depósitos, Prateleiras, Câmaras. (`estoque_locais`, `setores_producao`) |
| **Compras** | Orçamentos | **Unit (Unique)** | Cotações locais. (`compras_orcamentos`) |
| | Fornecedores | **Matrix (Shared)** | Cadastro homologado. (`fornecedores`) |
| **Financeiro** | Contas/Caixas | **Unit (Unique)** | Saldo e movimentação local. (`fin_contas`) |
| | Conciliação | **Unit (Unique)** | Vendas e despesas locais. (`fin_transacoes`, `fin_vendas`) |


---

## 3. Function & Service Mapping (Operations)

| Função (Edge Function) | Escopo de Execução | Contexto Necessário |
| :--- | :--- | :--- |
| `calcular-nutrientes` | **Global/Shared** | Receita ID (Lógica agnóstica de unidade). |
| `aprovar-receita` | **Global/Shared** | Snapshot da matriz. |
| `gerar-demanda-compras`| **Local/Unit** | Cardápio Unidade + Estoque Unidade. |
| `fechar-inventario` | **Local/Unit** | Unidade ID + Setores Locais. |
| `notificar-desvio` | **Híbrido** | Alerta local para o gerente, alerta global para o proprietário. |

---

## 4. Open Questions & Edge Cases

- **Customização de Ficha**: Uma unidade pode alterar uma ficha da matriz (ex: trocar marca de ingrediente)?
    - *Proposta*: Não. Deve ser criada uma "Variação" ou "Substituição Homologada".
- **Transferência entre Unidades**: Como o estoque flui de uma unidade para outra?
    - *Requer*: Operação de "Transferência" (Saída Unit A -> Entrada Unit B).
- **Visibilidade de Consultor**: O consultor vê o financeiro de todas as unidades ou apenas a qualidade?
    - *Solução*: RBAC (Permissions) filtrado por Escopo de Alocação.

---

## 5. Next Steps (Audit Phase)

1.  Validar este mapeamento com as tabelas reais em `database.types.ts`.
2.  Garantir que todas as tabelas marcadas como **Unit (Unique)** possuam a coluna `unidade_id`.
3.  **Harden RLS (Completed 2026-04-19)**: Políticas ativadas para `setores_producao`, `equipamentos_config` e `controle_temperatura`.
4.  **Inventory Hardening (Completed 2026-04-20)**: Implementado isolamento de unidade para `estoque_lotes`, `estoque_movimentacoes`, `estoque_inventarios` e `estoque_locais`.

---

## 6. RLS Implementation (Zero Trust Security)

As tabelas de infraestrutura operacional e transacional seguem os padrões de política abaixo para garantir o isolamento estrito de Tenancy:

### A. Escopo de Unidade (Transacional/Operacional)
Tabelas: `estoque_lotes`, `estoque_movimentacoes`, `estoque_locais`, `estoque_inventarios`, `equipamentos_config`, `setores_producao`.

```sql
USING (
  unidade_id IN (
    SELECT m.unidade_id FROM app_user_memberships m 
    WHERE m.usuario_id = auth.uid()
  )
)
```

### B. Escopo de Matriz (Master Data Compartilhado)
Tabelas: `ingredientes`, `grupos_produto`, `subgrupos_produto`.

```sql
USING (
  cliente_id IN (
    SELECT m.cliente_id FROM app_user_memberships m 
    WHERE m.usuario_id = auth.uid()
  )
)
```

Isso impede que usuários injetem UUIDs de outras unidades ou de outros clientes via requisições diretas, garantindo a integridade dos dados em todo o ecossistema.

