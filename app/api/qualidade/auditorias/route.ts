import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Servidor Blindado vs RLS Local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Schema para Validação Autorizada (GxP) de Deleções
const DeleteSchema = z.object({
    id: z.string().uuid('ID de Auditoria Inválido'),
});

export async function DELETE(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');

        // Conexão instanciada sob a Identidade RLS do Auditor que enviou a requisição
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: {
                    Authorization: authHeader || ''
                }
            }
        });

        const body = await request.json();
        const parsedData = DeleteSchema.safeParse(body);

        if (!parsedData.success) {
            return NextResponse.json(
                { erro: 'Requisição inválida (Sintaxe ID)', detalhes: parsedData.error.format() },
                { status: 400 }
            );
        }

        const { id } = parsedData.data;

        // Ao invés de purgar o laudo físico (proibido pela RDC 216), marcamos `deleted_at` nulo/datatime
        const { data, error: dbError } = await (supabase as any).from('checklist_auditorias')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .select();

        if (dbError) {
            console.error('Falha de banco na inativação da Auditoria:', dbError);
            return NextResponse.json(
                { erro: 'Intervenção interna travou a ocultação do Laudo.', dbDetalhes: dbError.message },
                { status: 500 }
            );
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ erro: 'Laudo/Auditoria não encontrado ou sem permissão.' }, { status: 404 });
        }

        return NextResponse.json({ sucesso: true, mensagem: 'Laudo de Auditoria Arquivado (Soft Delete).' }, { status: 200 });

    } catch (error: any) {
        console.error('Erro na Rota de Inativação Qualidade:', error);
        return NextResponse.json({ erro: 'Erro Severo do Sistema de Qualidade', detalhes: error.message }, { status: 500 });
    }
}



