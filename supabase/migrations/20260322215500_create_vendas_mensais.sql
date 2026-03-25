-- Migration: Create fin_vendas_mensais table
-- Description: Stores monthly sales data for recipes to support Menu Engineering (BCG/Kasavana)

CREATE TABLE IF NOT EXISTS public.fin_vendas_mensais (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    receita_id UUID NOT NULL REFERENCES public.receitas(id) ON DELETE CASCADE,
    mes_ano DATE NOT NULL, -- Always first day of the month
    quantidade_vendida NUMERIC NOT NULL DEFAULT 0,
    preco_venda NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(cliente_id, receita_id, mes_ano)
);

-- Enable RLS
ALTER TABLE public.fin_vendas_mensais ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for now, matching other tables)
CREATE POLICY "Enable all for authenticated users" 
ON public.fin_vendas_mensais 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_update_fin_vendas_mensais_updated_at
BEFORE UPDATE ON public.fin_vendas_mensais
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
