-- Migration: 20260420100000_standardize_nomenclature.sql
-- Objetivo: Padronização de nomes de tabelas para o padrão modulo_entidade (Prefix-First)

BEGIN;

-- ==========================================
-- 1. MÓDULO ESTOQUE
-- ==========================================

-- Renomeia estoque_lotes -> estoque_lotes
ALTER TABLE IF EXISTS public.estoque_lotes RENAME TO estoque_lotes;
ALTER TABLE IF EXISTS public.estoque_lotes RENAME CONSTRAINT estoque_lotes_pkey TO estoque_lotes_pkey;
-- (Opcional) Renomear chaves estrangeiras se necessário, mas o principal é a tabela.

-- Renomeia estoque_locais -> estoque_locais
ALTER TABLE IF EXISTS public.estoque_locais RENAME TO estoque_locais;
ALTER TABLE IF EXISTS public.estoque_locais RENAME CONSTRAINT estoque_locais_pkey TO estoque_locais_pkey;

-- ==========================================
-- 2. MÓDULO PRODUÇÃO
-- ==========================================

-- Renomeia producao_apontamentos -> producao_apontamentos
ALTER TABLE IF EXISTS public.producao_apontamentos RENAME TO producao_apontamentos;
ALTER TABLE IF EXISTS public.producao_apontamentos RENAME CONSTRAINT producao_apontamentos_pkey TO producao_apontamentos_pkey;

-- Renomeia producao_lotes_internos -> producao_producao_lotes_internos
ALTER TABLE IF EXISTS public.producao_lotes_internos RENAME TO producao_producao_lotes_internos;
ALTER TABLE IF EXISTS public.producao_producao_lotes_internos RENAME CONSTRAINT producao_lotes_internos_pkey TO producao_producao_lotes_internos_pkey;

-- Consolidando Ordens de Produção:
-- 1. Migração de Dados (DML): Movemos do modelo "Um para Um" (Legado) para o modelo "Cabeçalho + Itens" (Moderno)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'producao_ordens') THEN
        
        -- Insere os cabeçalhos na nova tabela (producao_ordens)
        -- Evitamos duplicidade se o ID já existir
        INSERT INTO public.producao_ordens (id, unidade_id, codigo, status, data_prevista, created_at, created_by)
        SELECT 
            id, 
            unidade_id, 
            lote_interno as codigo, 
            status, 
            data_inicio_producao as data_prevista,
            created_at,
            created_by
        FROM public.producao_ordens
        ON CONFLICT (id) DO NOTHING;

        -- Insere os itens vinculados na tabela de itens (producao_ordens_itens)
        -- Cada ordem legada vira um item na nova estrutura
        INSERT INTO public.producao_ordens_itens (ordem_id, receita_id, quantidade_planejada, quantidade_produzida, created_at)
        SELECT 
            id as ordem_id,
            receita_versao_id as receita_id,
            qtd_produzida as quantidade_planejada,
            qtd_produzida as quantidade_produzida, -- No legado a quantidade era única
            created_at
        FROM public.producao_ordens
        ON CONFLICT DO NOTHING;

        -- 2. Renomeia a tabela legada para preservação de histórico
        ALTER TABLE public.producao_ordens RENAME TO producao_ordens_legado;
    END IF;
END $$;

-- ==========================================
-- 3. AJUSTE DE REFERÊNCIAS EM TRIGGERS E FUNÇÕES
-- ==========================================

-- Atualiza trigger_estoque_descarte_to_ledger
CREATE OR REPLACE FUNCTION trigger_estoque_descarte_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
    v_conta_desperdicio_id UUID;
    v_transacao_id UUID;
    v_unidade_id UUID;
    v_custo NUMERIC;
BEGIN
    -- Checa se é 'SAIDA' motivada por Descarte/Vencimento
    IF NEW.tipo_movimento = 'SAIDA' AND NEW.justificativa ILIKE '%DESCARTADO%' THEN
        SELECT le.unidade_id, le.valor_unitario INTO v_unidade_id, v_custo
        FROM public.estoque_lotes le WHERE le.id = NEW.lote_id;

        v_custo := COALESCE(v_custo, 0) * NEW.quantidade_movimentada;

        IF v_custo > 0 THEN
            SELECT id INTO v_conta_desperdicio_id FROM public.fin_contas WHERE subtipo_usar = 'CUSTO_DESPERDICIO' AND ativo = true LIMIT 1;
            
            IF v_conta_desperdicio_id IS NOT NULL THEN
                INSERT INTO public.fin_transacoes (unidade_id, descricao, data_competencia, origem_modulo, origem_id, valor_total)
                VALUES (v_unidade_id, 'Descarte de Estoque: ' || NEW.justificativa, CURRENT_DATE, 'ESTOQUE', NEW.id, v_custo)
                RETURNING id INTO v_transacao_id;

                INSERT INTO public.fin_lancamentos (transacao_id, conta_id, tipo_lancamento, valor)
                VALUES (v_transacao_id, v_conta_desperdicio_id, 'DEBITO', v_custo);
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Atualiza trigger_producao_perda_to_ledger (se usava producao_ordens)
CREATE OR REPLACE FUNCTION trigger_producao_perda_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
    v_conta_desperdicio_id UUID;
    v_transacao_id UUID;
    v_unidade_id UUID;
BEGIN
    SELECT po.unidade_id INTO v_unidade_id
    FROM public.producao_ordens_itens poi
    JOIN public.producao_ordens po ON po.id = poi.ordem_id
    WHERE poi.id = NEW.item_ordem_id;

    -- Busca a conta USAR de "Desperdício"
    SELECT id INTO v_conta_desperdicio_id FROM public.fin_contas WHERE subtipo_usar = 'CUSTO_DESPERDICIO' AND ativo = true LIMIT 1;
    
    IF v_conta_desperdicio_id IS NOT NULL AND NEW.custo_estimado > 0 THEN
        INSERT INTO public.fin_transacoes (unidade_id, descricao, data_competencia, origem_modulo, origem_id, valor_total)
        VALUES (v_unidade_id, 'Perda de Produção (Motivo: ' || COALESCE(NEW.motivo_perda, 'N/A') || ')', CURRENT_DATE, 'DESPERDICIO', NEW.id, NEW.custo_estimado)
        RETURNING id INTO v_transacao_id;

        -- Aumento de Custo/Despesa é feito a Débito nas Partidas Dobradas
        INSERT INTO public.fin_lancamentos (transacao_id, conta_id, tipo_lancamento, valor)
        VALUES (v_transacao_id, v_conta_desperdicio_id, 'DEBITO', NEW.custo_estimado);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

