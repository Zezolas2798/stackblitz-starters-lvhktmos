-- 20260606100000_create_planilhas_dinamicas.sql

-- 1. qual_planilha_modelos
CREATE TABLE IF NOT EXISTS public.qual_planilha_modelos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
    titulo text NOT NULL,
    descricao text,
    categoria text NOT NULL,
    icone text,
    ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- 2. qual_planilha_colunas
CREATE TABLE IF NOT EXISTS public.qual_planilha_colunas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    modelo_id uuid REFERENCES public.qual_planilha_modelos(id) ON DELETE CASCADE NOT NULL,
    ordem integer NOT NULL,
    titulo text NOT NULL,
    tipo text NOT NULL, -- 'TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT', 'PHOTO', 'SIGNATURE', 'ACTION_PLAN', 'CALCULATED'
    obrigatorio boolean DEFAULT false,
    opcoes jsonb, -- e.g., ["Sim", "Não"] for SELECT
    regras jsonb, -- e.g., {"min": 6.0, "max": 9.0} for NUMBER
    created_at timestamptz DEFAULT now()
);

-- 3. qual_planilha_configuracoes
CREATE TABLE IF NOT EXISTS public.qual_planilha_configuracoes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    modelo_id uuid REFERENCES public.qual_planilha_modelos(id) ON DELETE CASCADE NOT NULL,
    unidade_id uuid REFERENCES public.cliente_unidades(id) ON DELETE CASCADE NOT NULL,
    frequencia_tipo text NOT NULL, -- 'DIARIA', 'SEMANAL', 'MENSAL', 'SEMESTRAL', 'ANUAL', 'DEMANDA'
    frequencia_config jsonb, -- e.g., {"dias_semana": [1,2,3]}
    responsavel_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. qual_planilha_registros
CREATE TABLE IF NOT EXISTS public.qual_planilha_registros (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    modelo_id uuid REFERENCES public.qual_planilha_modelos(id) ON DELETE RESTRICT NOT NULL,
    unidade_id uuid REFERENCES public.cliente_unidades(id) ON DELETE CASCADE NOT NULL,
    preenchido_por uuid REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    data_referencia timestamptz NOT NULL,
    status text DEFAULT 'CONCLUIDO',
    respostas jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of { coluna_id, valor, anexos, acao_corretiva_id }
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.qual_planilha_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qual_planilha_colunas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qual_planilha_configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qual_planilha_registros ENABLE ROW LEVEL SECURITY;

-- Policies de Isolamento Multitenant
CREATE POLICY "Acesso completo aos modelos do cliente logado" ON public.qual_planilha_modelos
    FOR ALL USING (cliente_id IN (
        SELECT cliente_id FROM public.profiles WHERE profiles.id = auth.uid()
    ) OR cliente_id IS NULL);

CREATE POLICY "Acesso completo às colunas dos modelos do cliente logado" ON public.qual_planilha_colunas
    FOR ALL USING (modelo_id IN (
        SELECT id FROM public.qual_planilha_modelos WHERE cliente_id IN (
            SELECT cliente_id FROM public.profiles WHERE profiles.id = auth.uid()
        ) OR cliente_id IS NULL
    ));

CREATE POLICY "Acesso completo às configs da unidade logada" ON public.qual_planilha_configuracoes
    FOR ALL USING (unidade_id IN (
        SELECT unidade_id FROM public.profiles WHERE profiles.id = auth.uid()
    ));

CREATE POLICY "Acesso completo aos registros da unidade logada" ON public.qual_planilha_registros
    FOR ALL USING (unidade_id IN (
        SELECT unidade_id FROM public.profiles WHERE profiles.id = auth.uid()
    ));
