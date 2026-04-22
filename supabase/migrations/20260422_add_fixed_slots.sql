-- Migration: Adicionar campos fixo e fichas_fixas ao perfil_cardapio_slots
-- Permite marcar slots como fixos (ex: Arroz e Feijão todo dia no Prato Base)

ALTER TABLE perfil_cardapio_slots 
  ADD COLUMN IF NOT EXISTS fixo boolean NOT NULL DEFAULT false;

ALTER TABLE perfil_cardapio_slots 
  ADD COLUMN IF NOT EXISTS fichas_fixas uuid[] DEFAULT NULL;

COMMENT ON COLUMN perfil_cardapio_slots.fixo IS 'Se true, as fichas deste slot são fixas e não variam entre dias';
COMMENT ON COLUMN perfil_cardapio_slots.fichas_fixas IS 'Array de IDs de fichas_tecnicas_uan que devem ser usadas todo dia quando fixo=true';
