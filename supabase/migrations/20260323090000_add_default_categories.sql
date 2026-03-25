-- Migration: Add new categories to cliente_categorias_produto for all existing clients
-- This ensures the new categories appear in configuration and dropdowns

INSERT INTO public.cliente_categorias_produto (cliente_id, nome)
SELECT c.id, cat.nome
FROM public.clientes c
CROSS JOIN (
    SELECT 'Utensílios' as nome UNION ALL
    SELECT 'EPIs/EPCs' UNION ALL
    SELECT 'Uniformes' UNION ALL
    SELECT 'Primeiros Socorros'
) as cat
LEFT JOIN public.cliente_categorias_produto existing 
    ON existing.cliente_id = c.id AND existing.nome = cat.nome
WHERE existing.id IS NULL;
