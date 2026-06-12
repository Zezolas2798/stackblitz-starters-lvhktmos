---
id: infraestrutura.ambientes
titulo: "Gestão de Ambientes: DEV & PROD"
tipo: arquitetura
layer: infraestrutura
nature: explanatory
status: evergreen
tags:
  - infraestrutura
  - supabase
  - devops
  - ambientes
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[../../registry|Global Registry]]

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-architecture]]

---



# 🌍 Gestão de Ambientes: Desenvolvimento (DEV) & Produção (PROD)

Este documento estabelece as diretrizes e o fluxo de trabalho para a gestão de infraestrutura de banco de dados e aplicação no **SaaS Food Service**.

A separação estrita entre os ambientes de Desenvolvimento e Produção é um pilar fundamental para garantir a estabilidade, a integridade dos dados e o compliance contínuo da plataforma.

---

## 🏗️ Projetos Supabase Separados

Para garantir o isolamento total dos dados de clientes em produção e permitir a experimentação livre durante o desenvolvimento, o sistema opera com dois projetos distintos no Supabase:

### 1. Ambiente de Desenvolvimento (DEV)
* **Objetivo:** Criação de novas funcionalidades, testes locais, prototipagem e validação de regras de segurança (RLS).
* **Conexão Local:** As chaves deste projeto são utilizadas no arquivo `.env.local` na máquina dos desenvolvedores.
* **Massa de Dados:** Contém dados fictícios, seeds de testes e informações sintéticas. **Nenhum dado real de cliente reside aqui.**
* **Integrações:** Utilizado para testar Webhooks e Server Actions de forma segura, sem afetar o faturamento ou sistemas de terceiros em produção.

### 2. Ambiente de Produção (PROD)
* **Objetivo:** Ambiente oficial utilizado pelos clientes finais. Estabilidade e disponibilidade máximas.
* **Hospedagem Frontend:** As chaves deste projeto são configuradas estritamente nas variáveis de ambiente da plataforma de deploy (ex: Vercel). **Nunca são expostas localmente**, a menos que estritamente necessário para uma auditoria ou clonagem controlada.
* **Integridade GxP:** Todas as exclusões lógicas (`deleted_at`) e trilhas de auditoria (`audit_logs_gxp`) devem ser preservadas neste ambiente a qualquer custo.

---

## 🔄 Fluxo de Trabalho e Sincronização de Banco de Dados

Quando novas funcionalidades que envolvem alterações estruturais (novas tabelas, colunas, ou políticas RLS) são desenvolvidas, o seguinte fluxo deve ser respeitado:

### A. Desenvolvimento Inicial (DEV)
1. Todas as alterações no modelo de dados ou políticas RLS devem ser criadas primeiro no banco de dados **DEV**.
2. O código do frontend (Next.js) é adaptado e testado localmente contra o ambiente DEV.

### B. Migração para Produção (PROD)
1. **Nunca desenvolva diretamente no banco de Produção.**
2. Uma vez homologada a alteração no DEV, a mesma mudança estrutural deve ser replicada no ambiente **PROD**.
3. Em casos de migrações maiores, é recomendado extrair o Schema do DEV (usando o Supabase CLI ou scripts de dump DDL) e aplicar no PROD, garantindo que a estrutura fique 100% idêntica sem afetar os dados reais.

---

## 🔐 Configuração de Variáveis de Ambiente

As credenciais que definem qual ambiente a aplicação consome são:

* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Regras de Ouro:**
1. O arquivo `.env.local` está incluído no `.gitignore` e **nunca** deve ser commitado no repositório.
2. Trocas acidentais de credenciais na máquina local podem levar à alteração de dados de produção se as chaves PROD forem coladas no `.env.local`. Por padrão, sempre mantenha o `.env.local` apontado para o projeto DEV.

---

© 2026 SaaS Food Service. Diretrizes de Infraestrutura e Ambientes.
