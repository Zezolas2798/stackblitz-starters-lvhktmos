-- 1. Criar a tabela principal de Orçamentos/Cotações
CREATE TABLE IF NOT EXISTS compras_orcamentos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id uuid REFERENCES clientes(id) NOT NULL,
    unidade_id uuid REFERENCES cliente_unidades(id) NOT NULL,
    fornecedor_id uuid REFERENCES fornecedores(id) NOT NULL,
    ingrediente_id uuid REFERENCES ingredientes(id) NOT NULL,
    
    -- Vigência
    data_orcamento date NOT NULL DEFAULT current_date,
    
    -- Formato de Cotação
    is_embalagem boolean DEFAULT false,
    unidades_por_embalagem numeric,
    peso_volume_por_unidade numeric,
    
    -- Financeiro
    preco_embalagem numeric,         -- Preço total da caixa/fardo (se is_embalagem)
    preco_por_kg_l numeric NOT NULL, -- Custo estandardizado por Kg/L
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- 2. Habilitar RLS
ALTER TABLE compras_orcamentos ENABLE ROW LEVEL SECURITY;

-- 3. Policy Isolamento Multitenant
CREATE POLICY "Acesso completo aos orçamentos do cliente logado" ON compras_orcamentos
    FOR ALL USING (cliente_id IN (
        SELECT cliente_id FROM perfis WHERE perfis.id = auth.uid()
    ));

-- 4. Criamos um índice retroativo rápido para query Kraljic (procurar todos fornecedores que atendem categoria X)
-- Se categorias_compras já for array na tabela fornecedor, podemos fazer Query array. 
-- "categorias_compras text[]" está presente na tabela de fornecedores, não requer CREATE INDEX nativo complexo para POC, mas criamos um Indice GIN no futuro se a performance pedir.

-- O Supabase CLI Sync executará este script de infra.
