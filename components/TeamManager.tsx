import { supabase } from '@/lib/supabaseClient';

export interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  // Trazemos os IDs das unidades como um array para facilitar o Checkbox
  accessible_units: string[]; 
}

export const teamService = {
  // Busca todos os funcionários da empresa do usuário logado
  async getTeamMembers(): Promise<TeamMember[]> {
    // 1. Busca perfis
    const { data: profiles, error } = await (supabase as any).from('profiles')
      .select('id, full_name, email, role')
      .order('full_name');

    if (error) throw error;

    // 2. Busca unidades permitidas para cada um
    // (Poderíamos fazer um join complexo, mas separar é mais seguro para tipagem agora)
    const members: TeamMember[] = [];

    for (const p of profiles) {
      const { data: units } = await (supabase as any).from('user_units')
        .select('unit_id')
        .eq('user_id', p.id);
      
      members.push({
        ...p,
        accessible_units: units?.map((u: any) => u.unit_id) || []
      });
    }

    return members;
  },

  // Atualiza as permissões de unidade (O CORAÇÃO DA GOVERNANÇA)
  async updateUserUnits(userId: string, unitIds: string[]) {
    // 1. Limpa acessos antigos (Audit Trail registrará "DELETE")
    const { error: deleteError } = await (supabase as any).from('user_units')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) throw deleteError;

    // 2. Insere novos acessos (Audit Trail registrará "INSERT")
    if (unitIds.length > 0) {
      const toInsert = unitIds.map(unit_id => ({
        user_id: userId,
        unit_id: unit_id
      }));

      const { error: insertError } = await (supabase as any).from('user_units')
        .insert(toInsert);
      
      if (insertError) throw insertError;
    }
  }
};


