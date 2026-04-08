-- Adiciona coluna deleted_at para suporte a Soft Delete (GxP Compliance)
ALTER TABLE checklist_auditorias ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE checklist_modelos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE checklist_secoes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE checklist_itens ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE checklist_respostas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE cliente_controle_temperatura ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
