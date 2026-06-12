---
id: project-overview
title: "SaaS Food Service — Project Overview"
type: project-overview
mode: brownfield
status: baseline
created: 2026-05-10
---
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-architecture]]
---




# Project Overview

## Identity

- **Name**: SaaS Food Service (nutridev-manager)
- **Mode**: brownfield
- **Domain**: Food Service Management — B2B SaaS multi-tenant
- **Sector**: Food Tech / Regulatory Compliance (ANVISA)

## Problem

Indústrias de alimentos, cozinhas industriais e UANs (Unidades de Alimentação e Nutrição) operam com processos majoritariamente manuais: fichas técnicas em papel, cálculos nutricionais em planilhas, gestão de estoque sem rastreabilidade, e compliance regulatório baseado em auditorias reativas. Isso gera desperdício, riscos sanitários e custos operacionais desnecessários.

## Solution

Plataforma SaaS verticalizada que digitaliza todo o ciclo operacional: da formulação de receitas com cálculo nutricional automático (RDC 429, IN 75) até o planejamento de cardápios UAN com lista de compras otimizada, passando por gestão de estoque com rastreabilidade de lotes (FEFO), ordens de produção integradas e compliance GxP com audit trail completo.

## Users / Actors

| Actor | Role | Key workflows |
|---|---|---|
| Nutricionista RT | Owner técnico da UAN | Fichas técnicas, cardápios, rotulagem |
| Gestor de Qualidade | Compliance officer | Auditorias, checklists, planos de ação |
| Almoxarife | Operador de estoque | Recebimento, movimentações, inventário |
| Gestor de Produção | Chão de fábrica | Ordens de produção, baixa de estoque |
| Admin/Dono | Gestão financeira | Dashboard, relatórios, configurações |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| UI | Material UI (MUI) 5, Tailwind CSS 3 |
| Backend | Supabase (PostgreSQL) — BaaS-First |
| Auth | Supabase Auth + RLS multi-tenant |
| Edge Functions | Deno (calcular-nutrientes, aprovar-receita, calcular-cardapio-uan) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| IoT | WebUSB (impressoras térmicas ZPL) |
| OCR | Tesseract.js |
| Testing | Vitest + Testing Library |

## Modules

| Module | Route | Status |
|---|---|---|
| Ingredientes | `/ingredientes` | Implemented |
| Receitas / Fichas Técnicas | `/receitas` | Implemented |
| UAN — Fichas Técnicas | `/uan` | Implemented |
| UAN — Cardápios | `/planejamento` | Implemented |
| Estoque / WMS | `/estoque`, `/materiais` | Implemented |
| Produção | `/producao` | Implemented |
| Fornecedores | `/fornecedores` | Implemented |
| Qualidade (GxP) | `/qualidade` | Implemented |
| Serviços | `/servicos` | Implemented |
| Financeiro | `/financeiro` | Partial |
| Admin | `/admin` | Implemented |
| Relatórios | `/relatorios` | Implemented |

## Constraints

- Compliance ANVISA obrigatório (RDC 216, 429, 727, IN 75, Lei 10674)
- Multi-tenant com isolamento por unidade (RLS)
- Soft delete obrigatório (GxP — nenhum registro transacional deletado)
- Audit trail completo para operações sensíveis
