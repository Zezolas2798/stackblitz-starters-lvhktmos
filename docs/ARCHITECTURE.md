# 🏗️ Arquitetura do Sistema - SaaS Food Service

Este documento descreve a organização técnica, o padrão arquitetural e as diretrizes de integridade de dados da plataforma **SaaS Food Service**. Ele serve como a fonte da verdade para o desenvolvimento e manutenção do projeto.

---

## 🛰️ Padrão Arquitetural: BaaS-First

O sistema utiliza um padrão **BaaS-First (Backend as a Service)** baseado no **Supabase** e no **Next.js App Router**. 

### Princípios da Camada de Dados
*   **Controle Centralizado**: A lógica de segurança e isolamento de dados reside no banco de dados via **RLS (Row Level Security)**.
*   **Isolamento Granular**: O sistema garante isolamento tanto em nível de Cliente (Tenant) quanto em nível de **Unidade (Filial)** para dados operacionais (Estoque, Equipamentos, Produção).
*   **Comunicação Direta**: O Frontend consome o banco de dados diretamente através do `supabaseClient`.
*   **Server Actions**: Para lógicas complexas que exigem processamento no servidor ou segredos de API, utilizamos Next.js Server Actions.

---

## 🗺️ Mapa Funcional (Módulos de Negócio)

A estrutura dentro de `app/` é organizada de forma modular, representando as verticais de negócio:

*   **Qualidade (GxP)** (`/qualidade`): Gestão de auditorias, checklists normativos e planos de ação.
*   **WMS & Estoque** (`/estoque`, `/materiais`): Controle de inventário, gestão de lotes, regra FEFO (First Expired, First Out) e Kardex.
*   **UAN (Alimentação e Nutrição)** (`/uan`, `/receitas`, `/ingredientes`): Planejamento de cardápios, fichas técnicas operacionais e cálculos nutricionais.
*   **Backoffice** (`/admin`, `/financeiro`, `/compras`): Gestão de licenças, faturamento, cotações de fornecedores e controle de custos.
*   **Operacional** (`/operacional`, `/planejamento`): Execução diária das unidades produtivas.

---

## 📂 Camadas de Governança e Memória Corporativa

O projeto mantém sementes de conhecimento e regras de negócio de forma explícita na raiz e em pastas especializadas:

*   `docs/`: [[infraestrutura.ambientes|Gestão de Ambientes (DEV vs PROD)]] e diretrizes de infraestrutura Supabase.
*   `docs/`: [[sistema.map.relatorios|Manuais técnicos de cálculos]], modelagem de domínio e nutrição.
*   `docs/`: [[sistema.calc.rotulagem|Espec. Técnica de Rotulagem]] e regras de conformidade.
*   `governanca/`: Definições de padrões de banco de dados e arquitetura.
*   `boas_praticas/`: Diretrizes de design de API e codificação.

---

## 🔄 Fluxo de Execução e Middleware

A orquestração do sistema depende de componentes transversais:

1.  **Middleware** (`middleware.ts`):
    *   **Auth Guard**: Protege rotas internas contra acessos não autenticados.
    *   **Tenant Detection**: Intercepta requisições para garantir que o contexto do cliente/unidade esteja correto.
2.  **Contextos Globais** (`lib/ClientContext.tsx`):
    *   Gerencia a unidade ativa (Multi-tenancy) e persiste a sessão no lado do cliente.
3.  **Tipagem Estrita**:
    *   Os tipos gerados do banco de dados residem em `lib/database.types.ts`, garantindo que toda a aplicação seja Type-Safe em relação ao esquema do PostgreSQL.

---

## 🔐 Compliance e Rastreabilidade (GxP)

Como um sistema voltado para a segurança alimentar, a integridade dos dados é absoluta.

### 🛑 Soft Delete (Exclusão Lógica)
*   **Regra**: Nenhum registro transacional é deletado fisicamente.
*   **Implementação**: Uso obrigatório do campo `deleted_at`. Toda query deve conter `WHERE deleted_at IS NULL`.

### 📝 Audit Trail
*   **Rastreabilidade**: Todos os registros críticos possuem metadados de autoria (`created_by`, `updated_by`).
*   **Logs GxP**: Alterações sensíveis são registradas na tabela `audit_logs_gxp` com o snapshot (antes/depois) e justificativa.

---

## 🧪 Estratégia de Qualidade e Testes

A integridade da lógica de negócio (como cálculos de custo e rendimento) é garantida por:
*   **Vitest & JSDOM**: Framework de testes unitários e de integração configurado para simular o ambiente de browser.
*   **Snapshots**: Testes de integridade para layouts e cálculos matemáticos críticos.

---

## 🖨️ Integração IoT (NutriPrint)

O sistema possui uma camada de hardware em `lib/iot/`:
*   **WebUSB API**: Comunicação sem driver com impressoras térmicas.
*   **ZPL Support**: Geração de código nativo para impressão de etiquetas de validade em alta velocidade.

---

© 2026 SaaS Food Service. Documentação de Arquitetura Técnica.
