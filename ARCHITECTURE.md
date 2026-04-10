# 🏗️ Arquitetura do Sistema - SaaS Food Service

Este documento descreve a organização técnica, o padrão arquitetural e as diretrizes de integridade de dados da plataforma **SaaS Food Service**.

---

## 🛰️ Padrão Arquitetural

O sistema utiliza um padrão **BaaS-First (Backend as a Service)** baseado no **Supabase** e no **Next.js App Router**. A principal característica desta arquitetura é a transferência da lógica de segurança e integridade para o banco de dados via **RLS (Row Level Security)**, permitindo uma comunicação direta e eficiente entre o Frontend e os serviços de dados.

### As Camadas do Sistema

1.  **Visão (View)**: Implementada em `app/` seguindo a estrutura de rotas do Next.js. É responsável apenas pela interface e entrada do usuário.
2.  **Lógica de Negócio (Hooks & Contexts)**: Localizada em `hooks/` e `lib/`. Aqui reside a "inteligência" do cliente: orquestração de estados, chamadas de API e gerenciamento de contextos multi-tenant.
3.  **Segurança e Consistência (Database Layer)**: O Supabase atua como o controlador definitivo. As regras de RLS garantem que as operações de dados obedeçam estritamente ao isolamento entre clientes (Multi-tenancy).
4.  **Infraestrutura**: Configurações de API, temas e utilitários globais em `lib/`.

---

## 📂 Organização de Pastas

*   `app/`: Rotas, páginas e layouts principais do sistema.
*   `components/`: Biblioteca de componentes UI reutilizáveis (MUI + Tailwind).
*   `lib/`: Provedores de contexto (Auth, Tenant), configurações do Supabase e utilitários.
*   `hooks/`: Módulos de lógica de domínio e gerenciamento de estado das funcionalidades.
*   `supabase/`: Definições SQL, migrações e funções de banco de dados.
*   `_knowledge/`: Base de conhecimento técnico e histórico de decisões do projeto.

---

## 🔐 Multi-tenancy & Segurança

O SaaS é nativamente multi-tenant. O isolamento de dados é garantido no nível do banco de dados:
*   **Tenant ID**: Cada registro está vinculado a um `cliente_id` ou `unidade_id`.
*   **RLS (Row Level Security)**: Nenhuma query retorna dados de outro tenant, mesmo que o frontend esqueça de um filtro, pois o banco de dados bloqueia o acesso no nível do usuário logado.

---

## 🗄️ Estratégia de Dados e Compliance (GxP)

Como um sistema voltado para a indústria alimentícia, a integridade e a rastreabilidade são fundamentais.

### 🛑 Soft Delete (Exclusão Lógica)
Para garantir conformidade com normas de validação de sistemas computadorizados (CSV) e auditorias da ANVISA:
*   **Proibição de Hard Delete**: É proibida a remoção física de registros transacionais.
*   **Campo `deleted_at`**: Toda exclusão é realizada preenchendo o timestamp neste campo.
*   **Filtragem**: As consultas de leitura devem obrigatoriamente filtrar por `deleted_at IS NULL`.

### 📝 Trilha de Auditoria (Audit Trail)
Todos os dados críticos possuem os seguintes campos para rastreabilidade:
*   `created_at` / `created_by`: Identifica quem criou o registro e quando.
*   `updated_at` / `updated_by`: Registra a última modificação.
*   **Tabela `audit_logs_gxp`**: Armazena logs detalhados de desvios e alterações de alta criticidade, incluindo o estado anterior e posterior do dado e a justificativa para a mudança.

---

## 🖨️ Integração IoT (NutriPrint)

O sistema possui uma camada de integração física em `lib/iot/` e `app/etiquetas/`:
*   **WebUSB API**: Comunicação direta entre o navegador e impressoras térmicas industriais (Zebra, Elgin).
*   **ZPL Native**: O sistema gera código em linguagem nativa de impressora, garantindo alta velocidade e precisão na impressão de etiquetas de rastreabilidade sem a necessidade de drivers de terceiros.

---

© 2026 SaaS Food Service. Documentação de Arquitetura.
