-- Migration: 20260422_migrate_legacy_cardapios.sql
-- Descrição: Associa cardápios legados (sem unidade_id) à filial 'Shopping'

BEGIN;

DO $$ 
DECLARE
    v_unidade_id uuid;
BEGIN
    -- Busca o ID da unidade 'Shopping'
    -- Tentando em 'filiais' (padrão GXP do projeto)
    SELECT id INTO v_unidade_id FROM public.filiais WHERE nome ILIKE '%Shopping%' LIMIT 1;

    IF v_unidade_id IS NOT NULL THEN
        UPDATE public.cardapios_uan 
        SET unidade_id = v_unidade_id
        WHERE unidade_id IS NULL;
        
        RAISE NOTICE 'Cardápios migrados para a unidade Shopping';
    END IF;
END $$;

COMMIT;
