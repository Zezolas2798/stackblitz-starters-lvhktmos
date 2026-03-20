import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Setup de serviço para bypassar RLS em nivel de API (Servidor) e gravar de forma autoritativa.
// Para uma rota real baseada no usuário, usaríamos createRouteHandlerClient
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Schema Zod para DTO de Inserção de Produto SIVISA
// As regras do governanca/regras_sivisa.md exigem data de validade e data de emissão precisas.
const ProdutoBombeiroSchema = z.object({
    nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
    descricao: z.string().optional(),
    data_emissao: z.string().min(1, 'A data de emissão é de preenchimento obrigatório para auditoria GxP')
        .refine((val) => !isNaN(Date.parse(val)), { message: "Data de emissão com formato inválido" }),
    data_validade: z.string().min(1, 'A data de validade da licença/produto é obrigatória')
        .refine((val) => !isNaN(Date.parse(val)), { message: "Data de validade com formato inválido" }),
    status_sivisa: z.enum(['Aprovado', 'Aguardando Vistoria', 'Exigência']),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validação Segura Zod parseando o Body
        const parsedData = ProdutoBombeiroSchema.safeParse(body);

        if (!parsedData.success) {
            // Devolve 400 Bad Request com os erros formatados para o client sem vazar stack trace
            return NextResponse.json(
                { erro: 'Falha na validação dos dados de entrada', detalhes: parsedData.error.issues },
                { status: 400 }
            );
        }

        const { data: record, error: dbError } = await (supabase as any).from('produtos_bombeiros')
            .insert([parsedData.data])
            .select()
            .single();

        if (dbError) {
            // Regra: Isolamento de Erros da API - Não vazamos o rastreio interno do banco de dados (ex: '23505' stack de postgres)
            console.error('[API] Falha fatal de inserção SIVISA:', dbError.message);
            return NextResponse.json(
                { erro: 'Um erro interno impediu a persistência segura do Produto/Licença. Consulte o Suporte.' },
                { status: 500 }
            );
        }

        return NextResponse.json(record, { status: 201 });

    } catch (err: any) {
        // Isolamento de Exceções de Top-Level
        console.error('[API] Exceção não capturada em /produtos_bombeiros:', err.message);
        return NextResponse.json(
            { erro: 'Falha letal no protocolo de rede. O sistema isolou a requisição para segurança.' },
            { status: 500 }
        );
    }
}



