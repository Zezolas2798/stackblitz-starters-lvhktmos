-- Migration: Add storage destination to producao_perdas
-- This migration adds the necessary columns to track where production leftovers are stored.

DO $$ 
BEGIN
    -- Check if column destino_id exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'producao_perdas' AND column_name = 'destino_id') THEN
        ALTER TABLE public.producao_perdas ADD COLUMN destino_id UUID;
        COMMENT ON COLUMN public.producao_perdas.destino_id IS 'ID do local de estoque ou setor de produção onde a sobra foi armazenada.';
    END IF;

    -- Check if column tipo_destino exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'producao_perdas' AND column_name = 'tipo_destino') THEN
        ALTER TABLE public.producao_perdas ADD COLUMN tipo_destino VARCHAR(50);
        COMMENT ON COLUMN public.producao_perdas.tipo_destino IS 'Tipo do destino (LOCAL para cliente_locais_estoque, SETOR para cliente_setores_producao).';
    END IF;
END $$;
