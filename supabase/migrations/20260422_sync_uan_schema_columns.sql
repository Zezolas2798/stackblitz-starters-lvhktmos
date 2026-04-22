-- Migration: 20260422_sync_uan_schema_columns.sql
-- Descrição: Sincroniza o banco de dados com as interfaces TypeScript do módulo UAN,
-- resolvendo inconsistências de colunas ausentes em cardápios e fichas técnicas
-- apontadas na análise técnica completa.

BEGIN;

-- 1. Tabela cardapios_uan
-- Adiciona unidade_id (UUID) para isolamento por unidade operacional (ex: Filial/Unidade)
-- Adiciona setor_producao_id (UUID) se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cardapios_uan' AND column_name='unidade_id') THEN
        ALTER TABLE public.cardapios_uan ADD COLUMN unidade_id uuid;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cardapios_uan' AND column_name='setor_producao_id') THEN
        ALTER TABLE public.cardapios_uan ADD COLUMN setor_producao_id uuid;
    END IF;
END $$;

-- 2. Tabela fichas_tecnicas_uan
-- Adiciona refeicoes (text[]) para indicar compatibilidade de turno (ex: Almoço, Jantar)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fichas_tecnicas_uan' AND column_name='refeicoes') THEN
        ALTER TABLE public.fichas_tecnicas_uan ADD COLUMN refeicoes text[];
    END IF;
END $$;

COMMIT;
