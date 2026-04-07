-- 1. ADICIONANDO LEAD TIME NO FORNECEDOR (Opção A)
ALTER TABLE public.fornecedores 
ADD COLUMN IF NOT EXISTS lead_time_dias NUMERIC DEFAULT 3;

COMMENT ON COLUMN public.fornecedores.lead_time_dias IS 'Tempo padronizado em dias que o fornecedor leva para entregar o pedido (Lead Time global)';

-- 2. ADICIONANDO PARAMETRIZAÇÃO DE ESTOQUE NOS INGREDIENTES
ALTER TABLE public.ingredientes
ADD COLUMN IF NOT EXISTS uso_medio_diario NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS estoque_seguranca_perc INTEGER DEFAULT 20;

COMMENT ON COLUMN public.ingredientes.uso_medio_diario IS 'Consumo médio diário (ADU) do insumo (kg/l/und). Inicialmente manual, depois automatizado pelo PDV/Fichas.';
COMMENT ON COLUMN public.ingredientes.estoque_seguranca_perc IS 'Porcentagem de margem de segurança (Safety Stock) aplicada sobre a demanda do Lead Time.';

-- 3. CRIANDO VIEW DE CONTRATOS/CUSTOS PARA A MATRIZ DE KRALJIC
-- Para o eixo Y (Impacto Financeiro), precisamos saber qual o gasto estimado. Impacto = (Custo Un. * ADU * 30).
-- Para o eixo X (Risco), usaremos contagem de fornecedores e o lead time deles.
CREATE OR REPLACE VIEW gerencial_compras_kraljic_base AS
WITH fornecedores_por_item AS (
    SELECT 
        o.ingrediente_id,
        MIN(o.preco_por_kg_l) AS menor_preco,
        COUNT(DISTINCT o.fornecedor_id) AS qtd_fornecedores,
        MAX(f.lead_time_dias) AS lead_time_max
    FROM compras_orcamentos o
    JOIN fornecedores f ON o.fornecedor_id = f.id
    GROUP BY o.ingrediente_id
),
estoque_por_item AS (
    SELECT 
        ingrediente_id,
        SUM(quantidade_atual) AS total_estoque
    FROM estoque_lotes
    WHERE quantidade_atual > 0
    GROUP BY ingrediente_id
)
SELECT 
    i.id AS ingrediente_id,
    i.nome AS ingrediente_nome,
    i.categoria_produto_id,
    i.uso_medio_diario,
    i.estoque_seguranca_perc,
    COALESCE(e.total_estoque, 0) AS estoque_atual,
    COALESCE(f_info.menor_preco, 0) AS custo_referencia,
    COALESCE(f_info.qtd_fornecedores, 0) AS fornecedores_ativos,
    COALESCE(f_info.lead_time_max, 5) AS lead_time_considerado
FROM ingredientes i
LEFT JOIN fornecedores_por_item f_info ON i.id = f_info.ingrediente_id
LEFT JOIN estoque_por_item e ON i.id = e.ingrediente_id;

-- FIM DA MIGRAÇÃO
