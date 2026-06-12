---
id: modulo.equipamentos
titulo: "Equipamentos e Máquinas"
tipo: domain
modulo: configuracoes_globais
status: active
ultima_revisao: 2026-04-19
tags:
  - feature/equipamentos
  - dominio/configuracoes
  - entidade/equipamentos
  - HACCP/termometria
edges:
  - atua_sobre: "[[features/estoque/domain]]"
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-equipamentos]]

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-equipamentos]]

---



# Equipamentos (Infraestrutura e Termometria)

O módulo de Equipamentos (`equipamentos_config`) é o espinhaço de infraestrutura da cozinha industrial, mas difere profundamente de Estoques. A tabela mapeia todo e qualquer maquinário produtivo ou conservador, mas sua principal função analítica é viabilizar o **Controle de Qualidade (HACCP/AppCC)**.

## 1. Topologia da Entidade (Dicionário de Dados)

A tabela central é desenhada para acomodar flexibilidade máxima (abrigando tanto um Liquidificador Industrial que requer apenas apontamento de falha, quanto uma Câmara Fria com rastreio tridiário de graus celsius).

| Campo | Tipo | Null | Descrição Analítica |
|-------|------|------|---------------------|
| `id` | UUID | Não | Chave primária. |
| `cliente_id` | UUID | Não | Isolamento B2B (Tenant). |
| `unidade_id` | UUID | Não | **Isolamento de Unidade (RLS Hardened 2026-04-19).** |
| `grupo` | String | Não | **Chave Categórica de Roteamento.** (Ex: `Temperaturas`, `Motores`, `Utensilios_Pesados`). |
| `nome` | String | Não | Nome do equipamento ou pasta organizadora. |
| `parent_id` | UUID | Sim | Hierarquia Self-Referencing (Para sub-dividir categorias). |
| `frequencia_diaria` | Inteiro | Sim | Quantas aferições do APPCC são obrigatórias por dia. |
| `horarios_afericao` | String[] | Sim | Array de strings (ex: `['08:00', '16:00']`) apontando os timestamps ideais de verificação para notificações do sistema. |
| `temp_ideal_max` | Decimal | Sim | Teto de graus admissível (*Null se o equipamento não controlar temperatura*). |
| `temp_ideal_min` | Decimal | Sim | Piso de graus admissível (*Null se o equipamento não controlar temperatura*). |
| `ativo` | Boolean | Não | Soft delete padrão. |

## 2. Padrão de Inserção: Hierarquia Self-Referencing

A tabela `equipamentos_config` não possui uma Tabela "Irmã" de subcategorias. Ela gerencia o nível parentesco pela coluna `parent_id` nela mesma. 
Isso permite ramificações infinitas sem castigar o banco:
* **(Root) `parent_id` nulo:** Cria agrupadores. Exemplo: *Nome: Câmaras Refrigeradas*.
* **(Child) `parent_id` preenchido:** Cria a máquina final. Exemplo: *Nome: Motor 01 Laticínios*. 

## 3. Escabilidade Horizontal: Grupos Dinâmicos e o Gatilho 'Temperaturas'

Uma sacada magistral da aba de configurações (`app/config/estoque`) é que o sistema não engessa os Grupos. Permitindo a criação de quantos grupos paralelos a operação B2B exigir, como um sistema totalmente maleável:

* `"Regulagem"`: Grupos de equipamentos que precisam calibrar com uma frequência determinada.
* `"Motores"`: Controle preventivo de ventoinhas e exaustores.
* `"EPIs"`: Para organizar a manutenção de equipamentos de proteção (luvas de malha de aço, botas).
* *Qualquer outro grupo* gerado pelo cliente dinamicamente via Frontend.

**O Gatilho Oculto da Qualidade:**
Nessa imensidão de grupos que podem ser criados dinamicamente na UI, a inteligência do sistema reserva uma Regra Magna: apenas equipamentos acomodados sob o título exato de **`"Temperaturas"`** (com nível `parent_id` setado) são "sequestrados" automatica e instantaneamente pelo módulo de APPCC (`app/qualidade/controle-producao`), ativando a obrigatoriedade imutável de aferições sanitárias pelas rotinas de cozinheiros, respondendo diretamente à Normativa RDC 216. 

```sql
SELECT * FROM equipamentos_config 
WHERE grupo = 'Temperaturas' AND parent_id IS NOT NULL;
```
Qualquer equipamento mapeado livremente sob o grupo `"Temperaturas"` automaticamente fará parte da roteirização de qualidade sanitária (Normativa RDC 216), obrigando o operador a submeter logs em `controle_temperatura`.

## 4. Segurança e Isolamento (RLS)

A partir da revisão técnica de 2026-04-19, o sistema aplica um modelo **Zero Trust** no nível de banco de dados para Equipamentos e Temperaturas.

### 4.1. Políticas de Unidade
Tanto `equipamentos_config` quanto `controle_temperatura` possuem RLS (Row Level Security) habilitado. O acesso é restrito via `unidade_id`, validado contra as `app_user_memberships` do usuário autenticado.

- **Equipamentos**: Um gerente da Unidade A não pode visualizar ou editar a configuração de equipamentos da Unidade B.
- **Temperaturas**: O histórico de aferições é estritamente vinculado à unidade, garantindo integridade em auditorias sanitárias por filial.

```sql
-- Exemplo de Política Hardened
CREATE POLICY "Isolamento por Unidade" ON controle_temperatura
FOR ALL TO authenticated
USING (
  unidade_id IN (
    SELECT m.unidade_id FROM app_user_memberships m 
    WHERE m.usuario_id = auth.uid()
  )
)
WITH CHECK (
  unidade_id IN (
    SELECT m.unidade_id FROM app_user_memberships m 
    WHERE m.usuario_id = auth.uid()
  )
);
```

## 5. Diferenciação Extrema: Equipamento vs. Estoque vs. Misto

Conforme alinhado rigorosamente no design de [Locais de Estoque](estoque_locais.md), estas entidades resolvem pontas diferentes, mas podem cruzar-se para gerar um super-nó ecológico no sistema:

### Caso A: Equipamento PURO (Sem Relação de Estoque)
Exemplo: **Geladeira de Pronta-Praça (Cozinha Ágil)** e **Bancada Aquecida**.
* **Como Opera:** Está cadastrada em `equipamentos_config` sob o Grupo `"Temperaturas"`. Todo dia, às 08h, 12h e 16h, os cozinheiros emitem registro confirmando que a Geladeira da Praça está operando a 4ºC. 
* **Por que NÃO é Estoque:** Não dá para inserir 300Kg de mercadoria NFe no rodapé da geladeira e manter rastreio. Seu giro é frenético. Ela possui temperatura, mas não se atrela nativamente a lotes longos em banco.

### Caso B: Estoque PURO (Sem Relação de Equipamento)
Exemplo: **Despensa Seca**, **Almoxarifado**.
* **Como Opera:** Cadastrado estritamente em `estoque_locais` com `equipamento_config_id = null`. 
* **Por que NÃO é Equipamento:** Não tem motor, não quebra, e não apodrece o material se a luz acabar. Recebem caixas secas (arroz, feijão, EPIs) e focam só na valoração de inventário. 

### Caso C: Interseção Plena (MISTO)
Exemplo: **Câmara Fria Primária (Carnes)**.
* **Como Opera:** Aqui a sinergia acontece. O software detém um registro vivo na `estoque_locais` para alojar 2 toneladas de Carne, e este Local aponta (`equipamento_config_id = X`) para a Tabela de Equipamentos configurada com termostato de -18ºC.
* **Inteligência GxP Autônoma:** Se a rotina de Qualidade detectar na prancheta que a temperatura deste Motor subiu para -5ºC (Falha / Não Conforme), o Local Físico de estoque inteiro anexado a ele sofre sanção de Perda iminente, obrigando uma OS (Ordem de Serviço) ou a Transferência de Lotes por segurança sanitária.

