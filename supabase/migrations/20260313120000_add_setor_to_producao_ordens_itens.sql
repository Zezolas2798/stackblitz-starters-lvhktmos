-- Adiciona setor de produção por item da ordem (cada produto do cardápio pode ir para um setor)
-- Assim os ingredientes podem ser alocados/organizados por setor.
ALTER TABLE public.producao_ordens_itens
  ADD COLUMN IF NOT EXISTS setor_producao_id UUID REFERENCES public.cliente_setores_producao(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_producao_ordens_itens_setor ON public.producao_ordens_itens(setor_producao_id);

COMMENT ON COLUMN public.producao_ordens_itens.setor_producao_id IS 'Setor de produção para o qual este produto (receita) será produzido; usado para alocação de ingredientes por setor.';
