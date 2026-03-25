-- Migration: Add categorias_permitidas to cliente_locais_estoque
-- This allows linking storage locations to specific product categories

ALTER TABLE public.cliente_locais_estoque 
ADD COLUMN IF NOT EXISTS categorias_permitidas text[] DEFAULT '{}';

-- Optional: Initial mapping for existing locations (if any naming conventions match)
-- UPDATE public.cliente_locais_estoque SET categorias_permitidas = ARRAY['ALIMENTOS'] WHERE nome ILIKE '%alimento%' OR nome ILIKE '%geladeira%' OR nome ILIKE '%fria%';
