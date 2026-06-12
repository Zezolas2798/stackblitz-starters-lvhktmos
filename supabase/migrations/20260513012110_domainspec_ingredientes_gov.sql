-- Migration para GAP-GOV-001
-- Implementa validação Server-Side para propriedades transgênicas de ingredientes.

-- Função para validar e higienizar os campos transgênicos "em voo"
CREATE OR REPLACE FUNCTION public.tg_ingredientes_gov_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- RegraGMOAditivo & RegraGMOCleanup:
    -- Se o ingrediente for 'ADITIVO' ou se is_transgenico for explicitamente falso
    IF NEW.tipo_ingrediente = 'ADITIVO' OR NEW.is_transgenico = false THEN
        NEW.is_transgenico := false;
        NEW.especie_transgenica := null;
        NEW.especie_doadora := null;
        NEW.transgenicos := '[]'::jsonb;
    END IF;

    -- RegraTransgenicosArray:
    -- Garantir que transgenicos seja um JSONB array válido se for nulo ou se não for array
    IF NEW.transgenicos IS NULL OR jsonb_typeof(NEW.transgenicos) != 'array' THEN
        NEW.transgenicos := '[]'::jsonb;
    END IF;

    RETURN NEW;
END;
$function$;

-- Drop trigger if exists e recria
DROP TRIGGER IF EXISTS trg_ingredientes_gov_rules_trigger ON public.ingredientes;

CREATE TRIGGER trg_ingredientes_gov_rules_trigger
BEFORE INSERT OR UPDATE
ON public.ingredientes
FOR EACH ROW
EXECUTE FUNCTION public.tg_ingredientes_gov_rules();
