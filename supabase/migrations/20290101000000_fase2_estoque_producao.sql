-- ==========================================
-- FASE 2: WMS, ESTOQUE E CHÃO DE FÁBRICA
-- Sistema: NutriDev Manager GxP
-- Objetivo: Conformidade RDC 216 e RDC 429
-- ==========================================

-- 1. Criação de Enums de Status
CREATE TYPE status_lote_estoque AS ENUM ('QUARENTENA', 'APROVADO', 'REJEITADO', 'VENCIDO');
CREATE TYPE status_ordem_producao AS ENUM ('PENDENTE', 'EM_PREPARO', 'FINALIZADA', 'CANCELADA');

-- ==========================================
-- MÓDULO 2: WMS E ESTOQUE
-- ==========================================

-- Tabela: Fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj TEXT UNIQUE NOT NULL,
    homologado_qualidade BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: Lotes de Estoque (Recebimento)
CREATE TABLE IF NOT EXISTS public.lotes_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_id UUID NOT NULL REFERENCES public.cliente_unidades(id) ON DELETE CASCADE,
    ingrediente_id UUID NOT NULL REFERENCES public.ingredientes(id) ON DELETE RESTRICT,
    fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE RESTRICT,
    numero_lote_fabricante TEXT NOT NULL,
    nota_fiscal TEXT,
    data_fabricacao DATE NOT NULL,
    data_validade_rotulo DATE NOT NULL,
    data_validade_interna DATE, -- Calculada/Ajustada pela Qualidade (Predição)
    quantidade_inicial_g_ml NUMERIC NOT NULL CHECK (quantidade_inicial_g_ml > 0),
    quantidade_atual_g_ml NUMERIC NOT NULL CHECK (quantidade_atual_g_ml >= 0),
    status status_lote_estoque DEFAULT 'QUARENTENA',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- MÓDULO 3: PRODUÇÃO / CHÃO DE FÁBRICA
-- ==========================================

-- Tabela: Ordens de Produção (OP)
CREATE TABLE IF NOT EXISTS public.ordens_producao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_id UUID NOT NULL REFERENCES public.cliente_unidades(id) ON DELETE CASCADE,
    receita_id UUID NOT NULL REFERENCES public.receitas(id) ON DELETE RESTRICT,
    receita_versao_utilizada INT NOT NULL, -- Puxado de receitas.versao_atual
    status status_ordem_producao DEFAULT 'PENDENTE',
    data_prevista_inicio TIMESTAMPTZ,
    data_real_finalizacao TIMESTAMPTZ,
    rendimento_esperado_g NUMERIC NOT NULL,
    rendimento_realizado_g NUMERIC,
    responsavel_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: Apontamentos de Produção (Baixa de Múltiplos Lotes)
CREATE TABLE IF NOT EXISTS public.apontamentos_producao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordem_producao_id UUID NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
    lote_estoque_id UUID NOT NULL REFERENCES public.lotes_estoque(id) ON DELETE RESTRICT,
    quantidade_utilizada_g_ml NUMERIC NOT NULL CHECK (quantidade_utilizada_g_ml > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: Lotes Internos (Rastreabilidade e NutriPrint)
CREATE TABLE IF NOT EXISTS public.lotes_internos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_id UUID NOT NULL REFERENCES public.cliente_unidades(id) ON DELETE CASCADE,
    ordem_producao_id UUID NOT NULL UNIQUE REFERENCES public.ordens_producao(id) ON DELETE RESTRICT,
    codigo_lote_interno TEXT UNIQUE NOT NULL,
    data_fabricacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_validade TIMESTAMPTZ NOT NULL, -- O menor vencimento entre os insumos ou regra própria
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) MULTI-TENANT
-- ==========================================

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apontamentos_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_internos ENABLE ROW LEVEL SECURITY;

-- Exemplo RLS: Fornecedor (Baseado em Cliente)
CREATE POLICY "Fornecedores Isolados por Cliente" ON public.fornecedores
    FOR ALL
    USING (cliente_id IN (
        SELECT adm.cliente_id FROM public.app_roles adm
        JOIN public.app_user_memberships m ON m.role_id = adm.id
        WHERE m.usuario_id = auth.uid()
    ));

-- Exemplo RLS: Lotes e Estoque (Baseado em Unidade)
CREATE POLICY "Estoque Isolado por Unidade" ON public.lotes_estoque
    FOR ALL
    USING (unidade_id IN (
        SELECT unidade_id FROM public.app_user_memberships WHERE usuario_id = auth.uid()
    ));

CREATE POLICY "Produção Isolada por Unidade" ON public.ordens_producao
    FOR ALL
    USING (unidade_id IN (
        SELECT unidade_id FROM public.app_user_memberships WHERE usuario_id = auth.uid()
    ));

CREATE POLICY "Apontamentos da Produção Local" ON public.apontamentos_producao
    FOR ALL
    USING (ordem_producao_id IN (
        SELECT id FROM public.ordens_producao WHERE unidade_id IN (
            SELECT unidade_id FROM public.app_user_memberships WHERE usuario_id = auth.uid()
        )
    ));

CREATE POLICY "Lotes Internos da Unidade" ON public.lotes_internos
    FOR ALL
    USING (unidade_id IN (
        SELECT unidade_id FROM public.app_user_memberships WHERE usuario_id = auth.uid()
    ));
