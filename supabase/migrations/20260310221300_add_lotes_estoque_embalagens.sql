-- Migration for adding package details to lotes_estoque
-- Phase 7: Correção de Esquema do DB (Embalagens)

ALTER TABLE public.lotes_estoque 
    ADD COLUMN IF NOT EXISTS qtd_embalagens NUMERIC,
    ADD COLUMN IF NOT EXISTS peso_unitario_embalagem NUMERIC,
    ADD COLUMN IF NOT EXISTS unidade_peso_embalagem TEXT;
