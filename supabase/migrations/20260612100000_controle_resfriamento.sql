-- Tabela para Controle de Temperatura do Alimento Durante o Resfriamento
CREATE TABLE IF NOT EXISTS public.controle_resfriamento (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    unidade_id uuid NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
    data date NOT NULL,
    hora_inicio time NOT NULL,
    hora_fim time,
    alimento_nome text NOT NULL,
    produto_id uuid REFERENCES public.ingredientes(id) ON DELETE SET NULL,
    receita_id uuid REFERENCES public.receitas(id) ON DELETE SET NULL,
    temp_pos_preparo numeric NOT NULL,
    temp_apos_2h numeric,
    status text NOT NULL DEFAULT 'EM_ANDAMENTO' CHECK (status IN ('EM_ANDAMENTO', 'CONCLUIDO')),
    is_out boolean DEFAULT false,
    observacao text,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE public.controle_resfriamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view resfriamento of their units" ON public.controle_resfriamento
    FOR SELECT USING (
        unidade_id IN (SELECT unidade_id FROM public.app_user_memberships WHERE usuario_id = auth.uid())
    );

CREATE POLICY "Users can insert resfriamento in their units" ON public.controle_resfriamento
    FOR INSERT WITH CHECK (
        unidade_id IN (SELECT unidade_id FROM public.app_user_memberships WHERE usuario_id = auth.uid())
    );

CREATE POLICY "Users can update resfriamento in their units" ON public.controle_resfriamento
    FOR UPDATE USING (
        unidade_id IN (SELECT unidade_id FROM public.app_user_memberships WHERE usuario_id = auth.uid())
    );

CREATE POLICY "Users can delete resfriamento in their units" ON public.controle_resfriamento
    FOR DELETE USING (
        unidade_id IN (SELECT unidade_id FROM public.app_user_memberships WHERE usuario_id = auth.uid())
    );
