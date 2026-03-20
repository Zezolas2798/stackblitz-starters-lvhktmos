import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Setup Base de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Schema para Validação de Parâmetros de Deleção (Ids) -> Só Aceita UUID
const DeleteSchema = z.object({
    id: z.string().uuid('ID de Receita Inválido'),
});

export async function DELETE(request: Request) {
    try {
        // Pega Token de Autorização GxP (Herança da UI)
        const authHeader = request.headers.get('Authorization');

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: {
                    Authorization: authHeader || ''
                }
            }
        });

        // Parseamos o Body para achar o ID (Exclusão Segura não usa Param URL por Restrição GxP)
        const body = await request.json();

        const parsedData = DeleteSchema.safeParse(body);

        if (!parsedData.success) {
            return NextResponse.json(
                { erro: 'Falha de validação', detalhes: parsedData.error.format() },
                { status: 400 }
            );
        }

        const { id } = parsedData.data;

        // 1. Em vez de hard delete, efetuamos a inativação rastreável (Soft Delete)
        // Isso preserva os laudos do passado onde esta Receita foi usada na produção
        const { data, error: dbError } = await (supabase as any).from('receitas')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .select();

        if (dbError) {
            console.error('Erro no Supabase:', dbError);
            return NextResponse.json(
                { erro: 'Um erro interno impediu o repúdio da Receita. Transação cancelada.', dbDetalhes: dbError.message },
                { status: 500 }
            );
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ erro: 'Receita não encontrada ou sem permissão de acesso.' }, { status: 404 });
        }

        return NextResponse.json({ sucesso: true, mensagem: 'Receita inativada com sucesso.' }, { status: 200 });

    } catch (error: any) {
        console.error('Erro na API de exclusão de Receita:', error);
        return NextResponse.json({ erro: 'Erro interno do Servidor', detalhes: error.message }, { status: 500 });
    }
}



