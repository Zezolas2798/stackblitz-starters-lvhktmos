import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Setup cliente Supabase mock/teste usando env variables locais garantindo anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Inicializa o cliente real (não vamos mockar para testar RLS e Restrições na veia)
const supabase = createClient(supabaseUrl, supabaseKey);

describe('API de Inserção Regulada: /api/produtos_bombeiros', () => {

    describe('Adversarial Testing (FALHAS ESPERADAS - Fase RED do TDD)', () => {

        it('DEVE FALHAR ao tentar inserir um produto sem data_emissao ou data_validade', async () => {
            // Regra SIVISA violada propositalmente
            const requestPayloadBase = {
                nome: "Extintor Padrão B",
                descricao: "Payload malicioso faltando licencas vitais",
                // status_sivisa: não envio para testar fallback
            };

            // Tenta inserir direto pelo cliente supabase ao inves de rota NEXT pra provar o banco caindo
            const { data, error } = await supabase
                .from('produtos_bombeiros')
                .insert([requestPayloadBase])
                .select();

            // Nós EXIGIMOS que isso acuse ERRO e não deixe passar.
            expect(error).not.toBeNull();
            expect(error?.code).toBe('23502'); // PostgREST / Postgres Null Constraint Violation code (NOT NULL na tabela)
        });

        it('DEVE FALHAR ao enviar status SIVISA que não consta no enumerador aprovado', async () => {
            // Envio um status zombeteiro fora do CHECK IN da tabela (Aprovado, Aguardando Vistoria, Exigência)
            const payloadCheckViolation = {
                nome: "Mangueira C",
                data_emissao: "2024-01-01",
                data_validade: "2028-01-01",
                status_sivisa: "VISTORIA HACKEADA",
            };

            const { error } = await supabase
                .from('produtos_bombeiros')
                .insert([payloadCheckViolation]);

            expect(error).not.toBeNull();
            expect(error?.message).toContain('violates check constraint');
        });

        it('DEVE FALHAR (Ocultar RLS) ao tentar ler produtos com deleted_at = now() [Regra Governança Mdc]', async () => {
            // Prova de fogo do SOFT DELETE: Tentar buscar produtos marcados como deletados
            const { data, error } = await supabase
                .from('produtos_bombeiros')
                .select('*')
                .not('deleted_at', 'is', null);

            // Como o RLS está protegendo, mesmo que existam, pro usuario anonimo volta array nulo/vazio
            // Sem vazar erro
            expect(data).toHaveLength(0);
        });
    });
});
