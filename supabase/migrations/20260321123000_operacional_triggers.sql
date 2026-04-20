-- Fase 4: Controle e Integração Operacional Profunda
-- Adicionando Classificação de Custos, Flag Cardápio e Triggers de Operação.

-- 1. Classificação de Custos
CREATE TYPE fin_comportamento_custo AS ENUM ('FIXO', 'VARIAVEL', 'MISTO', 'NAO_APLICAVEL');
CREATE TYPE fin_alocacao_custo AS ENUM ('DIRETO', 'INDIRETO', 'NAO_APLICAVEL');

ALTER TABLE public.fin_contas 
ADD COLUMN IF NOT EXISTS comportamento_custo fin_comportamento_custo DEFAULT 'NAO_APLICAVEL',
ADD COLUMN IF NOT EXISTS alocacao_custo fin_alocacao_custo DEFAULT 'NAO_APLICAVEL';

-- 2. Conectando Fichas Técnicas ao Cardápio Vendável
ALTER TABLE public.receitas
ADD COLUMN IF NOT EXISTS is_menu_item BOOLEAN DEFAULT false; 

-- 3. Triggers de Perda de Produção -> Custo de Desperdício (Ledger)
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

DROP TRIGGER IF EXISTS producao_perda_to_ledger_trigger ON public.producao_perdas;
CREATE TRIGGER producao_perda_to_ledger_trigger
AFTER INSERT ON public.producao_perdas
FOR EACH ROW EXECUTE FUNCTION trigger_producao_perda_to_ledger();

-- 4. Triggers de Descarte de Estoque -> Custo de Desperdício
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

DROP TRIGGER IF EXISTS estoque_descarte_to_ledger_trigger ON public.estoque_movimentacoes;
CREATE TRIGGER estoque_descarte_to_ledger_trigger
AFTER INSERT ON public.estoque_movimentacoes
FOR EACH ROW EXECUTE FUNCTION trigger_estoque_descarte_to_ledger();

-- 5. Trigger de Compras -> Título em Contas a Pagar (Obrigação)
CREATE OR REPLACE FUNCTION trigger_estoque_compra_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
    v_conta_passivo_id UUID;
    v_conta_custo_insumo_id UUID;
    v_transacao_id UUID;
    v_valor_total NUMERIC;
BEGIN
    -- Se tem fornecedor e preço, foi uma COMPRA de insumo.
    IF NEW.fornecedor_id IS NOT NULL AND NEW.valor_unitario > 0 THEN
        v_valor_total := NEW.valor_unitario * NEW.quantidade_atual;
        
        -- Busca conta de "Contas a Pagar / Passivo" e conta de "Custo Insumos"
        SELECT id INTO v_conta_passivo_id FROM public.fin_contas WHERE tipo = 'PASSIVO' AND ativo = true LIMIT 1;
        SELECT id INTO v_conta_custo_insumo_id FROM public.fin_contas WHERE tipo = 'DESPESA' AND ativo = true LIMIT 1;

        IF v_conta_passivo_id IS NOT NULL AND v_valor_total > 0 THEN
            INSERT INTO public.fin_transacoes (unidade_id, descricao, data_competencia, origem_modulo, origem_id, valor_total)
            VALUES (NEW.unidade_id, 'Entrada de Lote/NF: ' || COALESCE(NEW.nota_fiscal, 'S/N'), CURRENT_DATE, 'ESTOQUE', NEW.id, v_valor_total)
            RETURNING id INTO v_transacao_id;

            -- Aumento de Passivo (Dívida) = Crédito
            INSERT INTO public.fin_lancamentos (transacao_id, conta_id, tipo_lancamento, valor)
            VALUES (v_transacao_id, v_conta_passivo_id, 'CREDITO', v_valor_total);
            
            -- Aumento de Custo/Ativo = Débito
            IF v_conta_custo_insumo_id IS NOT NULL THEN
                INSERT INTO public.fin_lancamentos (transacao_id, conta_id, tipo_lancamento, valor)
                VALUES (v_transacao_id, v_conta_custo_insumo_id, 'DEBITO', v_valor_total);
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS estoque_compra_to_ledger_trigger ON public.estoque_lotes;
CREATE TRIGGER estoque_compra_to_ledger_trigger
AFTER INSERT ON public.estoque_lotes
FOR EACH ROW EXECUTE FUNCTION trigger_estoque_compra_to_ledger();

