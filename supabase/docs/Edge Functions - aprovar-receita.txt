// supabase/functions/aprovar-receita/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // 1. Configuração ADMIN e CLIENTE
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error('Configuração incompleta: variáveis de ambiente ausentes.');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado: Token ausente.');
    }

    // Client Autenticado - Respeita RLS (Row Level Security)
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Client Admin - Apenas para operações restritas do sistema
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Não autorizado: Token inválido.');
    }

    const userId = user.id;

    const { receita_id, motivo_aprovacao } = await req.json();
    if (!receita_id) throw new Error("ID da receita é obrigatório.");

    console.log(`[Aprovar] Iniciando para Receita: ${receita_id} (User: ${userId})`);

    // 2. Busca Dados da Receita (Usando o client autenticado para garantir que o usuário tenha acesso RLS à receita)
    const { data: receita, error: errRec } = await supabaseClient
      .from('receitas')
      .select('*, composicao_receitas(*)')
      .eq('id', receita_id)
      .single();

    if (errRec || !receita) {
      throw new Error(`Erro ao buscar receita ou acesso negado (RLS): ${errRec?.message}`);
    }

    // 3. BUSCA MANUAL DE NOMES (Evita erro PGRST200)
    const ingredienteIds = receita.composicao_receitas
      .filter((item: any) => item.item_type === 'ingrediente')
      .map((item: any) => item.item_id);

    let mapaNomes = new Map<string, string>();

    if (ingredienteIds.length > 0) {
      const { data: ingredientesData } = await supabaseAdmin
        .from('ingredientes')
        .select('id, nome')
        .in('id', ingredienteIds);

      if (ingredientesData) {
        ingredientesData.forEach((ing: any) => mapaNomes.set(ing.id, ing.nome));
      }
    }

    // 4. Invoca Cálculo Nutricional
    const calcUrl = `${supabaseUrl}/functions/v1/calcular-nutrientes`;
    const calcResponse = await fetch(calcUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ receita_id: receita_id })
    });

    if (!calcResponse.ok) {
      const txt = await calcResponse.text();
      throw new Error(`Falha no cálculo nutricional: ${txt}`);
    }

    const dadosNutricionaisCalculados = await calcResponse.json();

    // 5. Monta o Snapshot
    const snapshotComposicao = receita.composicao_receitas.map((item: any) => {
      let nomeSnapshot = 'Item desconhecido';
      if (item.item_type === 'ingrediente') {
        nomeSnapshot = mapaNomes.get(item.item_id) || 'Ingrediente Excluído';
      } else if (item.item_type === 'receita') {
        nomeSnapshot = 'Sub-receita';
      }

      return {
        item_id: item.item_id,
        nome_snapshot: nomeSnapshot,
        quantidade: item.peso_liquido_g,
        unidade: 'g',
        tipo: item.item_type
      };
    });

    // 6. CÁLCULO SEGURO DA VERSÃO (A Correção do Erro de Duplicidade)
    // Em vez de confiar no contador da receita, perguntamos qual é a MAIOR versão que já existe no histórico.
    const { data: ultimaVersaoData, error: errVer } = await supabaseAdmin
      .from('receitas_versoes')
      .select('versao')
      .eq('receita_id', receita_id)
      .order('versao', { ascending: false })
      .limit(1);

    let proximaVersao = 1;
    if (ultimaVersaoData && ultimaVersaoData.length > 0) {
      proximaVersao = ultimaVersaoData[0].versao + 1;
    }

    console.log(`[Aprovar] Versão calculada: ${proximaVersao}`);

    // 7. Grava Versão (Snapshot)
    const { error: errInsert } = await supabaseAdmin
      .from('receitas_versoes')
      .insert({
        receita_id: receita_id,
        versao: proximaVersao, // Usamos o valor calculado seguramente
        nome_snapshot: receita.nome,
        modo_preparo_snapshot: receita.modo_preparo,
        rendimento_snapshot: receita.rendimento_total_g,
        composicao_snapshot: snapshotComposicao,
        tabela_nutricional_snapshot: dadosNutricionaisCalculados,
        aprovado_por: userId,
        motivo_alteracao: motivo_aprovacao || 'Aprovação',
        data_aprovacao: new Date().toISOString()
      });

    if (errInsert) {
      // Se ainda assim der erro (race condition raríssima), tentamos +1
      if (errInsert.message.includes('unique constraint')) {
        throw new Error('Conflito de versão detectado. Por favor, tente clicar em Aprovar novamente.');
      }
      throw new Error(`Erro ao gravar histórico: ${errInsert.message}`);
    }

    // 8. Atualiza Receita Original
    const { error: errUpdate } = await supabaseAdmin
      .from('receitas')
      .update({
        status: 'APROVADA',
        versao_atual: proximaVersao,
        updated_at: new Date().toISOString()
      })
      .eq('id', receita_id);

    if (errUpdate) throw new Error(`Erro ao atualizar status: ${errUpdate.message}`);

    return new Response(JSON.stringify({
      success: true,
      versao: proximaVersao,
      message: "Receita aprovada com sucesso."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("ERRO:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});