-- 1. Add `categoria_produto_id` to `ingredientes`
ALTER TABLE public.ingredientes
ADD COLUMN categoria_produto_id UUID REFERENCES public.cliente_categorias_produto(id) ON DELETE SET NULL;

-- 2. Optional: Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_ingredientes_categoria_id ON public.ingredientes(categoria_produto_id);
