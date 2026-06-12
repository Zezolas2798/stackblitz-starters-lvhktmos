-- Migration para adicionar a coluna preco_venda na tabela receitas
ALTER TABLE receitas ADD COLUMN IF NOT EXISTS preco_venda NUMERIC(10,2) DEFAULT 0.00;
