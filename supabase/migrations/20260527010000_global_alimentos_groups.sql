-- Migração: Grupos de ALIMENTOS globais + Preferências por cliente
-- Os grupos/subgrupos de ALIMENTOS passam a ser compartilhados entre todos os clientes.
-- Cada cliente pode ativar/desativar quais grupos usa via tabelas de preferências.
-- Outras modalidades (EMBALAGENS, LIMPEZA, etc.) continuam por cliente.

-- 1. Permitir cliente_id NULL em grupos_produto (para grupos globais)
ALTER TABLE public.grupos_produto ALTER COLUMN cliente_id DROP NOT NULL;

-- 2. Permitir cliente_id NULL em subgrupos_produto (para subgrupos globais)
ALTER TABLE public.subgrupos_produto ALTER COLUMN cliente_id DROP NOT NULL;

-- 3. Tornar grupos de ALIMENTOS globais
UPDATE public.grupos_produto SET cliente_id = NULL WHERE modalidade = 'ALIMENTOS';

-- 4. Tornar subgrupos de ALIMENTOS globais
UPDATE public.subgrupos_produto sp
SET cliente_id = NULL
FROM public.grupos_produto gp
WHERE sp.grupo_id = gp.id AND gp.modalidade = 'ALIMENTOS';

-- 5. Tabela de preferências de grupos por cliente (opt-out: se não tem registro, está ativo)
CREATE TABLE IF NOT EXISTS public.cliente_grupos_preferencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    grupo_id UUID NOT NULL REFERENCES public.grupos_produto(id) ON DELETE CASCADE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(cliente_id, grupo_id)
);

ALTER TABLE public.cliente_grupos_preferencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso por cliente" ON public.cliente_grupos_preferencias
    FOR ALL USING (true) WITH CHECK (true);

-- 6. Tabela de preferências de subgrupos por cliente
CREATE TABLE IF NOT EXISTS public.cliente_subgrupos_preferencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    subgrupo_id UUID NOT NULL REFERENCES public.subgrupos_produto(id) ON DELETE CASCADE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(cliente_id, subgrupo_id)
);

ALTER TABLE public.cliente_subgrupos_preferencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso por cliente" ON public.cliente_subgrupos_preferencias
    FOR ALL USING (true) WITH CHECK (true);

-- 7. Atualizar RLS de grupos_produto para permitir acesso a grupos globais
DROP POLICY IF EXISTS "Acesso por cliente_id" ON public.grupos_produto;
DROP POLICY IF EXISTS "Permitir acesso total a usuarios autenticados" ON public.grupos_produto;

CREATE POLICY "Acesso grupos globais e por cliente" ON public.grupos_produto
    FOR ALL USING (
        cliente_id IS NULL
        OR auth.role() = 'authenticated'
    ) WITH CHECK (
        cliente_id IS NULL
        OR auth.role() = 'authenticated'
    );

-- 8. Atualizar RLS de subgrupos_produto
DROP POLICY IF EXISTS "Acesso por cliente_id" ON public.subgrupos_produto;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.subgrupos_produto;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.subgrupos_produto;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.subgrupos_produto;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.subgrupos_produto;

CREATE POLICY "Acesso subgrupos globais e por cliente" ON public.subgrupos_produto
    FOR ALL USING (
        cliente_id IS NULL
        OR auth.role() = 'authenticated'
    ) WITH CHECK (
        cliente_id IS NULL
        OR auth.role() = 'authenticated'
    );
