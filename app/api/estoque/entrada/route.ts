import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Schema Zod para DTO de Entrada de Lotes WMS (Rastreabilidade GxP)
const EntradaLoteSchema = z.object({
    ingrediente_id: z.string().uuid('ID de ingrediente inválido').nullable().optional(),
    material_id: z.string().uuid('ID de material inválido').nullable().optional(),
    unidade_id: z.string().uuid('ID de unidade operacional inválido'),
    fornecedor_id: z.string().uuid('Fornecedor inválido'),

    // Regra de Rastreabilidade Reversa (SIVISA/ANVISA)
    numero_lote_fabricante: z.string().nullable().optional(),
    nota_fiscal: z.string().nullable().optional(),
    registro_sif: z.string().nullable().optional(), // Cadastro inteligente via OCR (Carne/Laticínio)

    // Datas e Rastreios
    data_fabricacao: z.string().nullable().optional(),

    // Regra de Ponto de Segurança (Prevenção de entrada de lixo/vencido)
    data_validade_rotulo: z.string().nullable().optional(),
    data_validade_interna: z.string().nullable().optional(),

    quantidade_inicial_g_ml: z.number()
        .positive('A quantidade inicial deve ser maior que zero')
        .finite('A quantidade precisa ser numérica válida'),

    status: z.enum(['PREVISTO', 'QUARENTENA', 'APROVADO', 'REJEITADO', 'VENCIDO']),

    local_estoque_id: z.string().uuid('ID de local de estoque inválido').or(z.literal('')).optional().nullable(),
    categoria_produto: z.string().optional().nullable(),
    temperatura_recebimento: z.number().optional().nullable(),
    
    // Dados de Embalagem Originais (Fração)
    qtd_embalagens: z.number().optional().nullable(),
    peso_unitario_embalagem: z.number().optional().nullable(),
    unidade_peso_embalagem: z.string().optional().nullable(),
}).refine(data => data.ingrediente_id || data.material_id, {
    message: "É necessário informar o Ingrediente ou o Material",
    path: ["ingrediente_id"]
});

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');

        // Criando Client Isolado por Request herdando a Autenticação (JWT) do usuário para passar pelo RLS
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: {
                    Authorization: authHeader || ''
                }
            }
        });

        const body = await request.json();

        // Validação Segura Zod parseando o Body
        const parsedData = EntradaLoteSchema.safeParse(body);

        if (!parsedData.success) {
            return NextResponse.json(
                { erro: 'Falha na validação dos dados GxP', detalhes: parsedData.error.issues },
                { status: 400 }
            );
        }

        // Preparando Payload Autorizado (tabela "lotes_estoque")
        const payload = {
            ...parsedData.data,
            quantidade_atual_g_ml: parsedData.data.quantidade_inicial_g_ml, // O lote nasce cheio
        };

        const { data: record, error: dbError } = await (supabase as any).from('lotes_estoque')
            .insert([payload])
            .select()
            .single();

        if (dbError) {
            console.error('[API WMS] Falha fatal de inserção no estoque:', dbError);
            return NextResponse.json(
                { erro: 'Um erro interno impediu a persistência segura do Lote. Transação cancelada.', detalhes: dbError },
                { status: 500 }
            );
        }

        return NextResponse.json(record, { status: 201 });

    } catch (err: any) {
        console.error('[API WMS] Exceção não capturada em /estoque/entrada:', err.message);
        return NextResponse.json(
            { erro: 'Falha letal no protocolo de rede WMS. O sistema abortou a entrada de produto.' },
            { status: 500 }
        );
    }
}



