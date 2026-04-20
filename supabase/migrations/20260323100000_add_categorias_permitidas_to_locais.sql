-- Migration: Add categorias_permitidas to cliente_estoque_locais
-- This allows linking storage locations to specific product categories

ALTER TABLE public.cliente_estoque_locais 
ADD COLUMN IF NOT EXISTS categorias_permitidas text[] DEFAULT '{}';

-- Optional: Initial mapping for existing locations (if any naming conventions match)
-- UPDATE public.cliente_estoque_locais SET categorias_permitidas = ARRAY['ALIMENTOS'] WHERE nome ILIKE '%alimento%' OR nome ILIKE '%geladeira%' OR nome ILIKE '%fria%';

