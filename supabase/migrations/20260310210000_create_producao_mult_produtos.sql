-- Migration: Create Multi-Product Production Orders and Requisitions

-- 1. producao_ordens (Cabeçalho da Ordem)
CREATE TABLE IF NOT EXISTS public.producao_ordens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_id UUID NOT NULL REFERENCES public.cliente_unidades(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PLANEJADA', -- PLANEJADA, EM_PRODUCAO, CONCLUIDA, CANCELADA
    data_prevista DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_producao_ordens_unidade_id ON producao_ordens(unidade_id);

-- 2. producao_ordens_itens (Receitas/Produtos na Ordem)
CREATE TABLE IF NOT EXISTS public.producao_ordens_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordem_id UUID NOT NULL REFERENCES public.producao_ordens(id) ON DELETE CASCADE,
    receita_id UUID NOT NULL REFERENCES public.receitas(id) ON DELETE RESTRICT,
    quantidade_planejada NUMERIC(10,3) NOT NULL CHECK (quantidade_planejada > 0),
    quantidade_produzida NUMERIC(10,3) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_producao_ordens_itens_ordem_id ON producao_ordens_itens(ordem_id);

-- 3. producao_requisicoes (Agregação de Insumos Necessários)
CREATE TABLE IF NOT EXISTS public.producao_requisicoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordem_id UUID NOT NULL REFERENCES public.producao_ordens(id) ON DELETE CASCADE,
    ingrediente_id UUID NOT NULL REFERENCES public.ingredientes(id) ON DELETE RESTRICT,
    qtd_necessaria_g NUMERIC(12,3) NOT NULL,
    qtd_separada_g NUMERIC(12,3) DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE', -- PENDENTE, SEPARADO, FALTA_ESTOQUE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ordem_id, ingrediente_id)
);

CREATE INDEX IF NOT EXISTS idx_producao_requisicoes_ordem_id ON producao_requisicoes(ordem_id);

-- 4. producao_reservas_estoque (Vínculo de Reserva Física de Estoque)
CREATE TABLE IF NOT EXISTS public.producao_reservas_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisicao_id UUID NOT NULL REFERENCES public.producao_requisicoes(id) ON DELETE CASCADE,
    estoque_lote_id UUID NOT NULL REFERENCES public.estoque_lotes(id) ON DELETE CASCADE,
    quantidade_reservada_g NUMERIC(12,3) NOT NULL CHECK (quantidade_reservada_g > 0),
    data_reserva TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reservado_por UUID REFERENCES auth.users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'RESERVADO', -- RESERVADO, CONSUMIDO, CANCELADO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_producao_reservas_requisicao_id ON producao_reservas_estoque(requisicao_id);
CREATE INDEX IF NOT EXISTS idx_producao_reservas_estoque_lote_id ON producao_reservas_estoque(estoque_lote_id);


-- Row Level Security (RLS) policies
ALTER TABLE public.producao_ordens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producao_ordens_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producao_requisicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producao_reservas_estoque ENABLE ROW LEVEL SECURITY;

-- Policies for producao_ordens
CREATE POLICY "Acesso as ordens da unidade" ON public.producao_ordens
    FOR ALL
    USING (unidade_id IN (
        SELECT unidade_id FROM public.app_user_memberships WHERE usuario_id = auth.uid()
    ));

-- Policies for producao_ordens_itens
CREATE POLICY "Acesso aos itens das ordens" ON public.producao_ordens_itens
    FOR ALL
    USING (ordem_id IN (
        SELECT id FROM public.producao_ordens WHERE unidade_id IN (
            SELECT unidade_id FROM public.app_user_memberships WHERE usuario_id = auth.uid()
        )
    ));

-- Policies for producao_requisicoes
CREATE POLICY "Acesso as requisições das ordens" ON public.producao_requisicoes
    FOR ALL
    USING (ordem_id IN (
        SELECT id FROM public.producao_ordens WHERE unidade_id IN (
            SELECT unidade_id FROM public.app_user_memberships WHERE usuario_id = auth.uid()
        )
    ));

-- Policies for producao_reservas_estoque
CREATE POLICY "Acesso as reservas de estoque" ON public.producao_reservas_estoque
    FOR ALL
    USING (requisicao_id IN (
        SELECT r.id FROM public.producao_requisicoes r
        JOIN public.producao_ordens o ON o.id = r.ordem_id
        WHERE o.unidade_id IN (
            SELECT unidade_id FROM public.app_user_memberships WHERE usuario_id = auth.uid()
        )
    ));


-- 5. RPC Function to aggregate ingredients
CREATE OR REPLACE FUNCTION gerar_requisicao_producao(p_ordem_id UUID)
RETURNS VOID AS $$
DECLARE
    v_unidade_id UUID;
BEGIN
    -- Verify the order exists and get unidade_id
    SELECT unidade_id INTO v_unidade_id FROM producao_ordens WHERE id = p_ordem_id;
    IF v_unidade_id IS NULL THEN
        RAISE EXCEPTION 'Ordem de Produção não encontrada %', p_ordem_id;
    END IF;

    -- Clear existing requisitions for this order that aren't separated yet
    DELETE FROM producao_requisicoes 
    WHERE ordem_id = p_ordem_id 
      AND qtd_separada_g = 0;

    -- Aggregate the BOM (Bill of Materials) and insert into producao_requisicoes
    INSERT INTO producao_requisicoes (ordem_id, ingrediente_id, qtd_necessaria_g, status)
    SELECT 
        p_ordem_id,
        c.item_id as ingrediente_id,
        SUM(COALESCE(c.peso_liquido_g, 0) * COALESCE(i.quantidade_planejada, 0)) as qtd_necessaria_g,
        'PENDENTE' as status
    FROM producao_ordens_itens i
    JOIN composicao_receitas c ON c.receita_id = i.receita_id
    WHERE i.ordem_id = p_ordem_id
      AND (c.item_type IS NULL OR c.item_type = 'ingrediente')
    GROUP BY c.item_id
    ON CONFLICT (ordem_id, ingrediente_id) 
    DO UPDATE SET 
        qtd_necessaria_g = EXCLUDED.qtd_necessaria_g,
        status = CASE 
                    WHEN producao_requisicoes.qtd_separada_g >= EXCLUDED.qtd_necessaria_g THEN 'SEPARADO'
                    ELSE 'PENDENTE'
                 END;
                 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
