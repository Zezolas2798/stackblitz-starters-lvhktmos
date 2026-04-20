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
          is_artificial: boolean | null
          nome: string
        }
        Insert: {
          funcao_principal?: string | null
          id?: never
          ins: string
          is_artificial?: boolean | null
          nome: string
        }
        Update: {
          funcao_principal?: string | null
          id?: never
          ins?: string
          is_artificial?: boolean | null
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
      producao_apontamentos: {
        Row: {
          created_at: string | null
          id: string
          lote_estoque_id: string
          ordem_producao_id: string
          quantidade_utilizada_g_ml: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          lote_estoque_id: string
          ordem_producao_id: string
          quantidade_utilizada_g_ml: number
        }
        Update: {
          created_at?: string | null
          id?: string
          lote_estoque_id?: string
          ordem_producao_id?: string
          quantidade_utilizada_g_ml?: number
        }
        Relationships: [
          {
            foreignKeyName: "producao_apontamentos_lote_estoque_id_fkey"
            columns: ["lote_estoque_id"]
            isOneToOne: false
            referencedRelation: "estoque_lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_apontamentos_ordem_producao_id_fkey"
            columns: ["ordem_producao_id"]
            isOneToOne: false
            referencedRelation: "producao_ordens"
            referencedColumns: ["id"]
          },
        ]
      }
      app_modulos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          nome: string
          slug: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          nome: string
          slug: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          nome?: string
          slug?: string
        }
        Relationships: []
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
      app_user_permissions: {
        Row: {
          permission_slug: string
          usuario_id: string
        }
        Insert: {
          permission_slug: string
          usuario_id: string
        }
        Update: {
          permission_slug?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_user_permissions_permission_slug_fkey"
            columns: ["permission_slug"]
            isOneToOne: false
            referencedRelation: "app_permissions"
            referencedColumns: ["slug"]
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
      cardapio_dias_uan: {
        Row: {
          cardapio_id: string
          data_consumo: string
          fator_multiplicador: number | null
          ficha_uan_id: string
          id: string
          tipo_refeicao: string
        }
        Insert: {
          cardapio_id: string
          data_consumo: string
          fator_multiplicador?: number | null
          ficha_uan_id: string
          id?: string
          tipo_refeicao: string
        }
        Update: {
          cardapio_id?: string
          data_consumo?: string
          fator_multiplicador?: number | null
          ficha_uan_id?: string
          id?: string
          tipo_refeicao?: string
        }
        Relationships: [
          {
            foreignKeyName: "cardapio_dias_uan_cardapio_id_fkey"
            columns: ["cardapio_id"]
            isOneToOne: false
            referencedRelation: "cardapios_uan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cardapio_dias_uan_ficha_uan_id_fkey"
            columns: ["ficha_uan_id"]
            isOneToOne: false
            referencedRelation: "fichas_tecnicas_uan"
            referencedColumns: ["id"]
          },
        ]
      }
      cardapio_perfis_refeicao: {
        Row: {
          cardapio_id: string
          id: string
          perfil_id: string
          refeicao: string
        }
        Insert: {
          cardapio_id: string
          id?: string
          perfil_id: string
          refeicao: string
        }
        Update: {
          cardapio_id?: string
          id?: string
          perfil_id?: string
          refeicao?: string
        }
        Relationships: [
          {
            foreignKeyName: "cardapio_perfis_refeicao_cardapio_id_fkey"
            columns: ["cardapio_id"]
            isOneToOne: false
            referencedRelation: "cardapios_uan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cardapio_perfis_refeicao_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis_cardapio"
            referencedColumns: ["id"]
          },
        ]
      }
      cardapio_regras_variedade: {
        Row: {
          ativo: boolean | null
          cliente_id: string
          created_at: string | null
          descricao: string | null
          dias_janela: number | null
          id: string
          limiar_similaridade: number | null
          parametro_alvo: string | null
          severidade: string | null
          tipo_regra: string
          updated_at: string | null
          valor_limite: number | null
        }
        Insert: {
          ativo?: boolean | null
          cliente_id: string
          created_at?: string | null
          descricao?: string | null
          dias_janela?: number | null
          id?: string
          limiar_similaridade?: number | null
          parametro_alvo?: string | null
          severidade?: string | null
          tipo_regra: string
          updated_at?: string | null
          valor_limite?: number | null
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: string
          created_at?: string | null
          descricao?: string | null
          dias_janela?: number | null
          id?: string
          limiar_similaridade?: number | null
          parametro_alvo?: string | null
          severidade?: string | null
          tipo_regra?: string
          updated_at?: string | null
          valor_limite?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cardapio_regras_variedade_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cardapios_uan: {
        Row: {
          cliente_id: string
          comensais_estimados_dia: number | null
          comensais_modelo: Json | null
          config_excecoes_dias: Json | null
          created_at: string | null
          data_fim: string
          data_inicio: string
          dias_funcionamento: Json | null
          horario_refeicoes: Json | null
          id: string
          margem_erro_compras_global: number | null
          nome_ciclo: string
          refeicoes_oferecidas: Json | null
          setor_producao_id: string | null
          status: string | null
          unidade_id: string | null
        }
        Insert: {
          cliente_id: string
          comensais_estimados_dia?: number | null
          comensais_modelo?: Json | null
          config_excecoes_dias?: Json | null
          created_at?: string | null
          data_fim: string
          data_inicio: string
          dias_funcionamento?: Json | null
          horario_refeicoes?: Json | null
          id?: string
          margem_erro_compras_global?: number | null
          nome_ciclo: string
          refeicoes_oferecidas?: Json | null
          setor_producao_id?: string | null
          status?: string | null
          unidade_id?: string | null
        }
        Update: {
          cliente_id?: string
          comensais_estimados_dia?: number | null
          comensais_modelo?: Json | null
          config_excecoes_dias?: Json | null
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          dias_funcionamento?: Json | null
          horario_refeicoes?: Json | null
          id?: string
          margem_erro_compras_global?: number | null
          nome_ciclo?: string
          refeicoes_oferecidas?: Json | null
          setor_producao_id?: string | null
          status?: string | null
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cardapios_uan_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cardapios_uan_setor_producao_id_fkey"
            columns: ["setor_producao_id"]
            isOneToOne: false
            referencedRelation: "setores_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_config: {
        Row: {
          cliente_id: string
          created_at: string | null
          deleted_at: string | null
          documentos_obrigatorios: Json | null
          ged_pasta_id: string | null
          id: string
          nome: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          deleted_at?: string | null
          documentos_obrigatorios?: Json | null
          ged_pasta_id?: string | null
          id?: string
          nome: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          deleted_at?: string | null
          documentos_obrigatorios?: Json | null
          ged_pasta_id?: string | null
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_config_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorias_config_ged_pasta_id_fkey"
            columns: ["ged_pasta_id"]
            isOneToOne: false
            referencedRelation: "documentos_pastas"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_auditorias_legacy: {
        Row: {
          assinatura_auditor_url: string | null
          cliente_id: string
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          deleted_at: string | null
          id: string
          modelo_id: string
          observacoes_gerais: string | null
          pontuacao_obtida: number | null
          responsavel_id: string | null
          status: string | null
          titulo: string | null
        }
        Insert: {
          assinatura_auditor_url?: string | null
          cliente_id: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          deleted_at?: string | null
          id?: string
          modelo_id: string
          observacoes_gerais?: string | null
          pontuacao_obtida?: number | null
          responsavel_id?: string | null
          status?: string | null
          titulo?: string | null
        }
        Update: {
          assinatura_auditor_url?: string | null
          cliente_id?: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          deleted_at?: string | null
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
          cliente_id: string | null
          data_fim: string | null
          data_inicio: string | null
          deleted_at: string | null
          id: string
          modelo_id: string
          observacoes_gerais: string | null
          responsavel_id: string | null
          score_obtido: number | null
          status: string | null
          titulo: string | null
          unidade_id: string
        }
        Insert: {
          assinatura_eletronica_hash?: string | null
          cliente_id?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          deleted_at?: string | null
          id?: string
          modelo_id: string
          observacoes_gerais?: string | null
          responsavel_id?: string | null
          score_obtido?: number | null
          status?: string | null
          titulo?: string | null
          unidade_id: string
        }
        Update: {
          assinatura_eletronica_hash?: string | null
          cliente_id?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          deleted_at?: string | null
          id?: string
          modelo_id?: string
          observacoes_gerais?: string | null
          responsavel_id?: string | null
          score_obtido?: number | null
          status?: string | null
          titulo?: string | null
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_execucoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "fk_checklist_execucoes_responsavel"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_itens: {
        Row: {
          ajuda_texto: string | null
          classificacao: string | null
          deleted_at: string | null
          id: string
          modelo_id: string
          norma_referencia_id: number | null
          obrigatorio: boolean | null
          ordem: number
          peso: number | null
          requer_foto: boolean | null
          secao_id: string | null
          texto_pergunta: string
          tipo_resposta: string
        }
        Insert: {
          ajuda_texto?: string | null
          classificacao?: string | null
          deleted_at?: string | null
          id?: string
          modelo_id: string
          norma_referencia_id?: number | null
          obrigatorio?: boolean | null
          ordem?: number
          peso?: number | null
          requer_foto?: boolean | null
          secao_id?: string | null
          texto_pergunta: string
          tipo_resposta: string
        }
        Update: {
          ajuda_texto?: string | null
          classificacao?: string | null
          deleted_at?: string | null
          id?: string
          modelo_id?: string
          norma_referencia_id?: number | null
          obrigatorio?: boolean | null
          ordem?: number
          peso?: number | null
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
            foreignKeyName: "checklist_respostas_execucao_id_fkey"
            columns: ["auditoria_id"]
            isOneToOne: false
            referencedRelation: "checklist_execucoes"
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
          cor: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          modelo_id: string
          ordem: number | null
          titulo: string
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          modelo_id: string
          ordem?: number | null
          titulo: string
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          deleted_at?: string | null
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
      controle_temperatura: {
        Row: {
          alimento: string | null
          cliente_id: string | null
          created_at: string | null
          data: string
          deleted_at: string | null
          equipamento_id: string | null
          hora_afericao: string | null
          id: string
          local_id: string | null
          obs: string | null
          periodo: string | null
          produto_id: string | null
          receita_id: string | null
          responsavel_id: string | null
          status: string
          temp_alimento: number | null
          temp_equipamento: number | null
          unidade_id: string | null
        }
        Insert: {
          alimento?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data?: string
          deleted_at?: string | null
          equipamento_id?: string | null
          hora_afericao?: string | null
          id?: string
          local_id?: string | null
          obs?: string | null
          periodo?: string | null
          produto_id?: string | null
          receita_id?: string | null
          responsavel_id?: string | null
          status?: string
          temp_alimento?: number | null
          temp_equipamento?: number | null
          unidade_id?: string | null
        }
        Update: {
          alimento?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data?: string
          deleted_at?: string | null
          equipamento_id?: string | null
          hora_afericao?: string | null
          id?: string
          local_id?: string | null
          obs?: string | null
          periodo?: string | null
          produto_id?: string | null
          receita_id?: string | null
          responsavel_id?: string | null
          status?: string
          temp_alimento?: number | null
          temp_equipamento?: number | null
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "controle_temperatura_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controle_temperatura_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controle_temperatura_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "estoque_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controle_temperatura_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "gerencial_compras_kraljic_base"
            referencedColumns: ["ingrediente_id"]
          },
          {
            foreignKeyName: "controle_temperatura_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controle_temperatura_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos_config: {
        Row: {
          ativo: boolean | null
          cliente_id: string
          created_at: string | null
          frequencia_diaria: number | null
          grupo: string
          horarios_afericao: string[] | null
          id: string
          nome: string
          parent_id: string | null
          temp_ideal_max: number | null
          temp_ideal_min: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cliente_id: string
          created_at?: string | null
          frequencia_diaria?: number | null
          grupo: string
          horarios_afericao?: string[] | null
          id?: string
          nome: string
          parent_id?: string | null
          temp_ideal_max?: number | null
          temp_ideal_min?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: string
          created_at?: string | null
          frequencia_diaria?: number | null
          grupo?: string
          horarios_afericao?: string[] | null
          id?: string
          nome?: string
          parent_id?: string | null
          temp_ideal_max?: number | null
          temp_ideal_min?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_config_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipamentos_config_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "equipamentos_config"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_locais: {
        Row: {
          ativo: boolean | null
          grupos_permitidos_ids: string[] | null
          cliente_id: string | null
          equipamento_config_id: string | null
          id: string
          nome: string
          temp_alvo_max: number | null
          temp_alvo_min: number | null
          tipo_ambiente: string | null
          unidade_id: string
        }
        Insert: {
          ativo?: boolean | null
          grupos_permitidos_ids?: string[] | null
          cliente_id?: string | null
          equipamento_config_id?: string | null
          id?: string
          nome: string
          temp_alvo_max?: number | null
          temp_alvo_min?: number | null
          tipo_ambiente?: string | null
          unidade_id: string
        }
        Update: {
          ativo?: boolean | null
          grupos_permitidos_ids?: string[] | null
          cliente_id?: string | null
          equipamento_config_id?: string | null
          id?: string
          nome?: string
          temp_alvo_max?: number | null
          temp_alvo_min?: number | null
          tipo_ambiente?: string | null
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_locais_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_locais_equipamento_config_id_fkey"
            columns: ["equipamento_config_id"]
            isOneToOne: false
            referencedRelation: "equipamentos_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_locais_unidade_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_modulos: {
        Row: {
          ativo: boolean | null
          cliente_id: string
          created_at: string | null
          id: string
          modulo_slug: string
        }
        Insert: {
          ativo?: boolean | null
          cliente_id: string
          created_at?: string | null
          id?: string
          modulo_slug: string
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: string
          created_at?: string | null
          id?: string
          modulo_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_modulos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_modulos_modulo_slug_fkey"
            columns: ["modulo_slug"]
            isOneToOne: false
            referencedRelation: "app_modulos"
            referencedColumns: ["slug"]
          },
        ]
      }
      setores_producao: {
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
            foreignKeyName: "setores_producao_cliente_id_fkey"
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
          cep: string | null
          cliente_id: string
          cnae_principal: string | null
          cnaes: Json | null
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
          cep?: string | null
          cliente_id: string
          cnae_principal?: string | null
          cnaes?: Json | null
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
          cep?: string | null
          cliente_id?: string
          cnae_principal?: string | null
          cnaes?: Json | null
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
          cep: string | null
          cnaes: Json | null
          cnpj_raiz: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          endereco_completo: string | null
          id: string
          logo_url: string | null
          nome_fantasia: string | null
          razao_social: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cep?: string | null
          cnaes?: Json | null
          cnpj_raiz: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          endereco_completo?: string | null
          id?: string
          logo_url?: string | null
          nome_fantasia?: string | null
          razao_social: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cep?: string | null
          cnaes?: Json | null
          cnpj_raiz?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          endereco_completo?: string | null
          id?: string
          logo_url?: string | null
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
      composicao_fichas_uan: {
        Row: {
          fator_correcao: number
          ficha_uan_id: string
          id: string
          indice_coccao: number
          ingrediente_id: string
          peso_bruto_g: number
          peso_liquido_g: number
          referencia_id: string | null
        }
        Insert: {
          fator_correcao?: number
          ficha_uan_id: string
          id?: string
          indice_coccao?: number
          ingrediente_id: string
          peso_bruto_g: number
          peso_liquido_g: number
          referencia_id?: string | null
        }
        Update: {
          fator_correcao?: number
          ficha_uan_id?: string
          id?: string
          indice_coccao?: number
          ingrediente_id?: string
          peso_bruto_g?: number
          peso_liquido_g?: number
          referencia_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "composicao_fichas_uan_ficha_uan_id_fkey"
            columns: ["ficha_uan_id"]
            isOneToOne: false
            referencedRelation: "fichas_tecnicas_uan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "composicao_fichas_uan_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "gerencial_compras_kraljic_base"
            referencedColumns: ["ingrediente_id"]
          },
          {
            foreignKeyName: "composicao_fichas_uan_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "composicao_fichas_uan_referencia_id_fkey"
            columns: ["referencia_id"]
            isOneToOne: false
            referencedRelation: "referencias_nutricionais"
            referencedColumns: ["id"]
          },
        ]
      }
      composicao_receitas: {
        Row: {
          created_at: string
          fator_correcao: number
          id: string
          indice_coccao: number
          is_preparation_only: boolean | null
          item_id: string
          item_type: string | null
          medida_caseira: string | null
          ordem: number | null
          peso_bruto_g: number
          peso_liquido_g: number
          receita_id: string
          referencia_id: string | null
        }
        Insert: {
          created_at?: string
          fator_correcao?: number
          id?: string
          indice_coccao?: number
          is_preparation_only?: boolean | null
          item_id: string
          item_type?: string | null
          medida_caseira?: string | null
          ordem?: number | null
          peso_bruto_g?: number
          peso_liquido_g?: number
          receita_id: string
          referencia_id?: string | null
        }
        Update: {
          created_at?: string
          fator_correcao?: number
          id?: string
          indice_coccao?: number
          is_preparation_only?: boolean | null
          item_id?: string
          item_type?: string | null
          medida_caseira?: string | null
          ordem?: number | null
          peso_bruto_g?: number
          peso_liquido_g?: number
          receita_id?: string
          referencia_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "composicao_receitas_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "composicao_receitas_referencia_id_fkey"
            columns: ["referencia_id"]
            isOneToOne: false
            referencedRelation: "referencias_nutricionais"
            referencedColumns: ["id"]
          },
        ]
      }
      compras_orcamentos: {
        Row: {
          cliente_id: string
          created_at: string | null
          data_orcamento: string
          fornecedor_id: string
          id: string
          ingrediente_id: string
          is_embalagem: boolean | null
          peso_volume_por_unidade: number | null
          preco_embalagem: number | null
          preco_por_kg_l: number
          unidade_id: string
          unidades_por_embalagem: number | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          data_orcamento?: string
          fornecedor_id: string
          id?: string
          ingrediente_id: string
          is_embalagem?: boolean | null
          peso_volume_por_unidade?: number | null
          preco_embalagem?: number | null
          preco_por_kg_l: number
          unidade_id: string
          unidades_por_embalagem?: number | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          data_orcamento?: string
          fornecedor_id?: string
          id?: string
          ingrediente_id?: string
          is_embalagem?: boolean | null
          peso_volume_por_unidade?: number | null
          preco_embalagem?: number | null
          preco_por_kg_l?: number
          unidade_id?: string
          unidades_por_embalagem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_orcamentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_orcamentos_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "gerencial_compras_kraljic_base"
            referencedColumns: ["ingrediente_id"]
          },
          {
            foreignKeyName: "compras_orcamentos_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_orcamentos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
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
      documentos_arquivos: {
        Row: {
          created_at: string | null
          data_emissao: string | null
          data_validade: string | null
          deleted_at: string | null
          frequencia_verificacao: string | null
          id: string
          nome_arquivo: string
          pasta_id: string
          tamanho_bytes: number | null
          url_storage: string | null
          versao: number | null
        }
        Insert: {
          created_at?: string | null
          data_emissao?: string | null
          data_validade?: string | null
          deleted_at?: string | null
          frequencia_verificacao?: string | null
          id?: string
          nome_arquivo: string
          pasta_id: string
          tamanho_bytes?: number | null
          url_storage?: string | null
          versao?: number | null
        }
        Update: {
          created_at?: string | null
          data_emissao?: string | null
          data_validade?: string | null
          deleted_at?: string | null
          frequencia_verificacao?: string | null
          id?: string
          nome_arquivo?: string
          pasta_id?: string
          tamanho_bytes?: number | null
          url_storage?: string | null
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_arquivos_pasta_id_fkey"
            columns: ["pasta_id"]
            isOneToOne: false
            referencedRelation: "documentos_pastas"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_categorias: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          nome: string
          ordem: number | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          nome: string
          ordem?: number | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          nome?: string
          ordem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_categorias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_pastas: {
        Row: {
          categoria_id: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          nome: string
          ordem: number | null
          parent_id: string | null
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          nome: string
          ordem?: number | null
          parent_id?: string | null
        }
        Update: {
          categoria_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_pastas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "documentos_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_pastas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "documentos_pastas"
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
            referencedRelation: "gerencial_compras_kraljic_base"
            referencedColumns: ["ingrediente_id"]
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
      estoque_inventario_itens: {
        Row: {
          ajuste_aplicado: boolean | null
          conferido: boolean | null
          conferido_em: string | null
          conferido_por: string | null
          created_at: string | null
          divergencia_g: number | null
          id: string
          inventario_id: string
          lote_id: string
          metodo: string | null
          qtd_conferida_g: number | null
          qtd_esperada_g: number
        }
        Insert: {
          ajuste_aplicado?: boolean | null
          conferido?: boolean | null
          conferido_em?: string | null
          conferido_por?: string | null
          created_at?: string | null
          divergencia_g?: number | null
          id?: string
          inventario_id: string
          lote_id: string
          metodo?: string | null
          qtd_conferida_g?: number | null
          qtd_esperada_g?: number
        }
        Update: {
          ajuste_aplicado?: boolean | null
          conferido?: boolean | null
          conferido_em?: string | null
          conferido_por?: string | null
          created_at?: string | null
          divergencia_g?: number | null
          id?: string
          inventario_id?: string
          lote_id?: string
          metodo?: string | null
          qtd_conferida_g?: number | null
          qtd_esperada_g?: number
        }
        Relationships: [
          {
            foreignKeyName: "estoque_inventario_itens_inventario_id_fkey"
            columns: ["inventario_id"]
            isOneToOne: false
            referencedRelation: "estoque_inventarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_inventario_itens_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "estoque_lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_inventarios: {
        Row: {
          cliente_id: string
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          id: string
          local_estoque_id: string | null
          observacoes: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          status: string
          total_conferido: number | null
          total_divergencias: number | null
          total_esperado: number | null
          unidade_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          id?: string
          local_estoque_id?: string | null
          observacoes?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string
          total_conferido?: number | null
          total_divergencias?: number | null
          total_esperado?: number | null
          unidade_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          id?: string
          local_estoque_id?: string | null
          observacoes?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string
          total_conferido?: number | null
          total_divergencias?: number | null
          total_esperado?: number | null
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_inventarios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_inventarios_local_estoque_id_fkey"
            columns: ["local_estoque_id"]
            isOneToOne: false
            referencedRelation: "estoque_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_inventarios_unidade_id_fkey"
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
          {
            foreignKeyName: "estoque_movimentacoes_estoque_lotes_fk"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "estoque_lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      fichas_tecnicas_uan: {
        Row: {
          categoria_uan: string
          cliente_id: string
          cor_predominante: string | null
          created_at: string | null
          id: string
          metodo_coccao: string | null
          modo_preparo: string | null
          nome: string
          peso_porcao_g: number
          refeicoes: string[] | null
          rendimento_porcoes: number
          rico_em_enxofre: boolean | null
          tempo_preparo_min: number | null
          textura_principal: string | null
          updated_at: string | null
        }
        Insert: {
          categoria_uan: string
          cliente_id: string
          cor_predominante?: string | null
          created_at?: string | null
          id?: string
          metodo_coccao?: string | null
          modo_preparo?: string | null
          nome: string
          peso_porcao_g: number
          refeicoes?: string[] | null
          rendimento_porcoes?: number
          rico_em_enxofre?: boolean | null
          tempo_preparo_min?: number | null
          textura_principal?: string | null
          updated_at?: string | null
        }
        Update: {
          categoria_uan?: string
          cliente_id?: string
          cor_predominante?: string | null
          created_at?: string | null
          id?: string
          metodo_coccao?: string | null
          modo_preparo?: string | null
          nome?: string
          peso_porcao_g?: number
          refeicoes?: string[] | null
          rendimento_porcoes?: number
          rico_em_enxofre?: boolean | null
          tempo_preparo_min?: number | null
          textura_principal?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fichas_tecnicas_uan_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_contas: {
        Row: {
          alocacao_custo:
            | Database["public"]["Enums"]["fin_alocacao_custo"]
            | null
          ativo: boolean | null
          cliente_id: string
          codigo: string
          comportamento_custo:
            | Database["public"]["Enums"]["fin_comportamento_custo"]
            | null
          conta_pai_id: string | null
          created_at: string | null
          id: string
          nome: string
          subtipo_usar: Database["public"]["Enums"]["fin_subtipo_usar"] | null
          tipo: Database["public"]["Enums"]["fin_tipo_conta"]
          updated_at: string | null
        }
        Insert: {
          alocacao_custo?:
            | Database["public"]["Enums"]["fin_alocacao_custo"]
            | null
          ativo?: boolean | null
          cliente_id: string
          codigo: string
          comportamento_custo?:
            | Database["public"]["Enums"]["fin_comportamento_custo"]
            | null
          conta_pai_id?: string | null
          created_at?: string | null
          id?: string
          nome: string
          subtipo_usar?: Database["public"]["Enums"]["fin_subtipo_usar"] | null
          tipo: Database["public"]["Enums"]["fin_tipo_conta"]
          updated_at?: string | null
        }
        Update: {
          alocacao_custo?:
            | Database["public"]["Enums"]["fin_alocacao_custo"]
            | null
          ativo?: boolean | null
          cliente_id?: string
          codigo?: string
          comportamento_custo?:
            | Database["public"]["Enums"]["fin_comportamento_custo"]
            | null
          conta_pai_id?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          subtipo_usar?: Database["public"]["Enums"]["fin_subtipo_usar"] | null
          tipo?: Database["public"]["Enums"]["fin_tipo_conta"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_contas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_contas_conta_pai_id_fkey"
            columns: ["conta_pai_id"]
            isOneToOne: false
            referencedRelation: "fin_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_integracoes_delivery: {
        Row: {
          ativo: boolean
          client_id: string | null
          client_secret_encrypted: string | null
          cliente_id: string
          created_at: string | null
          id: string
          merchant_id: string | null
          nome_exibicao: string
          plataforma: string
          taxa_mdr: number
          unidade_id: string | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          ativo?: boolean
          client_id?: string | null
          client_secret_encrypted?: string | null
          cliente_id: string
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          nome_exibicao?: string
          plataforma?: string
          taxa_mdr?: number
          unidade_id?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          ativo?: boolean
          client_id?: string | null
          client_secret_encrypted?: string | null
          cliente_id?: string
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          nome_exibicao?: string
          plataforma?: string
          taxa_mdr?: number
          unidade_id?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_integracoes_delivery_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_integracoes_delivery_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_integracoes_pdv: {
        Row: {
          api_endpoint: string | null
          api_key_encrypted: string | null
          ativo: boolean
          cliente_id: string
          created_at: string | null
          id: string
          nome: string
          tipo_pdv: string
          unidade_id: string | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          ativo?: boolean
          cliente_id: string
          created_at?: string | null
          id?: string
          nome?: string
          tipo_pdv?: string
          unidade_id?: string | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          ativo?: boolean
          cliente_id?: string
          created_at?: string | null
          id?: string
          nome?: string
          tipo_pdv?: string
          unidade_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_integracoes_pdv_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_integracoes_pdv_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_lancamentos: {
        Row: {
          conta_id: string
          created_at: string | null
          id: string
          tipo_lancamento: Database["public"]["Enums"]["fin_tipo_lancamento"]
          transacao_id: string
          valor: number
        }
        Insert: {
          conta_id: string
          created_at?: string | null
          id?: string
          tipo_lancamento: Database["public"]["Enums"]["fin_tipo_lancamento"]
          transacao_id: string
          valor: number
        }
        Update: {
          conta_id?: string
          created_at?: string | null
          id?: string
          tipo_lancamento?: Database["public"]["Enums"]["fin_tipo_lancamento"]
          transacao_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_lancamentos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "fin_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_lancamentos_transacao_id_fkey"
            columns: ["transacao_id"]
            isOneToOne: false
            referencedRelation: "fin_transacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_transacoes: {
        Row: {
          comprovante_url: string | null
          created_at: string | null
          created_by: string | null
          data_competencia: string
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string
          id: string
          nota_fiscal: string | null
          origem_id: string | null
          origem_modulo: Database["public"]["Enums"]["fin_modulo_origem"]
          unidade_id: string
          updated_at: string | null
          valor_total: number
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string | null
          created_by?: string | null
          data_competencia: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao: string
          id?: string
          nota_fiscal?: string | null
          origem_id?: string | null
          origem_modulo?: Database["public"]["Enums"]["fin_modulo_origem"]
          unidade_id: string
          updated_at?: string | null
          valor_total?: number
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string | null
          created_by?: string | null
          data_competencia?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string
          id?: string
          nota_fiscal?: string | null
          origem_id?: string | null
          origem_modulo?: Database["public"]["Enums"]["fin_modulo_origem"]
          unidade_id?: string
          updated_at?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_transacoes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_vendas_delivery: {
        Row: {
          cliente_id: string
          created_at: string | null
          id: string
          importado_em: string | null
          integracao_id: string
          mes_ano: string
          origem: string
          pedidos_total: number
          receita_bruta: number
          repasse_liquido: number
          taxa_plataforma: number
          ticket_medio: number
          unidade_id: string | null
          updated_at: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          id?: string
          importado_em?: string | null
          integracao_id: string
          mes_ano: string
          origem?: string
          pedidos_total?: number
          receita_bruta?: number
          repasse_liquido?: number
          taxa_plataforma?: number
          ticket_medio?: number
          unidade_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          id?: string
          importado_em?: string | null
          integracao_id?: string
          mes_ano?: string
          origem?: string
          pedidos_total?: number
          receita_bruta?: number
          repasse_liquido?: number
          taxa_plataforma?: number
          ticket_medio?: number
          unidade_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_vendas_delivery_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_vendas_delivery_integracao_id_fkey"
            columns: ["integracao_id"]
            isOneToOne: false
            referencedRelation: "fin_integracoes_delivery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_vendas_delivery_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_vendas_mensais: {
        Row: {
          cliente_id: string
          created_at: string | null
          id: string
          mes_ano: string
          preco_venda: number
          quantidade_vendida: number
          receita_id: string
          updated_at: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          id?: string
          mes_ano: string
          preco_venda?: number
          quantidade_vendida?: number
          receita_id: string
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          id?: string
          mes_ano?: string
          preco_venda?: number
          quantidade_vendida?: number
          receita_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_vendas_mensais_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_vendas_mensais_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          categorias_compras: string[] | null
          cliente_id: string
          cnae_principal: string | null
          cnaes_secundarios: Json | null
          cnpj: string
          contato_qualidade_email: string | null
          contato_qualidade_nome: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          dia_semana_entrega: number[] | null
          email: string | null
          endereco_completo: string | null
          frequencia_entrega: string | null
          grupos_fornecidos: string[] | null
          id: string
          itens_fornecidos: string[] | null
          lead_time_dias: number | null
          licenca_sanitaria_numero: string | null
          licenca_sanitaria_validade: string | null
          lote_minimo_pedido: number | null
          nome_fantasia: string | null
          pasta_documentos_id: string | null
          prazo_pagamento_dias: number | null
          razao_social: string
          situacao_cadastral: string | null
          status_homologacao: string | null
          telefone: string | null
          tipo: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          categorias_compras?: string[] | null
          cliente_id: string
          cnae_principal?: string | null
          cnaes_secundarios?: Json | null
          cnpj: string
          contato_qualidade_email?: string | null
          contato_qualidade_nome?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          dia_semana_entrega?: number[] | null
          email?: string | null
          endereco_completo?: string | null
          frequencia_entrega?: string | null
          grupos_fornecidos?: string[] | null
          id?: string
          itens_fornecidos?: string[] | null
          lead_time_dias?: number | null
          licenca_sanitaria_numero?: string | null
          licenca_sanitaria_validade?: string | null
          lote_minimo_pedido?: number | null
          nome_fantasia?: string | null
          pasta_documentos_id?: string | null
          prazo_pagamento_dias?: number | null
          razao_social: string
          situacao_cadastral?: string | null
          status_homologacao?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          categorias_compras?: string[] | null
          cliente_id?: string
          cnae_principal?: string | null
          cnaes_secundarios?: Json | null
          cnpj?: string
          contato_qualidade_email?: string | null
          contato_qualidade_nome?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          dia_semana_entrega?: number[] | null
          email?: string | null
          endereco_completo?: string | null
          frequencia_entrega?: string | null
          grupos_fornecidos?: string[] | null
          id?: string
          itens_fornecidos?: string[] | null
          lead_time_dias?: number | null
          licenca_sanitaria_numero?: string | null
          licenca_sanitaria_validade?: string | null
          lote_minimo_pedido?: number | null
          nome_fantasia?: string | null
          pasta_documentos_id?: string | null
          prazo_pagamento_dias?: number | null
          razao_social?: string
          situacao_cadastral?: string | null
          status_homologacao?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fornecedores_pasta_documentos_id_fkey"
            columns: ["pasta_documentos_id"]
            isOneToOne: false
            referencedRelation: "documentos_pastas"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_produto: {
        Row: {
          ativo: boolean | null
          cliente_id: string
          created_at: string | null
          id: string
          modalidade:
            | Database["public"]["Enums"]["modalidade_produto_enum"]
            | null
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          cliente_id: string
          created_at?: string | null
          id?: string
          modalidade?:
            | Database["public"]["Enums"]["modalidade_produto_enum"]
            | null
          nome: string
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: string
          created_at?: string | null
          id?: string
          modalidade?:
            | Database["public"]["Enums"]["modalidade_produto_enum"]
            | null
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_produto_cliente_id_fkey"
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
          is_derivado: boolean | null
          is_direto: boolean | null
          nivel_contato: string
        }
        Insert: {
          anvisa_alergenico_id: number
          created_at?: string | null
          id?: string
          ingrediente_id: string
          is_derivado?: boolean | null
          is_direto?: boolean | null
          nivel_contato?: string
        }
        Update: {
          anvisa_alergenico_id?: number
          created_at?: string | null
          id?: string
          ingrediente_id?: string
          is_derivado?: boolean | null
          is_direto?: boolean | null
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
            referencedRelation: "gerencial_compras_kraljic_base"
            referencedColumns: ["ingrediente_id"]
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
          classificacao_nova: number | null
          cliente_id: string | null
          cloreto_mg: number | null
          cobre_mcg: number | null
          colesterol_mg: number | null
          contem_gluten: boolean | null
          created_at: string | null
          created_by: string | null
          cromo_mcg: number | null
          custo_medio: number | null
          declaracao_ingredientes_fornecedor: string | null
          deleted_at: string | null
          energia_kcal: number | null
          eritritol_g: number | null
          especie_doadora: string | null
          especie_transgenica: string | null
          estoque_minimo_kg: number | null
          estoque_seguranca_perc: number | null
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
          grupo_id: string | null
          id: string
          ins_code: string | null
          iodo_mcg: number | null
          is_aspartame: boolean | null
          is_corante_artificial: boolean | null
          is_corante_carmim: boolean | null
          is_sunset_yellow: boolean | null
          is_tartrazina: boolean | null
          is_transgenico: boolean | null
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
          preco_ultima_compra: number | null
          proteina_g: number | null
          referencia_id: string | null
          referencia_nutricional_id: string | null
          selenio_mcg: number | null
          sodio_mg: number | null
          sorbitol_g: number | null
          subgrupo_id: string | null
          tempo_minimo_compra_dias: number | null
          tipo_ingrediente: string | null
          transgenicos: Json | null
          updated_at: string | null
          updated_by: string | null
          uso_medio_diario: number | null
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
          classificacao_nova?: number | null
          cliente_id?: string | null
          cloreto_mg?: number | null
          cobre_mcg?: number | null
          colesterol_mg?: number | null
          contem_gluten?: boolean | null
          created_at?: string | null
          created_by?: string | null
          cromo_mcg?: number | null
          custo_medio?: number | null
          declaracao_ingredientes_fornecedor?: string | null
          deleted_at?: string | null
          energia_kcal?: number | null
          eritritol_g?: number | null
          especie_doadora?: string | null
          especie_transgenica?: string | null
          estoque_minimo_kg?: number | null
          estoque_seguranca_perc?: number | null
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
          grupo_id?: string | null
          id?: string
          ins_code?: string | null
          iodo_mcg?: number | null
          is_aspartame?: boolean | null
          is_corante_artificial?: boolean | null
          is_corante_carmim?: boolean | null
          is_sunset_yellow?: boolean | null
          is_tartrazina?: boolean | null
          is_transgenico?: boolean | null
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
          preco_ultima_compra?: number | null
          proteina_g?: number | null
          referencia_id?: string | null
          referencia_nutricional_id?: string | null
          selenio_mcg?: number | null
          sodio_mg?: number | null
          sorbitol_g?: number | null
          subgrupo_id?: string | null
          tempo_minimo_compra_dias?: number | null
          tipo_ingrediente?: string | null
          transgenicos?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          uso_medio_diario?: number | null
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
          classificacao_nova?: number | null
          cliente_id?: string | null
          cloreto_mg?: number | null
          cobre_mcg?: number | null
          colesterol_mg?: number | null
          contem_gluten?: boolean | null
          created_at?: string | null
          created_by?: string | null
          cromo_mcg?: number | null
          custo_medio?: number | null
          declaracao_ingredientes_fornecedor?: string | null
          deleted_at?: string | null
          energia_kcal?: number | null
          eritritol_g?: number | null
          especie_doadora?: string | null
          especie_transgenica?: string | null
          estoque_minimo_kg?: number | null
          estoque_seguranca_perc?: number | null
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
          grupo_id?: string | null
          id?: string
          ins_code?: string | null
          iodo_mcg?: number | null
          is_aspartame?: boolean | null
          is_corante_artificial?: boolean | null
          is_corante_carmim?: boolean | null
          is_sunset_yellow?: boolean | null
          is_tartrazina?: boolean | null
          is_transgenico?: boolean | null
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
          preco_ultima_compra?: number | null
          proteina_g?: number | null
          referencia_id?: string | null
          referencia_nutricional_id?: string | null
          selenio_mcg?: number | null
          sodio_mg?: number | null
          sorbitol_g?: number | null
          subgrupo_id?: string | null
          tempo_minimo_compra_dias?: number | null
          tipo_ingrediente?: string | null
          transgenicos?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          uso_medio_diario?: number | null
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
          {
            foreignKeyName: "ingredientes_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_produto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredientes_referencia_id_fkey"
            columns: ["referencia_id"]
            isOneToOne: false
            referencedRelation: "referencias_nutricionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredientes_referencia_nutricional_id_fkey"
            columns: ["referencia_nutricional_id"]
            isOneToOne: false
            referencedRelation: "referencias_nutricionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredientes_subgrupo_id_fkey"
            columns: ["subgrupo_id"]
            isOneToOne: false
            referencedRelation: "subgrupos_produto"
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
            referencedRelation: "producao_ordens"
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
      listas_compras_uan: {
        Row: {
          cardapio_id: string
          data_geracao: string | null
          id: string
          itens_json: Json
          status: string | null
        }
        Insert: {
          cardapio_id: string
          data_geracao?: string | null
          id?: string
          itens_json?: Json
          status?: string | null
        }
        Update: {
          cardapio_id?: string
          data_geracao?: string | null
          id?: string
          itens_json?: Json
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listas_compras_uan_cardapio_id_fkey"
            columns: ["cardapio_id"]
            isOneToOne: false
            referencedRelation: "cardapios_uan"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_lotes: {
        Row: {
          categoria_produto: string | null
          cliente_id: string | null
          created_at: string | null
          data_fabricacao: string | null
          data_validade_interna: string | null
          data_validade_rotulo: string | null
          data_vencimento_financeiro: string | null
          deleted_at: string | null
          estado_produto: string | null
          financeiro_processado: boolean | null
          fornecedor_id: string
          id: string
          ingrediente_id: string | null
          local_estoque_id: string | null
          material_id: string | null
          nota_fiscal: string | null
          numero_lote_fabricante: string
          observacoes: string | null
          peso_unitario_embalagem: number | null
          qtd_embalagens: number | null
          quantidade_atual_g_ml: number
          quantidade_inicial_g_ml: number
          registro_sif: string | null
          status: Database["public"]["Enums"]["status_lote_estoque"] | null
          temperatura_recebimento: number | null
          unidade_id: string
          unidade_peso_embalagem: string | null
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          categoria_produto?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data_fabricacao?: string | null
          data_validade_interna?: string | null
          data_validade_rotulo?: string | null
          data_vencimento_financeiro?: string | null
          deleted_at?: string | null
          estado_produto?: string | null
          financeiro_processado?: boolean | null
          fornecedor_id: string
          id?: string
          ingrediente_id?: string | null
          local_estoque_id?: string | null
          material_id?: string | null
          nota_fiscal?: string | null
          numero_lote_fabricante: string
          observacoes?: string | null
          peso_unitario_embalagem?: number | null
          qtd_embalagens?: number | null
          quantidade_atual_g_ml: number
          quantidade_inicial_g_ml: number
          registro_sif?: string | null
          status?: Database["public"]["Enums"]["status_lote_estoque"] | null
          temperatura_recebimento?: number | null
          unidade_id: string
          unidade_peso_embalagem?: string | null
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          categoria_produto?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data_fabricacao?: string | null
          data_validade_interna?: string | null
          data_validade_rotulo?: string | null
          data_vencimento_financeiro?: string | null
          deleted_at?: string | null
          estado_produto?: string | null
          financeiro_processado?: boolean | null
          fornecedor_id?: string
          id?: string
          ingrediente_id?: string | null
          local_estoque_id?: string | null
          material_id?: string | null
          nota_fiscal?: string | null
          numero_lote_fabricante?: string
          observacoes?: string | null
          peso_unitario_embalagem?: number | null
          qtd_embalagens?: number | null
          quantidade_atual_g_ml?: number
          quantidade_inicial_g_ml?: number
          registro_sif?: string | null
          status?: Database["public"]["Enums"]["status_lote_estoque"] | null
          temperatura_recebimento?: number | null
          unidade_id?: string
          unidade_peso_embalagem?: string | null
          valor_total?: number | null
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
            foreignKeyName: "estoque_lotes_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_lotes_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "gerencial_compras_kraljic_base"
            referencedColumns: ["ingrediente_id"]
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
            referencedRelation: "estoque_locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_lotes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
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
      producao_lotes_internos: {
        Row: {
          codigo_lote_interno: string
          created_at: string | null
          data_fabricacao: string
          data_validade: string
          id: string
          ordem_producao_id: string
          unidade_id: string
        }
        Insert: {
          codigo_lote_interno: string
          created_at?: string | null
          data_fabricacao?: string
          data_validade: string
          id?: string
          ordem_producao_id: string
          unidade_id: string
        }
        Update: {
          codigo_lote_interno?: string
          created_at?: string | null
          data_fabricacao?: string
          data_validade?: string
          id?: string
          ordem_producao_id?: string
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "producao_lotes_internos_ordem_producao_id_fkey"
            columns: ["ordem_producao_id"]
            isOneToOne: true
            referencedRelation: "producao_ordens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_lotes_internos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais: {
        Row: {
          apropriado_alimentos: boolean | null
          ativo: boolean | null
          capacidade: string | null
          cliente_id: string
          cor: string | null
          created_at: string | null
          custo_medio: number | null
          descricao_tecnica: string | null
          dimensoes: string | null
          especificacoes_adicionais: Json | null
          ficha_tecnica: Json | null
          grupo_id: string | null
          id: string
          marca: string | null
          material_base: string | null
          nome: string
          peso_unitario_g: number | null
          preco_ultima_compra: number | null
          sustentavel: boolean | null
          tipo_material: string
          unidade_medida: string
          updated_at: string | null
        }
        Insert: {
          apropriado_alimentos?: boolean | null
          ativo?: boolean | null
          capacidade?: string | null
          cliente_id: string
          cor?: string | null
          created_at?: string | null
          custo_medio?: number | null
          descricao_tecnica?: string | null
          dimensoes?: string | null
          especificacoes_adicionais?: Json | null
          ficha_tecnica?: Json | null
          grupo_id?: string | null
          id?: string
          marca?: string | null
          material_base?: string | null
          nome: string
          peso_unitario_g?: number | null
          preco_ultima_compra?: number | null
          sustentavel?: boolean | null
          tipo_material: string
          unidade_medida: string
          updated_at?: string | null
        }
        Update: {
          apropriado_alimentos?: boolean | null
          ativo?: boolean | null
          capacidade?: string | null
          cliente_id?: string
          cor?: string | null
          created_at?: string | null
          custo_medio?: number | null
          descricao_tecnica?: string | null
          dimensoes?: string | null
          especificacoes_adicionais?: Json | null
          ficha_tecnica?: Json | null
          grupo_id?: string | null
          id?: string
          marca?: string | null
          material_base?: string | null
          nome?: string
          peso_unitario_g?: number | null
          preco_ultima_compra?: number | null
          sustentavel?: boolean | null
          tipo_material?: string
          unidade_medida?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materiais_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiais_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_produto"
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
      producao_ordens_legado: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          created_by: string | null
          data_fim_producao: string | null
          data_inicio_producao: string | null
          data_validade: string
          deleted_at: string | null
          id: string
          lote_interno: string
          qtd_produzida: number
          receita_versao_id: string
          responsavel_producao_id: string | null
          status: string | null
          unidade_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fim_producao?: string | null
          data_inicio_producao?: string | null
          data_validade: string
          deleted_at?: string | null
          id?: string
          lote_interno: string
          qtd_produzida: number
          receita_versao_id: string
          responsavel_producao_id?: string | null
          status?: string | null
          unidade_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fim_producao?: string | null
          data_inicio_producao?: string | null
          data_validade?: string
          deleted_at?: string | null
          id?: string
          lote_interno?: string
          qtd_produzida?: number
          receita_versao_id?: string
          responsavel_producao_id?: string | null
          status?: string | null
          unidade_id?: string
          updated_at?: string | null
          updated_by?: string | null
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
      perfil_cardapio_slots: {
        Row: {
          categoria_uan: string
          id: string
          obrigatorio: boolean | null
          ordem_exibicao: number | null
          perfil_id: string
          quantidade_max: number
          quantidade_min: number
          rotulo_display: string | null
        }
        Insert: {
          categoria_uan: string
          id?: string
          obrigatorio?: boolean | null
          ordem_exibicao?: number | null
          perfil_id: string
          quantidade_max?: number
          quantidade_min?: number
          rotulo_display?: string | null
        }
        Update: {
          categoria_uan?: string
          id?: string
          obrigatorio?: boolean | null
          ordem_exibicao?: number | null
          perfil_id?: string
          quantidade_max?: number
          quantidade_min?: number
          rotulo_display?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfil_cardapio_slots_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis_cardapio"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis_cardapio: {
        Row: {
          ativo: boolean | null
          cliente_id: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          refeicao_grupo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cliente_id: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          refeicao_grupo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          refeicao_grupo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfis_cardapio_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
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
            foreignKeyName: "producao_consumos_estoque_lotes_fk"
            columns: ["estoque_lote_id"]
            isOneToOne: false
            referencedRelation: "estoque_lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_consumos_producao_id_fkey"
            columns: ["producao_id"]
            isOneToOne: false
            referencedRelation: "producao_ordens"
            referencedColumns: ["id"]
          },
        ]
      }
      producao_ordens: {
        Row: {
          cardapio_id: string | null
          codigo: string
          created_at: string | null
          created_by: string | null
          data_prevista: string | null
          id: string
          margem_erro_compras: number | null
          refeicao_slug: string | null
          status: string
          titulo: string | null
          unidade_id: string
          updated_at: string | null
        }
        Insert: {
          cardapio_id?: string | null
          codigo: string
          created_at?: string | null
          created_by?: string | null
          data_prevista?: string | null
          id?: string
          margem_erro_compras?: number | null
          refeicao_slug?: string | null
          status?: string
          titulo?: string | null
          unidade_id: string
          updated_at?: string | null
        }
        Update: {
          cardapio_id?: string | null
          codigo?: string
          created_at?: string | null
          created_by?: string | null
          data_prevista?: string | null
          id?: string
          margem_erro_compras?: number | null
          refeicao_slug?: string | null
          status?: string
          titulo?: string | null
          unidade_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producao_ordens_cardapio_id_fkey"
            columns: ["cardapio_id"]
            isOneToOne: false
            referencedRelation: "cardapios_uan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_ordens_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "cliente_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      producao_ordens_itens: {
        Row: {
          created_at: string | null
          ficha_uan_id: string | null
          id: string
          ordem_id: string
          quantidade_planejada: number
          quantidade_produzida: number | null
          receita_id: string | null
          setor_producao_id: string | null
        }
        Insert: {
          created_at?: string | null
          ficha_uan_id?: string | null
          id?: string
          ordem_id: string
          quantidade_planejada: number
          quantidade_produzida?: number | null
          receita_id?: string | null
          setor_producao_id?: string | null
        }
        Update: {
          created_at?: string | null
          ficha_uan_id?: string | null
          id?: string
          ordem_id?: string
          quantidade_planejada?: number
          quantidade_produzida?: number | null
          receita_id?: string | null
          setor_producao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producao_ordens_itens_ficha_uan_id_fkey"
            columns: ["ficha_uan_id"]
            isOneToOne: false
            referencedRelation: "fichas_tecnicas_uan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_ordens_itens_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "producao_ordens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_ordens_itens_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_ordens_itens_setor_producao_id_fkey"
            columns: ["setor_producao_id"]
            isOneToOne: false
            referencedRelation: "setores_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      producao_perdas: {
        Row: {
          created_at: string | null
          custo_estimado: number | null
          descricao_detalhada: string | null
          destino_id: string | null
          estoque_lote_id: string | null
          id: string
          ingrediente_id: string | null
          item_ordem_id: string | null
          motivo_perda: string
          ordem_producao_id: string | null
          quantidade_perdida: number
          responsavel_registro_id: string | null
          tipo_destino: string | null
          tipo_perda: string | null
          unidade_id: string
        }
        Insert: {
          created_at?: string | null
          custo_estimado?: number | null
          descricao_detalhada?: string | null
          destino_id?: string | null
          estoque_lote_id?: string | null
          id?: string
          ingrediente_id?: string | null
          item_ordem_id?: string | null
          motivo_perda: string
          ordem_producao_id?: string | null
          quantidade_perdida: number
          responsavel_registro_id?: string | null
          tipo_destino?: string | null
          tipo_perda?: string | null
          unidade_id: string
        }
        Update: {
          created_at?: string | null
          custo_estimado?: number | null
          descricao_detalhada?: string | null
          destino_id?: string | null
          estoque_lote_id?: string | null
          id?: string
          ingrediente_id?: string | null
          item_ordem_id?: string | null
          motivo_perda?: string
          ordem_producao_id?: string | null
          quantidade_perdida?: number
          responsavel_registro_id?: string | null
          tipo_destino?: string | null
          tipo_perda?: string | null
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
            foreignKeyName: "producao_perdas_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "gerencial_compras_kraljic_base"
            referencedColumns: ["ingrediente_id"]
          },
          {
            foreignKeyName: "producao_perdas_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_perdas_item_ordem_id_fkey"
            columns: ["item_ordem_id"]
            isOneToOne: false
            referencedRelation: "producao_ordens_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_perdas_estoque_lotes_fk"
            columns: ["estoque_lote_id"]
            isOneToOne: false
            referencedRelation: "estoque_lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_perdas_ordem_producao_id_fkey"
            columns: ["ordem_producao_id"]
            isOneToOne: false
            referencedRelation: "producao_ordens"
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
      producao_requisicoes: {
        Row: {
          comprado_em: string | null
          created_at: string | null
          id: string
          ingrediente_id: string | null
          ordem_id: string
          qtd_necessaria_g: number
          qtd_separada_g: number | null
          status: string
          status_compras: string | null
          subgrupo_id: string | null
        }
        Insert: {
          comprado_em?: string | null
          created_at?: string | null
          id?: string
          ingrediente_id?: string | null
          ordem_id: string
          qtd_necessaria_g: number
          qtd_separada_g?: number | null
          status?: string
          status_compras?: string | null
          subgrupo_id?: string | null
        }
        Update: {
          comprado_em?: string | null
          created_at?: string | null
          id?: string
          ingrediente_id?: string | null
          ordem_id?: string
          qtd_necessaria_g?: number
          qtd_separada_g?: number | null
          status?: string
          status_compras?: string | null
          subgrupo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producao_requisicoes_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "gerencial_compras_kraljic_base"
            referencedColumns: ["ingrediente_id"]
          },
          {
            foreignKeyName: "producao_requisicoes_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_requisicoes_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "producao_ordens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_requisicoes_subgrupo_id_fkey"
            columns: ["subgrupo_id"]
            isOneToOne: false
            referencedRelation: "subgrupos_produto"
            referencedColumns: ["id"]
          },
        ]
      }
      producao_reservas_estoque: {
        Row: {
          created_at: string | null
          data_reserva: string | null
          estoque_lote_id: string
          id: string
          quantidade_reservada_g: number
          requisicao_id: string
          reservado_por: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          data_reserva?: string | null
          estoque_lote_id: string
          id?: string
          quantidade_reservada_g: number
          requisicao_id: string
          reservado_por?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          data_reserva?: string | null
          estoque_lote_id?: string
          id?: string
          quantidade_reservada_g?: number
          requisicao_id?: string
          reservado_por?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "producao_reservas_estoque_estoque_lotes_fkey"
            columns: ["estoque_lote_id"]
            isOneToOne: false
            referencedRelation: "estoque_lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_reservas_estoque_requisicao_id_fkey"
            columns: ["requisicao_id"]
            isOneToOne: false
            referencedRelation: "producao_requisicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_bombeiros: {
        Row: {
          created_at: string
          created_by: string | null
          data_emissao: string
          data_validade: string
          deleted_at: string | null
          descricao: string | null
          id: string
          nome: string
          status_sivisa: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_emissao: string
          data_validade: string
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          status_sivisa?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_emissao?: string
          data_validade?: string
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          status_sivisa?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_id: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          registro_profissional: string | null
          role: string
        }
        Insert: {
          company_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          registro_profissional?: string | null
          role: string
        }
        Update: {
          company_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          registro_profissional?: string | null
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
          conteudo_liquido: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          denominacao_venda: string | null
          estado_alimento: string | null
          fabricado_em: string | null
          foto_url: string | null
          grupo_populacional_id: string | null
          id: string
          instrucoes_preparo: string | null
          is_isento_nutricional: boolean | null
          is_menu_item: boolean | null
          is_preparo: boolean | null
          is_sub_receita: boolean | null
          medida_caseira_nome: string | null
          medida_caseira_peso_g: number | null
          modo_conservacao: string | null
          modo_preparo: string | null
          nome: string
          peso_embalagem_g: number
          porcao_final_g_ml: number | null
          rendimento_preparado_g: number | null
          rendimento_total_g: number
          risco_contaminacao_cruzada_ids: number[] | null
          status: string | null
          tipo_isencao: string | null
          tipo_receita_id: string | null
          updated_at: string | null
          updated_by: string | null
          versao_atual: number | null
        }
        Insert: {
          anvisa_categoria_id?: number | null
          area_painel_principal_cm2?: number | null
          cliente_id: string
          conteudo_liquido?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          denominacao_venda?: string | null
          estado_alimento?: string | null
          fabricado_em?: string | null
          foto_url?: string | null
          grupo_populacional_id?: string | null
          id?: string
          instrucoes_preparo?: string | null
          is_isento_nutricional?: boolean | null
          is_menu_item?: boolean | null
          is_preparo?: boolean | null
          is_sub_receita?: boolean | null
          medida_caseira_nome?: string | null
          medida_caseira_peso_g?: number | null
          modo_conservacao?: string | null
          modo_preparo?: string | null
          nome: string
          peso_embalagem_g?: number
          porcao_final_g_ml?: number | null
          rendimento_preparado_g?: number | null
          rendimento_total_g?: number
          risco_contaminacao_cruzada_ids?: number[] | null
          status?: string | null
          tipo_isencao?: string | null
          tipo_receita_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          versao_atual?: number | null
        }
        Update: {
          anvisa_categoria_id?: number | null
          area_painel_principal_cm2?: number | null
          cliente_id?: string
          conteudo_liquido?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          denominacao_venda?: string | null
          estado_alimento?: string | null
          fabricado_em?: string | null
          foto_url?: string | null
          grupo_populacional_id?: string | null
          id?: string
          instrucoes_preparo?: string | null
          is_isento_nutricional?: boolean | null
          is_menu_item?: boolean | null
          is_preparo?: boolean | null
          is_sub_receita?: boolean | null
          medida_caseira_nome?: string | null
          medida_caseira_peso_g?: number | null
          modo_conservacao?: string | null
          modo_preparo?: string | null
          nome?: string
          peso_embalagem_g?: number
          porcao_final_g_ml?: number | null
          rendimento_preparado_g?: number | null
          rendimento_total_g?: number
          risco_contaminacao_cruzada_ids?: number[] | null
          status?: string | null
          tipo_isencao?: string | null
          tipo_receita_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
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
          modo_conservacao_snapshot: string | null
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
          modo_conservacao_snapshot?: string | null
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
          modo_conservacao_snapshot?: string | null
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
      referencias_nutricionais: {
        Row: {
          calcio_mg: number | null
          carboidrato_disponivel_g: number | null
          carboidrato_g: number | null
          categoria: string | null
          codigo_externo: string | null
          colesterol_mg: number | null
          created_at: string | null
          energia_kcal: number | null
          ferro_mg: number | null
          fibra_alimentar_g: number | null
          fonte: string
          gordura_monoinsaturada_g: number | null
          gordura_poliinsaturada_g: number | null
          gordura_saturada_g: number | null
          id: string
          lipideos_g: number | null
          magnesio_mg: number | null
          nome: string
          potassio_mg: number | null
          proteina_g: number | null
          sodio_mg: number | null
          vitamina_c_mg: number | null
          zinco_mg: number | null
        }
        Insert: {
          calcio_mg?: number | null
          carboidrato_disponivel_g?: number | null
          carboidrato_g?: number | null
          categoria?: string | null
          codigo_externo?: string | null
          colesterol_mg?: number | null
          created_at?: string | null
          energia_kcal?: number | null
          ferro_mg?: number | null
          fibra_alimentar_g?: number | null
          fonte: string
          gordura_monoinsaturada_g?: number | null
          gordura_poliinsaturada_g?: number | null
          gordura_saturada_g?: number | null
          id?: string
          lipideos_g?: number | null
          magnesio_mg?: number | null
          nome: string
          potassio_mg?: number | null
          proteina_g?: number | null
          sodio_mg?: number | null
          vitamina_c_mg?: number | null
          zinco_mg?: number | null
        }
        Update: {
          calcio_mg?: number | null
          carboidrato_disponivel_g?: number | null
          carboidrato_g?: number | null
          categoria?: string | null
          codigo_externo?: string | null
          colesterol_mg?: number | null
          created_at?: string | null
          energia_kcal?: number | null
          ferro_mg?: number | null
          fibra_alimentar_g?: number | null
          fonte?: string
          gordura_monoinsaturada_g?: number | null
          gordura_poliinsaturada_g?: number | null
          gordura_saturada_g?: number | null
          id?: string
          lipideos_g?: number | null
          magnesio_mg?: number | null
          nome?: string
          potassio_mg?: number | null
          proteina_g?: number | null
          sodio_mg?: number | null
          vitamina_c_mg?: number | null
          zinco_mg?: number | null
        }
        Relationships: []
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
      subgrupos_produto: {
        Row: {
          cliente_id: string
          created_at: string
          grupo_id: string | null
          id: string
          nome: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          grupo_id?: string | null
          id?: string
          nome: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          grupo_id?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "subgrupos_produto_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subgrupos_produto_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_produto"
            referencedColumns: ["id"]
          },
        ]
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
      uan_cardapio_insumos_config: {
        Row: {
          cardapio_id: string | null
          created_at: string | null
          id: string
          ingrediente_id: string | null
          margem_erro: number | null
          updated_at: string | null
        }
        Insert: {
          cardapio_id?: string | null
          created_at?: string | null
          id?: string
          ingrediente_id?: string | null
          margem_erro?: number | null
          updated_at?: string | null
        }
        Update: {
          cardapio_id?: string | null
          created_at?: string | null
          id?: string
          ingrediente_id?: string | null
          margem_erro?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uan_cardapio_insumos_config_cardapio_id_fkey"
            columns: ["cardapio_id"]
            isOneToOne: false
            referencedRelation: "cardapios_uan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uan_cardapio_insumos_config_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "gerencial_compras_kraljic_base"
            referencedColumns: ["ingrediente_id"]
          },
          {
            foreignKeyName: "uan_cardapio_insumos_config_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
        ]
      }
      uan_compras_monitoramento: {
        Row: {
          cardapio_id: string
          created_at: string | null
          id: string
          ingrediente_id: string
          quantidade_comprada: number
          status_compras: string | null
          updated_at: string | null
        }
        Insert: {
          cardapio_id: string
          created_at?: string | null
          id?: string
          ingrediente_id: string
          quantidade_comprada: number
          status_compras?: string | null
          updated_at?: string | null
        }
        Update: {
          cardapio_id?: string
          created_at?: string | null
          id?: string
          ingrediente_id?: string
          quantidade_comprada?: number
          status_compras?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uan_compras_monitoramento_cardapio_id_fkey"
            columns: ["cardapio_id"]
            isOneToOne: false
            referencedRelation: "cardapios_uan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uan_compras_monitoramento_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "gerencial_compras_kraljic_base"
            referencedColumns: ["ingrediente_id"]
          },
          {
            foreignKeyName: "uan_compras_monitoramento_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      gerencial_compras_kraljic_base: {
        Row: {
          categoria_produto_id: string | null
          custo_referencia: number | null
          demanda_programada_kg: number | null
          estoque_atual: number | null
          estoque_seguranca_perc: number | null
          fornecedores_ativos: number | null
          ingrediente_id: string | null
          ingrediente_nome: string | null
          lead_time_considerado: number | null
          uso_medio_diario: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredientes_grupo_id_fkey"
            columns: ["categoria_produto_id"]
            isOneToOne: false
            referencedRelation: "grupos_produto"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_audit_columns: { Args: { tbl: string }; Returns: undefined }
      fn_get_meus_clientes: { Args: never; Returns: string[] }
      fn_get_minhas_unidades: { Args: never; Returns: string[] }
      gerar_requisicao_producao: {
        Args: { p_ordem_id: string }
        Returns: undefined
      }
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
      fin_alocacao_custo: "DIRETO" | "INDIRETO" | "NAO_APLICAVEL"
      fin_comportamento_custo: "FIXO" | "VARIAVEL" | "MISTO" | "NAO_APLICAVEL"
      fin_modulo_origem:
        | "PDV"
        | "ESTOQUE"
        | "PRODUCAO"
        | "DESPERDICIO"
        | "MANUAL"
        | "API_DELIVERY"
      fin_subtipo_usar:
        | "VENDAS_ALIMENTOS"
        | "VENDAS_BEBIDAS"
        | "GORJETAS"
        | "IMPOSTOS_VENDAS"
        | "CMV_ALIMENTOS"
        | "CMV_BEBIDAS"
        | "CUSTO_MAO_DE_OBRA"
        | "CUSTO_DESPERDICIO"
        | "CUSTOS_CONTROLAVEIS"
        | "CUSTO_OCUPACAO"
        | "OUTRAS_DESPESAS"
        | "NAO_APLICAVEL"
      fin_tipo_conta:
        | "ATIVO"
        | "PASSIVO"
        | "RECEITA"
        | "DESPESA"
        | "PATRIMONIO_LIQUIDO"
      fin_tipo_lancamento: "DEBITO" | "CREDITO"
      modalidade_produto_enum:
        | "ALIMENTOS"
        | "EMBALAGENS"
        | "EPI_EPC"
        | "LIMPEZA"
        | "MANUTENCAO"
        | "UTENSILIOS"
        | "UNIFORMES"
        | "PRIMEIROS_SOCORROS"
        | "OUTROS"
      status_homologacao: "PENDENTE" | "APROVADO" | "REJEITADO" | "SUSPENSO"
      status_lote_estoque:
        | "QUARENTENA"
        | "APROVADO"
        | "REJEITADO"
        | "VENCIDO"
        | "PREVISTO"
      status_ordem_producao:
        | "PENDENTE"
        | "EM_PREPARO"
        | "FINALIZADA"
        | "CANCELADA"
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
  public: {
    Enums: {
      criticidade_insumo: ["BAIXA", "MEDIA", "ALTA"],
      fin_alocacao_custo: ["DIRETO", "INDIRETO", "NAO_APLICAVEL"],
      fin_comportamento_custo: ["FIXO", "VARIAVEL", "MISTO", "NAO_APLICAVEL"],
      fin_modulo_origem: [
        "PDV",
        "ESTOQUE",
        "PRODUCAO",
        "DESPERDICIO",
        "MANUAL",
        "API_DELIVERY",
      ],
      fin_subtipo_usar: [
        "VENDAS_ALIMENTOS",
        "VENDAS_BEBIDAS",
        "GORJETAS",
        "IMPOSTOS_VENDAS",
        "CMV_ALIMENTOS",
        "CMV_BEBIDAS",
        "CUSTO_MAO_DE_OBRA",
        "CUSTO_DESPERDICIO",
        "CUSTOS_CONTROLAVEIS",
        "CUSTO_OCUPACAO",
        "OUTRAS_DESPESAS",
        "NAO_APLICAVEL",
      ],
      fin_tipo_conta: [
        "ATIVO",
        "PASSIVO",
        "RECEITA",
        "DESPESA",
        "PATRIMONIO_LIQUIDO",
      ],
      fin_tipo_lancamento: ["DEBITO", "CREDITO"],
      modalidade_produto_enum: [
        "ALIMENTOS",
        "EMBALAGENS",
        "EPI_EPC",
        "LIMPEZA",
        "MANUTENCAO",
        "UTENSILIOS",
        "UNIFORMES",
        "PRIMEIROS_SOCORROS",
        "OUTROS",
      ],
      status_homologacao: ["PENDENTE", "APROVADO", "REJEITADO", "SUSPENSO"],
      status_lote_estoque: [
        "QUARENTENA",
        "APROVADO",
        "REJEITADO",
        "VENCIDO",
        "PREVISTO",
      ],
      status_ordem_producao: [
        "PENDENTE",
        "EM_PREPARO",
        "FINALIZADA",
        "CANCELADA",
      ],
      status_receita: ["RASCUNHO", "EM_ANALISE", "APROVADO", "OBSOLETO"],
    },
  },
} as const

