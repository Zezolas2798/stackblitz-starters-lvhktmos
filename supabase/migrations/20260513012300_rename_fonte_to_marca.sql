-- Renaming `fonte` to `marca` in `ingredientes` to standardize terminology (ONT-001)
ALTER TABLE public.ingredientes RENAME COLUMN fonte TO marca;
