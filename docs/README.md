---
id: readme
titulo: "SaaS Food Service — Guia Principal"
tipo: readme
node_type: readme
layer: application
nature: explanatory
status: evergreen
tags:
  - sistema/geral
  - onboarding
---

# 🚀 SaaS Food Service

### Plataforma SaaS Multi-tenant de Gestão e Compliance para o Setor Alimentício

O **SaaS Food Service** é uma solução definitiva projetada para digitalizar o chão de fábrica e automatizar a gestão de qualidade em indústrias de alimentos, cozinhas industriais, restaurantes e consultorias nutricionais. Focado em **compliance regulatório (GxP)** e eficiência operacional, o sistema elimina o uso de papel e garante rastreabilidade total de ponta a ponta.

---

## 🌟 Visão Geral

Nossa missão é transformar a gestão técnica do Food Service através de inteligência de dados e automação. O sistema atua como um ERP/MES verticalizado, garantindo conformidade com as normas da **ANVISA (RDC 216, 429 e 26)** e otimizando a produtividade das equipes através de ferramentas visuais e integração IoT.

## 📦 Módulos Principais

*   **🥗 Engenharia de Cardápio & Qualidade**: Motor de receitas com cálculo automático de alergênicos e tabelas nutricionais (RDC 429).
*   **🏭 Gestão de Estoque & WMS**: Controle de validade preditiva, rastreabilidade de lotes e homologação de fornecedores.
*   **👨‍🍳 Produção & Chão de Fábrica**: Ordens de produção integradas com baixa automática de estoque.
*   **🖨️ Rastreabilidade IoT (NutriPrint)**: Geração de etiquetas ZPL e impressão térmica direta via WebUSB.
*   **📋 Gestão Operacional (Kanban)**: Dashboards de tarefas, POPs digitais e evidências fotográficas GxP.
*   **📊 Analytics & Dashboards**: KPIs de produtividade, SLA de entrega e relatórios gerenciais avançados.

---

## 🛠️ Tech Stack

### Frontend & UI
*   **Core**: [Next.js 14](https://nextjs.org/) (App Router), React 18
*   **Linguagem**: TypeScript
*   **Design System**: [Material UI (MUI)](https://mui.com/), [Tailwind CSS](https://tailwindcss.com/)
*   **Gráficos**: [Recharts](https://recharts.org/)
*   **Ícones**: Lucide React, MUI Icons

### Backend & Core Services
*   **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
*   **Segurança**: RLS (Row Level Security) Multi-tenant & Unit-Level Isolation
*   **Storage**: Supabase Storage para evidências e documentos

### Engenharia & Inteligência
*   **Validação**: Zod, React Hook Form
*   **OCR**: Tesseract.js для leitura automática de dados
*   **IoT**: WebUSB API para integração com impressoras Zebra/Elgin

---

## 🚀 Como Iniciar

### Pré-requisitos
*   [Node.js](https://nodejs.org/) (Versão 18 ou superior)
*   Conta no [Supabase](https://supabase.com/)

### Instalação

1.  Clone o repositório:
    ```bash
    git clone https://github.com/seu-usuario/saas-food-service.git
    ```

2.  Instale as dependências:
    ```bash
    npm install
    ```

3.  Configure as variáveis de ambiente:
    Crie um arquivo `.env.local` na raiz e adicione suas chaves:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
    ```

### Servidor de Desenvolvimento

Inicie o servidor localmente:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

---

## 📂 Governança e Boas Práticas

Este projeto segue rigorosos padrões de documentação e engenharia:
- Consulte a [[infraestrutura.ambientes|Gestão de Ambientes (DEV & PROD)]] para diretrizes sobre os bancos de dados Supabase e fluxos de deploy.
- Consulte o [[sistema.map.relatorios|Módulo de Relatórios e Nutrição]] e o [[sistema.calc.rotulagem|Espec. de Rotulagem]] na pasta `docs` para detalhes de compliance.
- Documentação de GxP e conformidade disponível em `boas_praticas`.
- Regras de negócio e governança em `governanca`.

---

© 2026 SaaS Food Service. Todos os direitos reservados.
