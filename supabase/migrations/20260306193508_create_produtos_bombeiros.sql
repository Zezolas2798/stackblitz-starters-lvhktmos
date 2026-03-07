-- Criação da tabela produtos_bombeiros baseada nas regras de governança

CREATE TABLE public.produtos_bombeiros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    
    -- Regras de Licenciamento (regras_sivisa.md)
    data_emissao DATE NOT NULL,
    data_validade DATE NOT NULL,
    status_sivisa TEXT CHECK (status_sivisa IN ('Aprovado', 'Aguardando Vistoria', 'Exigência')) DEFAULT 'Aguardando Vistoria',

    -- Trilha de Auditoria e Soft Delete (banco_de_dados.md)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Index para otimização de consultas de soft delete
CREATE INDEX idx_produtos_bombeiros_ativo ON public.produtos_bombeiros(id) WHERE deleted_at IS NULL;

-- Trigger para auto-atualizar o updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_produtos_bombeiros_updated
    BEFORE UPDATE ON public.produtos_bombeiros
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Políticas RLS genéricas para demonstração (na prática seriam rigorosas)
ALTER TABLE public.produtos_bombeiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Soft delete hide deleted records"
ON public.produtos_bombeiros FOR SELECT
USING (deleted_at IS NULL);
