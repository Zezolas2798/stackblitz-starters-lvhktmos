export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      acoes_corretivas: {
        Row: {
          acao_imediata: string
          created_at: string | null
          descricao_desvio: string
          id: string
          origem_checklist_resposta_id: string | null
          status: string | null
          unidade_id: string
        }
        Insert: {
          acao_imediata: string
          created_at?: string | null
          descricao_desvio: string
          id?: string
          origem_checklist_resposta_id?: string | null
          status?: string | null
          unidade_id: string
        }
        Update: {
          acao_imediata?: string
          created_at?: string | null
          descricao_desvio?: string
          id?: string
          origem_checklist_resposta_id?: string | null
          status?: string | null
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acoes_corretivas_origem_checklist_resposta_id_fkey"
            columns: ["origem_checklist_resposta_id"]
            isOneToOne: false
            referencedRelation: "checklist_respostas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoes_corretivas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      anvisa_aditivos: {
        Row: {
          funcao_principal: string | null
          id: number
          ins: string
          nome: string
        }
        Insert: {
          funcao_principal?: string | null
          id?: never
          ins: string
          nome: string
        }
        Update: {
          funcao_principal?: string | null
          id?: never
          ins?: string
          nome?: string
        }
        Relationships: []
      }
      anvisa_alegacoes_criterios: {
        Row: {
          atributo: string
          base_calculo: string
          condicao: string
          id: number
          nutriente: string
          termo_declaracao: string
          tipo_valor: string
          valor: number
        }
        Insert: {
          atributo: string
          base_calculo: string
          condicao: string
          id?: number
          nutriente: string
          termo_declaracao: string
          tipo_valor?: string
          valor: number
        }
        Update: {
          atributo?: string
          base_calculo?: string
          condicao?: string
          id?: number
          nutriente?: string
          termo_declaracao?: string
          tipo_valor?: string
          valor?: number
        }
        Relationships: []
      }
      anvisa_alergenicos: {
        Row: {
          id: number
          nome: string
        }
        Insert: {
          id?: never
          nome: string
        }
        Update: {
          id?: never
          nome?: string
        }
        Relationships: []
      }
      anvisa_categorias: {
        Row: {
          grupo_anvisa: string
          id: number
          medida_caseira_sugerida: string
          nome_produto: string
          porcao_referencia_g_ml: number
          tipo_calculo: string
        }
        Insert: {
          grupo_anvisa: string
          id?: number
          medida_caseira_sugerida: string
          nome_produto: string
          porcao_referencia_g_ml: number
          tipo_calculo?: string
        }
        Update: {
          grupo_anvisa?: string
          id?: number
          medida_caseira_sugerida?: string
          nome_produto?: string
          porcao_referencia_g_ml?: number
          tipo_calculo?: string
        }
        Relationships: []
      }
      anvisa_funcoes_aditivos: {
        Row: {
          id: number
          nome: string
        }
        Insert: {
          id?: number
          nome: string
        }
        Update: {
          id?: number
          nome?: string
        }
        Relationships: []
      }
      anvisa_grupos_populacionais: {
        Row: {
          base_legal: string | null
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          base_legal?: string | null
          descricao?: string | null
          id: string
          nome: string
        }
        Update: {
          base_legal?: string | null
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      anvisa_limites_lupa: {
        Row: {
          limite_liquido_g: number
          limite_solido_g: number
          nutriente: string
        }
        Insert: {
          limite_liquido_g: number
          limite_solido_g: number
          nutriente: string
        }
        Update: {
          limite_liquido_g?: number
          limite_solido_g?: number
          nutriente?: string
        }
        Relationships: []
      }
      anvisa_medidas_caseiras: {
        Row: {
          capacidade_ml: number
          id: number
          nome: string
          nome_singular: string | null
        }
        Insert: {
          capacidade_ml: number
          id?: number
          nome: string
          nome_singular?: string | null
        }
        Update: {
          capacidade_ml?: number
          id?: number
          nome?: string
          nome_singular?: string | null
        }
        Relationships: []
      }
      anvisa_regras_tabela: {
        Row: {
          constituinte: string
          expressao_nao_significativa: string | null
          limite_nao_significativo: number | null
          regra_arr_maior_10: number | null
          regra_arr_menor_1: number | null
          regra_arr_menor_10: number | null
          unidade: string
        }
        Insert: {
          constituinte: string
          expressao_nao_significativa?: string | null
          limite_nao_significativo?: number | null
          regra_arr_maior_10?: number | null
          regra_arr_menor_1?: number | null
          regra_arr_menor_10?: number | null
          unidade: string
        }
        Update: {
          constituinte?: string
          expressao_nao_significativa?: string | null
          limite_nao_significativo?: number | null
          regra_arr_maior_10?: number | null
          regra_arr_menor_1?: number | null
          regra_arr_menor_10?: number | null
          unidade?: string
        }
        Relationships: []
      }
      anvisa_vdr: {
        Row: {
          constituinte: string
          grupo_id: string
          id: number
          unidade: string
          valor: number | null
        }
        Insert: {
          constituinte: string
          grupo_id: string
          id?: never
          unidade: string
          valor?: number | null
        }
        Update: {
          constituinte?: string
          grupo_id?: string
          id?: never
          unidade?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "anvisa_vdr_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "anvisa_grupos_populacionais"
            referencedColumns: ["id"]
          },
        ]
      }
      app_notificacoes: {
        Row: {
          created_at: string | null
          id: string
          lida: boolean | null
          link_acao: string | null
          mensagem: string
          titulo: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          link_acao?: string | null
          mensagem: string
          titulo: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          link_acao?: string | null
          mensagem?: string
          titulo?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      app_permissions: {
        Row: {
          created_at: string | null
          descricao: string
          modulo: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          descricao: string
          modulo: string
          slug: string
        }
        Update: {
          created_at?: string | null
          descricao?: string
          modulo?: string
          slug?: string
        }
        Relationships: []
      }
      app_role_permissions: {
        Row: {
          permission_slug: string
          role_id: string
        }
        Insert: {
          permission_slug: string
          role_id: string
        }
        Update: {
          permission_slug?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_role_permissions_permission_slug_fkey"
            columns: ["permission_slug"]
            isOneToOne: false
            referencedRelation: "app_permissions"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "app_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_roles: {
        Row: {
          ativo: boolean | null
          cliente_id: string | null
          created_at: string | null
          descricao: string | null
          id: string
          is_system_role: boolean | null
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          cliente_id?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_system_role?: boolean | null
          nome: string
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_system_role?: boolean | null
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_roles_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      app_user_memberships: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          role_id: string
          unidade_id: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          role_id: string
          unidade_id: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          role_id?: string
          unidade_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_user_memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_user_memberships_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs_gxp: {
        Row: {
          dados_anteriores: Json | null
          dados_novos: Json | null
          data_evento: string | null
          id: string
          ip_origem: string | null
          justify_reason: string | null
          operacao: string
          registro_id: string
          tabela_afetada: string
          transaction_id: string | null
          usuario_id: string | null
        }
        Insert: {
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          data_evento?: string | null
          id?: string
          ip_origem?: string | null
          justify_reason?: string | null
          operacao: string
          registro_id: string
          tabela_afetada: string
          transaction_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          data_evento?: string | null
          id?: string
          ip_origem?: string | null
          justify_reason?: string | null
          operacao?: string
          registro_id?: string
          tabela_afetada?: string
          transaction_id?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      audit_logs_sistema: {
        Row: {
          acao: string
          created_at: string | null
          dados_antigos: Json | null
          dados_novos: Json | null
          id: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          dados_antigos?: Json | null
          dados_novos?: Json | null
          id?: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          dados_antigos?: Json | null
          dados_novos?: Json | null
          id?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      checklist_auditorias: {
        Row: {
          cliente_id: string
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          modelo_id: string
          observacoes_gerais: string | null
          pontuacao_obtida: number | null
          responsavel_id: string | null
          status: string | null
          titulo: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          modelo_id: string
          observacoes_gerais?: string | null
          pontuacao_obtida?: number | null
          responsavel_id?: string | null
          status?: string | null
          titulo?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          modelo_id?: string
          observacoes_gerais?: string | null
          pontuacao_obtida?: number | null
          responsavel_id?: string | null
          status?: string | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_auditorias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_auditorias_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "checklist_modelos"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_execucoes: {
        Row: {
          assinatura_eletronica_hash: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          modelo_id: string
          responsavel_id: string | null
          score_obtido: number | null
          status: string | null
          unidade_id: string
        }
        Insert: {
          assinatura_eletronica_hash?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          modelo_id: string
          responsavel_id?: string | null
          score_obtido?: number | null
          status?: string | null
          unidade_id: string
        }
        Update: {
          assinatura_eletronica_hash?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          modelo_id?: string
          responsavel_id?: string | null
          score_obtido?: number | null
          status?: string | null
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_execucoes_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "checklist_modelos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_execucoes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_itens: {
        Row: {
          ajuda_texto: string | null
          id: string
          modelo_id: string
          norma_referencia_id: number | null
          obrigatorio: boolean | null
          ordem: number
          requer_foto: boolean | null
          secao_id: string | null
          texto_pergunta: string
          tipo_resposta: string
        }
        Insert: {
          ajuda_texto?: string | null
          id?: string
          modelo_id: string
          norma_referencia_id?: number | null
          obrigatorio?: boolean | null
          ordem?: number
          requer_foto?: boolean | null
          secao_id?: string | null
          texto_pergunta: string
          tipo_resposta: string
        }
        Update: {
          ajuda_texto?: string | null
          id?: string
          modelo_id?: string
          norma_referencia_id?: number | null
          obrigatorio?: boolean | null
          ordem?: number
          requer_foto?: boolean | null
          secao_id?: string | null
          texto_pergunta?: string
          tipo_resposta?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_itens_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "checklist_modelos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_itens_norma_referencia_id_fkey"
            columns: ["norma_referencia_id"]
            isOneToOne: false
            referencedRelation: "normas_sanitarias_parametros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_itens_secao_id_fkey"
            columns: ["secao_id"]
            isOneToOne: false
            referencedRelation: "checklist_secoes"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_modelos: {
        Row: {
          ativo: boolean | null
          cliente_id: string
          created_at: string | null
          created_by: string | null
          descricao: string | null
          frequencia_sugerida: string | null
          id: string
          titulo: string
          versao: number | null
        }
        Insert: {
          ativo?: boolean | null
          cliente_id: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          frequencia_sugerida?: string | null
          id?: string
          titulo: string
          versao?: number | null
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          frequencia_sugerida?: string | null
          id?: string
          titulo?: string
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_modelos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_respostas: {
        Row: {
          auditoria_id: string
          comentario: string | null
          conforme: boolean | null
          foto_evidencia_url: string | null
          fotos_urls: string[] | null
          id: string
          item_id: string
          nao_se_aplica: boolean | null
          observacao: string | null
          resposta_valor: string | null
          temperatura_coletada: number | null
          valor_resposta: string | null
        }
        Insert: {
          auditoria_id: string
          comentario?: string | null
          conforme?: boolean | null
          foto_evidencia_url?: string | null
          fotos_urls?: string[] | null
          id?: string
          item_id: string
          nao_se_aplica?: boolean | null
          observacao?: string | null
          resposta_valor?: string | null
          temperatura_coletada?: number | null
          valor_resposta?: string | null
        }
        Update: {
          auditoria_id?: string
          comentario?: string | null
          conforme?: boolean | null
          foto_evidencia_url?: string | null
          fotos_urls?: string[] | null
          id?: string
          item_id?: string
          nao_se_aplica?: boolean | null
          observacao?: string | null
          resposta_valor?: string | null
          temperatura_coletada?: number | null
          valor_resposta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_respostas_auditoria_id_fkey"
            columns: ["auditoria_id"]
            isOneToOne: false
            referencedRelation: "checklist_auditorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_respostas_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_secoes: {
        Row: {
          created_at: string | null
          id: string
          modelo_id: string
          ordem: number | null
          titulo: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          modelo_id: string
          ordem?: number | null
          titulo: string
        }
        Update: {
          created_at?: string | null
          id?: string
          modelo_id?: string
          ordem?: number | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_secoes_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "checklist_modelos"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_categorias_produto: {
        Row: {
          ativo: boolean | null
          cliente_id: string
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          cliente_id: string
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: string
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_categorias_produto_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_locais_estoque: {
        Row: {
          ativo: boolean | null
          cliente_id: string | null
          id: string
          nome: string
          temp_alvo_max: number | null
          temp_alvo_min: number | null
          tipo_ambiente: string | null
          unidade_id: string
        }
        Insert: {
          ativo?: boolean | null
          cliente_id?: string | null
          id?: string
          nome: string
          temp_alvo_max?: number | null
          temp_alvo_min?: number | null
          tipo_ambiente?: string | null
          unidade_id: string
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: string | null
          id?: string
          nome?: string
          temp_alvo_max?: number | null
          temp_alvo_min?: number | null
          tipo_ambiente?: string | null
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_locais_estoque_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locais_estoque_unidade_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_setores_producao: {
        Row: {
          ativo: boolean
          cliente_id: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          cliente_id: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          cliente_id?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_setores_producao_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_unidades: {
        Row: {
          ativo: boolean | null
          cliente_id: string
          cnae_principal: string | null
          cnpj_completo: string | null
          created_at: string | null
          endereco_completo: string | null
          id: string
          nome_unidade: string
          responsavel_tecnico_nome: string | null
          responsavel_tecnico_registro: string | null
        }
        Insert: {
          ativo?: boolean | null
          cliente_id: string
          cnae_principal?: string | null
          cnpj_completo?: string | null
          created_at?: string | null
          endereco_completo?: string | null
          id?: string
          nome_unidade: string
          responsavel_tecnico_nome?: string | null
          responsavel_tecnico_registro?: string | null
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: string
          cnae_principal?: string | null
          cnpj_completo?: string | null
          created_at?: string | null
          endereco_completo?: string | null
          id?: string
          nome_unidade?: string
          responsavel_tecnico_nome?: string | null
          responsavel_tecnico_registro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_unidades_cliente_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean | null
          cnpj_raiz: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: string
          nome_fantasia: string | null
          razao_social: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cnpj_raiz: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          nome_fantasia?: string | null
          razao_social: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cnpj_raiz?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          nome_fantasia?: string | null
          razao_social?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          aso_validade: string | null
          ativo: boolean | null
          created_at: string | null
          data_admissao: string | null
          funcao: string
          id: string
          nome_completo: string
          unidade_id: string
        }
        Insert: {
          aso_validade?: string | null
          ativo?: boolean | null
          created_at?: string | null
          data_admissao?: string | null
          funcao: string
          id?: string
          nome_completo: string
          unidade_id: string
        }
        Update: {
          aso_validade?: string | null
          ativo?: boolean | null
          created_at?: string | null
          data_admissao?: string | null
          funcao?: string
          id?: string
          nome_completo?: string
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      composicao_receitas: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string | null
          medida_caseira: string | null
          ordem: number | null
          peso_bruto_g: number
          peso_liquido_g: number
          receita_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type?: string | null
          medida_caseira?: string | null
          ordem?: number | null
          peso_bruto_g?: number
          peso_liquido_g?: number
          receita_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string | null
          medida_caseira?: string | null
          ordem?: number | null
          peso_bruto_g?: number
          peso_liquido_g?: number
          receita_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "composicao_receitas_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      config_modelo_subtarefas: {
        Row: {
          id: string
          modelo_id: string | null
          ordem: number | null
          titulo: string
        }
        Insert: {
          id?: string
          modelo_id?: string | null
          ordem?: number | null
          titulo: string
        }
        Update: {
          id?: string
          modelo_id?: string | null
          ordem?: number | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "config_modelo_subtarefas_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "config_modelos_demandas"
            referencedColumns: ["id"]
          },
        ]
      }
      config_modelos_demandas: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          descricao_padrao: string | null
          frequencia: string | null
          id: string
          notificar_usuarios_ids: string[] | null
          prioridade_padrao: string | null
          requer_evidencia_foto: boolean | null
          responsavel_padrao_id: string | null
          tipo_padrao: string | null
          titulo_padrao: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          descricao_padrao?: string | null
          frequencia?: string | null
          id?: string
          notificar_usuarios_ids?: string[] | null
          prioridade_padrao?: string | null
          requer_evidencia_foto?: boolean | null
          responsavel_padrao_id?: string | null
          tipo_padrao?: string | null
          titulo_padrao: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          descricao_padrao?: string | null
          frequencia?: string | null
          id?: string
          notificar_usuarios_ids?: string[] | null
          prioridade_padrao?: string | null
          requer_evidencia_foto?: boolean | null
          responsavel_padrao_id?: string | null
          tipo_padrao?: string | null
          titulo_padrao?: string
        }
        Relationships: [
          {
            foreignKeyName: "config_modelos_demandas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_inspecoes_recebimento: {
        Row: {
          assinatura_eletronica_hash: string | null
          created_at: string | null
          data_fabricacao: string | null
          data_recebimento: string
          data_validade: string
          embalagem_integra: boolean | null
          fornecedor_id: string
          id: string
          ingrediente_id: string
          lote_fornecedor: string
          motivo_rejeicao: string | null
          nota_fiscal: string
          quantidade_recebida: number
          responsavel_recebimento_id: string | null
          status_aprovacao: string | null
          temperatura_produto: number | null
          temperatura_veiculo: number | null
          unidade_id: string
          unidade_medida: string
          veiculo_limpo: boolean | null
        }
        Insert: {
          assinatura_eletronica_hash?: string | null
          created_at?: string | null
          data_fabricacao?: string | null
          data_recebimento?: string
          data_validade: string
          embalagem_integra?: boolean | null
          fornecedor_id: string
          id?: string
          ingrediente_id: string
          lote_fornecedor: string
          motivo_rejeicao?: string | null
          nota_fiscal: string
          quantidade_recebida: number
          responsavel_recebimento_id?: string | null
          status_aprovacao?: string | null
          temperatura_produto?: number | null
          temperatura_veiculo?: number | null
          unidade_id: string
          unidade_medida: string
          veiculo_limpo?: boolean | null
        }
        Update: {
          assinatura_eletronica_hash?: string | null
          created_at?: string | null
          data_fabricacao?: string | null
          data_recebimento?: string
          data_validade?: string
          embalagem_integra?: boolean | null
          fornecedor_id?: string
          id?: string
          ingrediente_id?: string
          lote_fornecedor?: string
          motivo_rejeicao?: string | null
          nota_fiscal?: string
          quantidade_recebida?: number
          responsavel_recebimento_id?: string | null
          status_aprovacao?: string | null
          temperatura_produto?: number | null
          temperatura_veiculo?: number | null
          unidade_id?: string
          unidade_medida?: string
          veiculo_limpo?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_inspecoes_recebimento_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_inspecoes_recebimento_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_inspecoes_recebimento_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_lotes: {
        Row: {
          categoria_produto: string | null
          cliente_id: string | null
          codigo_lote_fornecedor: string
          created_at: string | null
          data_recebimento: string | null
          data_validade: string | null
          data_validade_atual: string | null
          data_validade_original: string | null
          estado_produto: string | null
          fornecedor: string | null
          fornecedor_id: string | null
          id: string
          ingrediente_id: string
          is_lote_interno: boolean | null
          local_armazenamento: string | null
          local_estoque_id: string | null
          marca: string | null
          nota_fiscal: string | null
          peso_unitario_embalagem: number | null
          qtd_embalagens: number | null
          quantidade_atual: number
          quantidade_inicial: number | null
          status_lote: string | null
          temperatura_recebimento: number | null
          unidade_id: string
          unidade_medida: string
          unidade_peso_embalagem: string | null
          valor_unitario: number | null
        }
        Insert: {
          categoria_produto?: string | null
          cliente_id?: string | null
          codigo_lote_fornecedor: string
          created_at?: string | null
          data_recebimento?: string | null
          data_validade?: string | null
          data_validade_atual?: string | null
          data_validade_original?: string | null
          estado_produto?: string | null
          fornecedor?: string | null
          fornecedor_id?: string | null
          id?: string
          ingrediente_id: string
          is_lote_interno?: boolean | null
          local_armazenamento?: string | null
          local_estoque_id?: string | null
          marca?: string | null
          nota_fiscal?: string | null
          peso_unitario_embalagem?: number | null
          qtd_embalagens?: number | null
          quantidade_atual: number
          quantidade_inicial?: number | null
          status_lote?: string | null
          temperatura_recebimento?: number | null
          unidade_id: string
          unidade_medida: string
          unidade_peso_embalagem?: string | null
          valor_unitario?: number | null
        }
        Update: {
          categoria_produto?: string | null
          cliente_id?: string | null
          codigo_lote_fornecedor?: string
          created_at?: string | null
          data_recebimento?: string | null
          data_validade?: string | null
          data_validade_atual?: string | null
          data_validade_original?: string | null
          estado_produto?: string | null
          fornecedor?: string | null
          fornecedor_id?: string | null
          id?: string
          ingrediente_id?: string
          is_lote_interno?: boolean | null
          local_armazenamento?: string | null
          local_estoque_id?: string | null
          marca?: string | null
          nota_fiscal?: string | null
          peso_unitario_embalagem?: number | null
          qtd_embalagens?: number | null
          quantidade_atual?: number
          quantidade_inicial?: number | null
          status_lote?: string | null
          temperatura_recebimento?: number | null
          unidade_id?: string
          unidade_medida?: string
          unidade_peso_embalagem?: string | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_lotes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_lotes_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_lotes_local_estoque_id_fkey"
            columns: ["local_estoque_id"]
            isOneToOne: false
            referencedRelation: "cliente_locais_estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_lotes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_movimentacoes: {
        Row: {
          data_movimento: string | null
          fornecedor_id: string | null
          id: string
          justificativa: string | null
          lote_id: string
          quantidade_movimentada: number
          quantidade_nova: number
          responsavel_id: string | null
          tipo_movimento: string
        }
        Insert: {
          data_movimento?: string | null
          fornecedor_id?: string | null
          id?: string
          justificativa?: string | null
          lote_id: string
          quantidade_movimentada: number
          quantidade_nova: number
          responsavel_id?: string | null
          tipo_movimento: string
        }
        Update: {
          data_movimento?: string | null
          fornecedor_id?: string | null
          id?: string
          justificativa?: string | null
          lote_id?: string
          quantidade_movimentada?: number
          quantidade_nova?: number
          responsavel_id?: string | null
          tipo_movimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "estoque_lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          cliente_id: string
          cnpj: string
          contato_qualidade_email: string | null
          contato_qualidade_nome: string | null
          created_at: string | null
          id: string
          licenca_sanitaria_numero: string | null
          licenca_sanitaria_validade: string | null
          nome_fantasia: string | null
          razao_social: string
          status_homologacao: string | null
        }
        Insert: {
          cliente_id: string
          cnpj: string
          contato_qualidade_email?: string | null
          contato_qualidade_nome?: string | null
          created_at?: string | null
          id?: string
          licenca_sanitaria_numero?: string | null
          licenca_sanitaria_validade?: string | null
          nome_fantasia?: string | null
          razao_social: string
          status_homologacao?: string | null
        }
        Update: {
          cliente_id?: string
          cnpj?: string
          contato_qualidade_email?: string | null
          contato_qualidade_nome?: string | null
          created_at?: string | null
          id?: string
          licenca_sanitaria_numero?: string | null
          licenca_sanitaria_validade?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          status_homologacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ingrediente_alergenicos: {
        Row: {
          anvisa_alergenico_id: number
          created_at: string | null
          id: string
          ingrediente_id: string
          nivel_contato: string
        }
        Insert: {
          anvisa_alergenico_id: number
          created_at?: string | null
          id?: string
          ingrediente_id: string
          nivel_contato?: string
        }
        Update: {
          anvisa_alergenico_id?: number
          created_at?: string | null
          id?: string
          ingrediente_id?: string
          nivel_contato?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingrediente_alergenicos_anvisa_alergenico_id_fkey"
            columns: ["anvisa_alergenico_id"]
            isOneToOne: false
            referencedRelation: "anvisa_alergenicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingrediente_alergenicos_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredientes: {
        Row: {
          acucar_adicionado_g: number | null
          acucar_total_g: number | null
          alergenicos_ids: number[] | null
          amido_g: number | null
          calcio_mg: number | null
          carboidrato_g: number | null
          cliente_id: string | null
          cloreto_mg: number | null
          cobre_mcg: number | null
          colesterol_mg: number | null
          contem_gluten: boolean | null
          created_at: string | null
          cromo_mcg: number | null
          declaracao_ingredientes_fornecedor: string | null
          energia_kcal: number | null
          eritritol_g: number | null
          ferro_mg: number | null
          fibra_alimentar_g: number | null
          fluor_mg: number | null
          fonte: string | null
          fosforo_mg: number | null
          funcao_aditivo: string | null
          galactose_g: number | null
          gordura_mono_g: number | null
          gordura_poli_g: number | null
          gordura_saturada_g: number | null
          gordura_trans_g: number | null
          id: string
          ins_code: string | null
          iodo_mcg: number | null
          lactose_g: number | null
          lipideos_g: number | null
          magnesio_mg: number | null
          maltitol_g: number | null
          manganes_mg: number | null
          manitol_g: number | null
          molibdenio_mcg: number | null
          nome: string
          peso_unitario_g: number | null
          poliois_totais_g: number | null
          potassio_mg: number | null
          proteina_g: number | null
          selenio_mcg: number | null
          sodio_mg: number | null
          sorbitol_g: number | null
          tipo_ingrediente: string | null
          updated_by: string | null
          vitamina_a_mcg: number | null
          vitamina_b1_mg: number | null
          vitamina_b12_mcg: number | null
          vitamina_b2_mg: number | null
          vitamina_b3_mg: number | null
          vitamina_b5_mg: number | null
          vitamina_b6_mg: number | null
          vitamina_b7_mcg: number | null
          vitamina_b9_mcg: number | null
          vitamina_c_mg: number | null
          vitamina_d_mcg: number | null
          vitamina_e_mg: number | null
          vitamina_k_mcg: number | null
          xilitol_g: number | null
          zinco_mg: number | null
        }
        Insert: {
          acucar_adicionado_g?: number | null
          acucar_total_g?: number | null
          alergenicos_ids?: number[] | null
          amido_g?: number | null
          calcio_mg?: number | null
          carboidrato_g?: number | null
          cliente_id?: string | null
          cloreto_mg?: number | null
          cobre_mcg?: number | null
          colesterol_mg?: number | null
          contem_gluten?: boolean | null
          created_at?: string | null
          cromo_mcg?: number | null
          declaracao_ingredientes_fornecedor?: string | null
          energia_kcal?: number | null
          eritritol_g?: number | null
          ferro_mg?: number | null
          fibra_alimentar_g?: number | null
          fluor_mg?: number | null
          fonte?: string | null
          fosforo_mg?: number | null
          funcao_aditivo?: string | null
          galactose_g?: number | null
          gordura_mono_g?: number | null
          gordura_poli_g?: number | null
          gordura_saturada_g?: number | null
          gordura_trans_g?: number | null
          id?: string
          ins_code?: string | null
          iodo_mcg?: number | null
          lactose_g?: number | null
          lipideos_g?: number | null
          magnesio_mg?: number | null
          maltitol_g?: number | null
          manganes_mg?: number | null
          manitol_g?: number | null
          molibdenio_mcg?: number | null
          nome: string
          peso_unitario_g?: number | null
          poliois_totais_g?: number | null
          potassio_mg?: number | null
          proteina_g?: number | null
          selenio_mcg?: number | null
          sodio_mg?: number | null
          sorbitol_g?: number | null
          tipo_ingrediente?: string | null
          updated_by?: string | null
          vitamina_a_mcg?: number | null
          vitamina_b1_mg?: number | null
          vitamina_b12_mcg?: number | null
          vitamina_b2_mg?: number | null
          vitamina_b3_mg?: number | null
          vitamina_b5_mg?: number | null
          vitamina_b6_mg?: number | null
          vitamina_b7_mcg?: number | null
          vitamina_b9_mcg?: number | null
          vitamina_c_mg?: number | null
          vitamina_d_mcg?: number | null
          vitamina_e_mg?: number | null
          vitamina_k_mcg?: number | null
          xilitol_g?: number | null
          zinco_mg?: number | null
        }
        Update: {
          acucar_adicionado_g?: number | null
          acucar_total_g?: number | null
          alergenicos_ids?: number[] | null
          amido_g?: number | null
          calcio_mg?: number | null
          carboidrato_g?: number | null
          cliente_id?: string | null
          cloreto_mg?: number | null
          cobre_mcg?: number | null
          colesterol_mg?: number | null
          contem_gluten?: boolean | null
          created_at?: string | null
          cromo_mcg?: number | null
          declaracao_ingredientes_fornecedor?: string | null
          energia_kcal?: number | null
          eritritol_g?: number | null
          ferro_mg?: number | null
          fibra_alimentar_g?: number | null
          fluor_mg?: number | null
          fonte?: string | null
          fosforo_mg?: number | null
          funcao_aditivo?: string | null
          galactose_g?: number | null
          gordura_mono_g?: number | null
          gordura_poli_g?: number | null
          gordura_saturada_g?: number | null
          gordura_trans_g?: number | null
          id?: string
          ins_code?: string | null
          iodo_mcg?: number | null
          lactose_g?: number | null
          lipideos_g?: number | null
          magnesio_mg?: number | null
          maltitol_g?: number | null
          manganes_mg?: number | null
          manitol_g?: number | null
          molibdenio_mcg?: number | null
          nome?: string
          peso_unitario_g?: number | null
          poliois_totais_g?: number | null
          potassio_mg?: number | null
          proteina_g?: number | null
          selenio_mcg?: number | null
          sodio_mg?: number | null
          sorbitol_g?: number | null
          tipo_ingrediente?: string | null
          updated_by?: string | null
          vitamina_a_mcg?: number | null
          vitamina_b1_mg?: number | null
          vitamina_b12_mcg?: number | null
          vitamina_b2_mg?: number | null
          vitamina_b3_mg?: number | null
          vitamina_b5_mg?: number | null
          vitamina_b6_mg?: number | null
          vitamina_b7_mcg?: number | null
          vitamina_b9_mcg?: number | null
          vitamina_c_mg?: number | null
          vitamina_d_mcg?: number | null
          vitamina_e_mg?: number | null
          vitamina_k_mcg?: number | null
          xilitol_g?: number | null
          zinco_mg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredientes_cliente_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          id: string
          name: string
          quantity: number | null
          unit_id: string
        }
        Insert: {
          id?: string
          name: string
          quantity?: number | null
          unit_id: string
        }
        Update: {
          id?: string
          name?: string
          quantity?: number | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      iot_etiquetas_impressas: {
        Row: {
          data_impressao: string | null
          id: string
          impressora_mac_address: string | null
          ordem_producao_id: string | null
          qtd_descartada: number | null
          qtd_impressa: number
          qtd_utilizada: number | null
          reconciliacao_fechada: boolean | null
          template_utilizado: string | null
          unidade_id: string
          usuario_id: string | null
          zpl_payload: string | null
        }
        Insert: {
          data_impressao?: string | null
          id?: string
          impressora_mac_address?: string | null
          ordem_producao_id?: string | null
          qtd_descartada?: number | null
          qtd_impressa: number
          qtd_utilizada?: number | null
          reconciliacao_fechada?: boolean | null
          template_utilizado?: string | null
          unidade_id: string
          usuario_id?: string | null
          zpl_payload?: string | null
        }
        Update: {
          data_impressao?: string | null
          id?: string
          impressora_mac_address?: string | null
          ordem_producao_id?: string | null
          qtd_descartada?: number | null
          qtd_impressa?: number
          qtd_utilizada?: number | null
          reconciliacao_fechada?: boolean | null
          template_utilizado?: string | null
          unidade_id?: string
          usuario_id?: string | null
          zpl_payload?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iot_etiquetas_impressas_ordem_producao_id_fkey"
            columns: ["ordem_producao_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iot_etiquetas_impressas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      normas_sanitarias_parametros: {
        Row: {
          base_legal: string
          categoria_processo: string
          criticalidade: string | null
          id: number
          item_monitorado: string
          temp_max: number | null
          temp_min: number | null
          tempo_max_minutos: number | null
        }
        Insert: {
          base_legal: string
          categoria_processo: string
          criticalidade?: string | null
          id?: never
          item_monitorado: string
          temp_max?: number | null
          temp_min?: number | null
          tempo_max_minutos?: number | null
        }
        Update: {
          base_legal?: string
          categoria_processo?: string
          criticalidade?: string | null
          id?: never
          item_monitorado?: string
          temp_max?: number | null
          temp_min?: number | null
          tempo_max_minutos?: number | null
        }
        Relationships: []
      }
      operacao_comentarios: {
        Row: {
          created_at: string | null
          id: string
          tarefa_id: string | null
          texto: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          tarefa_id?: string | null
          texto: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          tarefa_id?: string | null
          texto?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operacao_comentarios_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "operacao_tarefas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operacao_comentarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      operacao_subtarefas: {
        Row: {
          concluida: boolean | null
          id: string
          ordem: number | null
          tarefa_id: string | null
          titulo: string
        }
        Insert: {
          concluida?: boolean | null
          id?: string
          ordem?: number | null
          tarefa_id?: string | null
          titulo: string
        }
        Update: {
          concluida?: boolean | null
          id?: string
          ordem?: number | null
          tarefa_id?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "operacao_subtarefas_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "operacao_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      operacao_tarefas: {
        Row: {
          assinatura_obrigatoria_id: string | null
          cliente_id: string
          concluida_em: string | null
          created_at: string | null
          criado_por: string | null
          cron_expressao: string | null
          descricao: string | null
          id: string
          is_recorrente: boolean | null
          notificar_usuarios: string[] | null
          prazo_limite: string | null
          prioridade: string | null
          requer_evidencia_foto: boolean | null
          responsavel_id: string | null
          status: string | null
          tipo: string | null
          titulo: string
          unidade_id: string
          updated_at: string | null
        }
        Insert: {
          assinatura_obrigatoria_id?: string | null
          cliente_id: string
          concluida_em?: string | null
          created_at?: string | null
          criado_por?: string | null
          cron_expressao?: string | null
          descricao?: string | null
          id?: string
          is_recorrente?: boolean | null
          notificar_usuarios?: string[] | null
          prazo_limite?: string | null
          prioridade?: string | null
          requer_evidencia_foto?: boolean | null
          responsavel_id?: string | null
          status?: string | null
          tipo?: string | null
          titulo: string
          unidade_id: string
          updated_at?: string | null
        }
        Update: {
          assinatura_obrigatoria_id?: string | null
          cliente_id?: string
          concluida_em?: string | null
          created_at?: string | null
          criado_por?: string | null
          cron_expressao?: string | null
          descricao?: string | null
          id?: string
          is_recorrente?: boolean | null
          notificar_usuarios?: string[] | null
          prazo_limite?: string | null
          prioridade?: string | null
          requer_evidencia_foto?: boolean | null
          responsavel_id?: string | null
          status?: string | null
          tipo?: string | null
          titulo?: string
          unidade_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operacao_tarefas_assinatura_obrigatoria_id_fkey"
            columns: ["assinatura_obrigatoria_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operacao_tarefas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operacao_tarefas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operacao_tarefas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_producao: {
        Row: {
          cliente_id: string | null
          data_fim_producao: string | null
          data_inicio_producao: string | null
          data_validade: string
          id: string
          lote_interno: string
          qtd_produzida: number
          receita_versao_id: string
          responsavel_producao_id: string | null
          status: string | null
          unidade_id: string
        }
        Insert: {
          cliente_id?: string | null
          data_fim_producao?: string | null
          data_inicio_producao?: string | null
          data_validade: string
          id?: string
          lote_interno: string
          qtd_produzida: number
          receita_versao_id: string
          responsavel_producao_id?: string | null
          status?: string | null
          unidade_id: string
        }
        Update: {
          cliente_id?: string | null
          data_fim_producao?: string | null
          data_inicio_producao?: string | null
          data_validade?: string
          id?: string
          lote_interno?: string
          qtd_produzida?: number
          receita_versao_id?: string
          responsavel_producao_id?: string | null
          status?: string | null
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ordens_cliente"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_registros_receita_versao_id_fkey"
            columns: ["receita_versao_id"]
            isOneToOne: false
            referencedRelation: "receitas_versoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_registros_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      permissoes_usuario_unidade: {
        Row: {
          nivel_acesso: string | null
          unidade_id: string
          usuario_id: string
        }
        Insert: {
          nivel_acesso?: string | null
          unidade_id: string
          usuario_id: string
        }
        Update: {
          nivel_acesso?: string | null
          unidade_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissoes_usuario_unidade_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      producao_consumos: {
        Row: {
          created_at: string | null
          estoque_lote_id: string
          id: string
          producao_id: string
          quantidade_utilizada: number
        }
        Insert: {
          created_at?: string | null
          estoque_lote_id: string
          id?: string
          producao_id: string
          quantidade_utilizada: number
        }
        Update: {
          created_at?: string | null
          estoque_lote_id?: string
          id?: string
          producao_id?: string
          quantidade_utilizada?: number
        }
        Relationships: [
          {
            foreignKeyName: "producao_consumos_estoque_lote_id_fkey"
            columns: ["estoque_lote_id"]
            isOneToOne: false
            referencedRelation: "estoque_lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_consumos_producao_id_fkey"
            columns: ["producao_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      producao_perdas: {
        Row: {
          created_at: string | null
          custo_estimado: number | null
          descricao_detalhada: string | null
          estoque_lote_id: string | null
          id: string
          motivo_perda: string
          ordem_producao_id: string | null
          quantidade_perdida: number
          responsavel_registro_id: string | null
          unidade_id: string
        }
        Insert: {
          created_at?: string | null
          custo_estimado?: number | null
          descricao_detalhada?: string | null
          estoque_lote_id?: string | null
          id?: string
          motivo_perda: string
          ordem_producao_id?: string | null
          quantidade_perdida: number
          responsavel_registro_id?: string | null
          unidade_id: string
        }
        Update: {
          created_at?: string | null
          custo_estimado?: number | null
          descricao_detalhada?: string | null
          estoque_lote_id?: string | null
          id?: string
          motivo_perda?: string
          ordem_producao_id?: string | null
          quantidade_perdida?: number
          responsavel_registro_id?: string | null
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "producao_perdas_estoque_lote_id_fkey"
            columns: ["estoque_lote_id"]
            isOneToOne: false
            referencedRelation: "estoque_lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_perdas_ordem_producao_id_fkey"
            columns: ["ordem_producao_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_perdas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      receitas: {
        Row: {
          anvisa_categoria_id: number | null
          area_painel_principal_cm2: number | null
          cliente_id: string
          created_at: string | null
          estado_alimento: string | null
          foto_url: string | null
          grupo_populacional_id: string | null
          id: string
          medida_caseira_nome: string | null
          medida_caseira_peso_g: number | null
          modo_preparo: string | null
          nome: string
          peso_embalagem_g: number
          porcao_final_g_ml: number | null
          rendimento_total_g: number
          risco_contaminacao_cruzada_ids: number[] | null
          status: string | null
          tipo_receita_id: string | null
          updated_at: string | null
          versao_atual: number | null
        }
        Insert: {
          anvisa_categoria_id?: number | null
          area_painel_principal_cm2?: number | null
          cliente_id: string
          created_at?: string | null
          estado_alimento?: string | null
          foto_url?: string | null
          grupo_populacional_id?: string | null
          id?: string
          medida_caseira_nome?: string | null
          medida_caseira_peso_g?: number | null
          modo_preparo?: string | null
          nome: string
          peso_embalagem_g?: number
          porcao_final_g_ml?: number | null
          rendimento_total_g?: number
          risco_contaminacao_cruzada_ids?: number[] | null
          status?: string | null
          tipo_receita_id?: string | null
          updated_at?: string | null
          versao_atual?: number | null
        }
        Update: {
          anvisa_categoria_id?: number | null
          area_painel_principal_cm2?: number | null
          cliente_id?: string
          created_at?: string | null
          estado_alimento?: string | null
          foto_url?: string | null
          grupo_populacional_id?: string | null
          id?: string
          medida_caseira_nome?: string | null
          medida_caseira_peso_g?: number | null
          modo_preparo?: string | null
          nome?: string
          peso_embalagem_g?: number
          porcao_final_g_ml?: number | null
          rendimento_total_g?: number
          risco_contaminacao_cruzada_ids?: number[] | null
          status?: string | null
          tipo_receita_id?: string | null
          updated_at?: string | null
          versao_atual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_receitas_tipo_receita"
            columns: ["tipo_receita_id"]
            isOneToOne: false
            referencedRelation: "tipos_receita"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receitas_anvisa_categoria_id_fkey"
            columns: ["anvisa_categoria_id"]
            isOneToOne: false
            referencedRelation: "anvisa_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receitas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receitas_grupo_populacional_id_fkey"
            columns: ["grupo_populacional_id"]
            isOneToOne: false
            referencedRelation: "anvisa_grupos_populacionais"
            referencedColumns: ["id"]
          },
        ]
      }
      receitas_versoes: {
        Row: {
          aprovado_por: string | null
          composicao_snapshot: Json
          data_aprovacao: string | null
          id: string
          modo_preparo_snapshot: string | null
          motivo_alteracao: string | null
          nome_snapshot: string
          receita_id: string
          rendimento_snapshot: number | null
          tabela_nutricional_snapshot: Json | null
          versao: number
        }
        Insert: {
          aprovado_por?: string | null
          composicao_snapshot: Json
          data_aprovacao?: string | null
          id?: string
          modo_preparo_snapshot?: string | null
          motivo_alteracao?: string | null
          nome_snapshot: string
          receita_id: string
          rendimento_snapshot?: number | null
          tabela_nutricional_snapshot?: Json | null
          versao: number
        }
        Update: {
          aprovado_por?: string | null
          composicao_snapshot?: Json
          data_aprovacao?: string | null
          id?: string
          modo_preparo_snapshot?: string | null
          motivo_alteracao?: string | null
          nome_snapshot?: string
          receita_id?: string
          rendimento_snapshot?: number | null
          tabela_nutricional_snapshot?: Json | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "receitas_versoes_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      regras_validade_sanitaria: {
        Row: {
          ambito: string | null
          ativo: boolean | null
          categoria_alimento: string
          created_at: string | null
          descricao_regra: string
          dias_validade: number
          fonte_legal: string
          horas_validade: number | null
          id: string
          prioridade: number | null
          temp_max: number
          temp_min: number
          tipo_embalagem: string | null
        }
        Insert: {
          ambito?: string | null
          ativo?: boolean | null
          categoria_alimento: string
          created_at?: string | null
          descricao_regra: string
          dias_validade?: number
          fonte_legal: string
          horas_validade?: number | null
          id?: string
          prioridade?: number | null
          temp_max: number
          temp_min?: number
          tipo_embalagem?: string | null
        }
        Update: {
          ambito?: string | null
          ativo?: boolean | null
          categoria_alimento?: string
          created_at?: string | null
          descricao_regra?: string
          dias_validade?: number
          fonte_legal?: string
          horas_validade?: number | null
          id?: string
          prioridade?: number | null
          temp_max?: number
          temp_min?: number
          tipo_embalagem?: string | null
        }
        Relationships: []
      }
      tipos_receita: {
        Row: {
          cliente_id: string | null
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          address: string | null
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_units: {
        Row: {
          unit_id: string
          user_id: string
        }
        Insert: {
          unit_id: string
          user_id: string
        }
        Update: {
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_units_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_units_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lotes_estoque: {
        Row: {
          id: string
          unidade_id: string
          ingrediente_id: string
          fornecedor_id: string
          numero_lote_fabricante: string
          nota_fiscal: string | null
          data_fabricacao: string
          data_validade_rotulo: string
          data_validade_interna: string | null
          quantidade_inicial_g_ml: number
          quantidade_atual_g_ml: number
          status: 'QUARENTENA' | 'APROVADO' | 'REJEITADO' | 'VENCIDO' | null
          created_at: string | null
        }
        Insert: {
          id?: string
          unidade_id: string
          ingrediente_id: string
          fornecedor_id: string
          numero_lote_fabricante: string
          nota_fiscal?: string | null
          data_fabricacao: string
          data_validade_rotulo: string
          data_validade_interna?: string | null
          quantidade_inicial_g_ml: number
          quantidade_atual_g_ml: number
          status?: 'QUARENTENA' | 'APROVADO' | 'REJEITADO' | 'VENCIDO' | null
          created_at?: string | null
        }
        Update: {
          id?: string
          unidade_id?: string
          ingrediente_id?: string
          fornecedor_id?: string
          numero_lote_fabricante?: string
          nota_fiscal?: string | null
          data_fabricacao?: string
          data_validade_rotulo?: string
          data_validade_interna?: string | null
          quantidade_inicial_g_ml?: number
          quantidade_atual_g_ml?: number
          status?: 'QUARENTENA' | 'APROVADO' | 'REJEITADO' | 'VENCIDO' | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lotes_estoque_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_estoque_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_audit_columns: { Args: { tbl: string }; Returns: undefined }
      fn_get_meus_clientes: { Args: never; Returns: string[] }
      fn_get_minhas_unidades: { Args: never; Returns: string[] }
      get_accessible_unit_ids: {
        Args: never
        Returns: {
          unit_id: string
        }[]
      }
      get_my_org_id: { Args: never; Returns: string }
      get_user_permissions: {
        Args: never
        Returns: {
          permission_slug: string
        }[]
      }
      registrar_producao: {
        Args: {
          p_cliente_id: string
          p_data_validade: string
          p_insumos: Json
          p_lote_codigo: string
          p_qtd_produzida: number
          p_receita_id: string
          p_responsavel_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      criticidade_insumo: "BAIXA" | "MEDIA" | "ALTA"
      status_homologacao: "PENDENTE" | "APROVADO" | "REJEITADO" | "SUSPENSO"
      status_receita: "RASCUNHO" | "EM_ANALISE" | "APROVADO" | "OBSOLETO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      criticidade_insumo: ["BAIXA", "MEDIA", "ALTA"],
      status_homologacao: ["PENDENTE", "APROVADO", "REJEITADO", "SUSPENSO"],
      status_receita: ["RASCUNHO", "EM_ANALISE", "APROVADO", "OBSOLETO"],
    },
  },
} as const
