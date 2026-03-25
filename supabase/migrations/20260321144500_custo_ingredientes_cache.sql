-- Fase 6: Inteligência de Custos (Precificação)
-- Adiciona cache de preços nos ingredientes e trigger para atualização em tempo real

-- 1. Criação das colunas de cache em ingredientes
ALTER TABLE public.ingredientes 
ADD COLUMN IF NOT EXISTS preco_ultima_compra NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS custo_medio NUMERIC DEFAULT 0;

-- 2. Função Trigger de Atualização do Custo do Ingrediente
CREATE OR REPLACE FUNCTION trigger_atualiza_custo_ingrediente()
RETURNS TRIGGER AS $$
DECLARE
    v_total_value NUMERIC := 0;
    v_total_quantity NUMERIC := 0;
    v_weighted_average NUMERIC := 0;
    v_latest_price NUMERIC := 0;
BEGIN
    -- Só age se o lote estiver atrelado a um ingrediente
    IF NEW.ingrediente_id IS NOT NULL THEN
        
        -- A. Cálculo do Custo Médio Ponderado
        -- Soma financeira do estoque dividido pela quantidade física
        SELECT 
            COALESCE(SUM(quantidade_atual * valor_unitario), 0),
            COALESCE(SUM(quantidade_atual), 0)
        INTO 
            v_total_value, 
            v_total_quantity
        FROM public.estoque_lotes
        WHERE ingrediente_id = NEW.ingrediente_id 
          AND quantidade_atual > 0
          AND (status_lote = 'ATIVO' OR status_lote = 'APROVADO'); -- Considera apenas lotes aptos

        IF v_total_quantity > 0 THEN
            v_weighted_average := v_total_value / v_total_quantity;
        ELSE
            -- Se zerou o estoque, mantém o último preço como referência de custo médio para não quebrar CMV teórico
            v_weighted_average := NEW.valor_unitario;
        END IF;

        -- B. Busca do Último Preço de Compra (Last Price)
        -- Pega a compra cronologicamente mais recente
        SELECT valor_unitario INTO v_latest_price
        FROM public.estoque_lotes
        WHERE ingrediente_id = NEW.ingrediente_id
          AND valor_unitario > 0
        ORDER BY data_recebimento DESC NULLS LAST, created_at DESC
        LIMIT 1;

        -- Fallback caso não encontre
        v_latest_price := COALESCE(v_latest_price, NEW.valor_unitario, 0);

        -- C. Atualiza o cache na tabela principal de ingredientes
        UPDATE public.ingredientes
        SET 
            preco_ultima_compra = v_latest_price,
            custo_medio = v_weighted_average
        WHERE id = NEW.ingrediente_id;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Acoplando o Trigger na tabela de Lotes (Compras)
DROP TRIGGER IF EXISTS atualiza_custo_ingrediente_trigger ON public.estoque_lotes;
CREATE TRIGGER atualiza_custo_ingrediente_trigger
AFTER INSERT OR UPDATE OF quantidade_atual, valor_unitario, status_lote
ON public.estoque_lotes
FOR EACH ROW EXECUTE FUNCTION trigger_atualiza_custo_ingrediente();

-- Opcional: Script para forçar a sincronização de dados antigos, se existissem.
-- UPDATE public.estoque_lotes set updated_at = NOW() WHERE valor_unitario > 0;
