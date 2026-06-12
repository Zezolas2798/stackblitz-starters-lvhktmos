-- Adiciona campos de detalhamento de cotação ao compras_orcamentos
-- para registrar a marca, descrição original e peso da embalagem
-- que o fornecedor cotou, mesmo quando o ingrediente_id aponta
-- para o ingrediente genérico do subgrupo.

ALTER TABLE public.compras_orcamentos ADD COLUMN IF NOT EXISTS marca_cotada TEXT;
ALTER TABLE public.compras_orcamentos ADD COLUMN IF NOT EXISTS descricao_fornecedor TEXT;
ALTER TABLE public.compras_orcamentos ADD COLUMN IF NOT EXISTS peso_embalagem_kg NUMERIC;
