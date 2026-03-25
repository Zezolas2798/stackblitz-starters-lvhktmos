-- Atualização de Compras e Financeiro (Data Limite de Pagamento)

-- 1. Cria novas colunas financeiras na tabela do estoque e transações
ALTER TABLE public.estoque_lotes 
ADD COLUMN IF NOT EXISTS valor_total NUMERIC,
ADD COLUMN IF NOT EXISTS data_vencimento_pagamento DATE;

ALTER TABLE public.fin_transacoes
ADD COLUMN IF NOT EXISTS data_vencimento DATE;

-- 2. Atualiza o Trigger de Compras para capturar Data de Vencimento
CREATE OR REPLACE FUNCTION trigger_estoque_compra_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
    v_conta_passivo_id UUID;
    v_conta_custo_insumo_id UUID;
    v_transacao_id UUID;
    v_valor_total NUMERIC;
    v_vencimento DATE;
BEGIN
    -- Se tem fornecedor e um valor financeiro lido:
    IF NEW.fornecedor_id IS NOT NULL AND (NEW.valor_unitario > 0 OR NEW.valor_total > 0) THEN
        -- Priorizamos o campo valor_total criado pelo front, se não existir, calcula via unitário.
        v_valor_total := COALESCE(NEW.valor_total, NEW.valor_unitario * NEW.quantidade_atual);
        v_vencimento := COALESCE(NEW.data_vencimento_pagamento, CURRENT_DATE);

        -- Busca contas USAR padronizadas de Fornecedores e Custo de Insumo
        SELECT id INTO v_conta_passivo_id FROM public.fin_contas WHERE tipo = 'PASSIVO' AND ativo = true LIMIT 1;
        SELECT id INTO v_conta_custo_insumo_id FROM public.fin_contas WHERE tipo = 'DESPESA' AND ativo = true LIMIT 1;

        IF v_conta_passivo_id IS NOT NULL AND v_valor_total > 0 THEN
            INSERT INTO public.fin_transacoes (unidade_id, descricao, data_competencia, data_vencimento, origem_modulo, origem_id, valor_total)
            VALUES (NEW.unidade_id, 'Entrada de Compra (NF: ' || COALESCE(NEW.nota_fiscal, 'S/N') || ')', CURRENT_DATE, v_vencimento, 'ESTOQUE', NEW.id, v_valor_total)
            RETURNING id INTO v_transacao_id;

            -- Credita no Passivo (Cria a Obrigação / Contas a Pagar)
            INSERT INTO public.fin_lancamentos (transacao_id, conta_id, tipo_lancamento, valor)
            VALUES (v_transacao_id, v_conta_passivo_id, 'CREDITO', v_valor_total);
            
            -- Debita no Ativo/Custo (Apropriação do Insumo)
            IF v_conta_custo_insumo_id IS NOT NULL THEN
                INSERT INTO public.fin_lancamentos (transacao_id, conta_id, tipo_lancamento, valor)
                VALUES (v_transacao_id, v_conta_custo_insumo_id, 'DEBITO', v_valor_total);
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- O trigger já existe do arquivo anterior, recriar a procudeur vai sobescrevê-lo se as the rules fire 
-- But keeping CREATE OR REPLACE FUNCTION safely overrides it under the same name.
