-- =============================================================================
-- MIGRAÇÃO: Remoção de Tabelas Legadas (companies, units, user_units)
-- Data: 2026-05-02
-- Objetivo: Limpar o banco de dados removendo tabelas do schema v1 que foram
--           substituídas por clientes, cliente_unidades e app_user_memberships.
-- =============================================================================

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ FASE 1 — Criar coluna substituta em profiles                            ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id);

COMMENT ON COLUMN public.profiles.cliente_id IS 'FK para clientes. Substitui a coluna legada company_id que apontava para a tabela companies (removida).';

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ FASE 2 — Dropar TODAS as RLS Policies que dependem de company_id        ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- 2.1 Policies na tabela profiles
DROP POLICY IF EXISTS "Gerentes veem perfis da própria empresa" ON public.profiles;
DROP POLICY IF EXISTS "Gerentes gerenciam funcionários" ON public.profiles;
DROP POLICY IF EXISTS "Gerentes atualizam funcionários" ON public.profiles;

-- 2.2 Policies na tabela user_units
DROP POLICY IF EXISTS "Gerentes atribuem unidades" ON public.user_units;

-- 2.3 Policy na tabela fin_contas (financeiro)
DROP POLICY IF EXISTS "Acesso as Contas Financeiras" ON public.fin_contas;

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ FASE 2B — Recriar as RLS Policies usando o sistema moderno              ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- Profiles: Gerentes veem perfis da própria empresa (via app_user_memberships)
CREATE POLICY "Gerentes veem perfis da própria empresa" ON public.profiles
FOR SELECT USING (
  -- O usuário logado pode ver perfis que pertencem ao mesmo cliente
  cliente_id IN (
    SELECT cu.cliente_id 
    FROM public.cliente_unidades cu
    JOIN public.app_user_memberships m ON m.unidade_id = cu.id
    WHERE m.usuario_id = auth.uid()
  )
  OR id = auth.uid()  -- Sempre pode ver o próprio perfil
);

-- Profiles: Gerentes gerenciam funcionários (INSERT)
CREATE POLICY "Gerentes gerenciam funcionários" ON public.profiles
FOR INSERT WITH CHECK (
  cliente_id IN (
    SELECT cu.cliente_id 
    FROM public.cliente_unidades cu
    JOIN public.app_user_memberships m ON m.unidade_id = cu.id
    WHERE m.usuario_id = auth.uid()
  )
);

-- Profiles: Gerentes atualizam funcionários (UPDATE)
CREATE POLICY "Gerentes atualizam funcionários" ON public.profiles
FOR UPDATE USING (
  cliente_id IN (
    SELECT cu.cliente_id 
    FROM public.cliente_unidades cu
    JOIN public.app_user_memberships m ON m.unidade_id = cu.id
    WHERE m.usuario_id = auth.uid()
  )
  OR id = auth.uid()
);

-- Financeiro: Acesso via unidades do usuário
CREATE POLICY "Acesso as Contas Financeiras" ON public.fin_contas
FOR ALL USING (
  cliente_id IN (
    SELECT cu.cliente_id 
    FROM public.cliente_unidades cu
    JOIN public.app_user_memberships m ON m.unidade_id = cu.id
    WHERE m.usuario_id = auth.uid()
  )
);

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ FASE 5 — DROP das tabelas legadas (ordem correta de dependência)        ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- 5.1 Remover a FK e coluna legada de profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_company_id_fkey;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS company_id;

-- 5.2 Dropar tabelas filhas primeiro, depois as pais
DROP TABLE IF EXISTS public.user_units;       -- depende de profiles + units
DROP TABLE IF EXISTS public.inventory_items;  -- depende de units (tem FK unit_id)
DROP TABLE IF EXISTS public.units;            -- depende de companies
DROP TABLE IF EXISTS public.companies;        -- tabela raiz legada
