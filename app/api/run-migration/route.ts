import { NextResponse } from 'next/server';

// Requires service role key to execute raw SQL via RPC or REST API, but Supabase doesn't support raw SQL over REST.
// We will have to skip standard migrations and just use TypeScript to assume the column exists, advising the user to run the SQL manually.

/** Rota desabilitada em produção por segurança (revela estrutura do schema). */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({
    message: 'Please run this SQL manually in your Supabase SQL Editor:',
    sql: 'ALTER TABLE public.ingredientes ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES public.grupos_produto(id) ON DELETE SET NULL; CREATE INDEX IF NOT EXISTS idx_ingredientes_categoria_id ON public.ingredientes(grupo_id);',
  });
}



