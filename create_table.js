import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Faltam variáveis de ambiente do Supabase");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Criando tabela cliente_setores_producao...");

    // Como estamos rodando pelo client anon/service_role, a melhor forma de criar tabela
    // dinamicamente sem o psql é executando uma query RPC (se existir) ou via REST.
    // Entretanto, a API REST do Supabase Client *não permite* DDL (CREATE TABLE) diretamente
    // a menos que chamemos uma function `exec_sql`.

    // Vamos tentar usar a function exec_sql se você tiver criado uma no passado:
    const query = `
    CREATE TABLE IF NOT EXISTS public.cliente_setores_producao (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      cliente_id uuid NOT NULL,
      nome character varying NOT NULL,
      ativo boolean DEFAULT true NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT cliente_setores_producao_pkey PRIMARY KEY (id),
      CONSTRAINT cliente_setores_producao_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE
    );

    -- Habilitando RLS e politicas (com IF NOT EXISTS para evitar erro se rodar 2x)
    ALTER TABLE public.cliente_setores_producao ENABLE ROW LEVEL SECURITY;
    
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cliente_setores_producao' AND policyname = 'Enable read access for all users') THEN
            CREATE POLICY "Enable read access for all users" ON public.cliente_setores_producao FOR SELECT USING (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cliente_setores_producao' AND policyname = 'Enable insert for authenticated users only') THEN
            CREATE POLICY "Enable insert for authenticated users only" ON public.cliente_setores_producao FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cliente_setores_producao' AND policyname = 'Enable update for authenticated users only') THEN
            CREATE POLICY "Enable update for authenticated users only" ON public.cliente_setores_producao FOR UPDATE USING (auth.role() = 'authenticated');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cliente_setores_producao' AND policyname = 'Enable delete for authenticated users only') THEN
            CREATE POLICY "Enable delete for authenticated users only" ON public.cliente_setores_producao FOR DELETE USING (auth.role() = 'authenticated');
        END IF;
    END
    $$;
  `;

    // A abordagem padrão da DDL via cliente JS em Supabase requer o uso da Dashboard, psql local 
    // com string de conexão direta ao Postgres ou CLI do supabase. 
    // O SDK javascript padrão não executa CREATE TABLE por questões de segurança da PostgREST.
    console.log("Por limitação da arquitetura do Supabase via PostgREST, a criação de tabelas (DDL)");
    console.log("não é permitida via SDK JavaScript (supabase-js).");
}

run();
