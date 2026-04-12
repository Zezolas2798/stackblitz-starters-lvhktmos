-- Migration to add is_sub_receita flag for recursive recipe usage filtering
ALTER TABLE public.receitas ADD COLUMN IF NOT EXISTS is_sub_receita BOOLEAN DEFAULT false;
