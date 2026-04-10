import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { email, full_name, role_id, unidade_id, cpf, registro_profissional } = await req.json();

    if (!email || !full_name) {
      throw new Error("Email e Nome Completo são obrigatórios.");
    }

    // 1. Convidar usuário (Auth Admin)
    const { data: inviteData, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name },
      redirectTo: Deno.env.get("APP_URL") || "http://localhost:5173",
    });

    if (inviteError) throw inviteError;
    const userId = inviteData.user.id;

    // 2. Atualizar Perfil (profiles)
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .update({
        full_name,
        email,
        cpf,
        registro_profissional,
      })
      .eq("id", userId);

    // Nota: Se o profile for criado via trigger, o update funciona. 
    // Se não for criado, precisamos dar um upsert.
    if (profileError) {
      const { error: upsertError } = await supabaseClient
        .from("profiles")
        .upsert({
          id: userId,
          full_name,
          email,
          cpf,
          registro_profissional,
        });
      if (upsertError) throw upsertError;
    }

    // 3. Vincular Cargo e Unidade (app_user_memberships)
    if (role_id && unidade_id) {
      const { error: membershipError } = await supabaseClient
        .from("app_user_memberships")
        .upsert({
          usuario_id: userId,
          role_id,
          unidade_id,
          ativo: true,
        });
      if (membershipError) throw membershipError;
    }

    return new Response(JSON.stringify({ message: "Convite enviado com sucesso!", user_id: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
