import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { full_name, email, cpf, registro_profissional, role_id, unidade_ids } = await req.json()

    // 1. Criar Usuário no Auth (Admin)
    // Se o usuário já existe, o invite falha ou reenvia. 
    // Usamos createUser para maior controle ou inviteUserByEmail.
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name }
    })

    if (authError) throw authError

    const userId = authUser.user.id

    // 2. Atualizar/Criar Perfil
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: userId,
        full_name,
        email,
        cpf,
        registro_profissional,
        updated_at: new Date()
      })

    if (profileError) throw profileError

    // 3. Criar Memberships (Múltiplas Unidades)
    if (unidade_ids && Array.isArray(unidade_ids)) {
      // Remover associações anteriores se houver (opcional para invite novo, mas bom para idempotência)
      // Para convite novo, não deve ter.
      
      const memberships = unidade_ids.map(uId => ({
        usuario_id: userId,
        role_id: role_id,
        unidade_id: uId,
        ativo: true
      }))

      const { error: memError } = await supabaseClient
        .from('app_user_memberships')
        .insert(memberships)

      if (memError) throw memError
    }

    return new Response(JSON.stringify({ message: 'Convite enviado com sucesso', userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
