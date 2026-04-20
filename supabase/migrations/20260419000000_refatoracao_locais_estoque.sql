-- Migration: Refatoração da Tabela Locais de Estoque
-- Objetivo: Alinhar com a nova arquitetura de taxonomia removendo "cliente_" e renomeando categoria

-- 1. Renomeia a Tabela Principal
ALTER TABLE IF EXISTS public.cliente_estoque_locais 
RENAME TO estoque_locais;

-- 2. Renomeia a Coluna de Categorias Permitidas (array de strings que contem modalidade ou uuid)
ALTER TABLE IF EXISTS public.estoque_locais
RENAME COLUMN categorias_permitidas TO grupos_permitidos_ids;

