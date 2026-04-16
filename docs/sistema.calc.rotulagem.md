---
id: sistema.calc.rotulagem
titulo: "Especificação Técnica: Cálculo de Rotulagem"
tipo: calculation
node_type: spec
layer: domain
nature: technical
status: consolidated
veracidade: high
convicção: high
tags:
  - anvisa/rotulagem
  - sistema/calculo
  - compliance
---

# Manual Técnico de Rotulagem e Compliance ANVISA (Detalhamento Completo)

Este documento detalha o funcionamento técnico do "Cérebro de Rotulagem" do sistema, centrando-se na Edge Function `calcular-nutrientes` e sua integração com as normas vigentes.

> [!NOTE]
> Este manual complementa o [[sistema.map.relatorios|Mapeamento de Relatórios]], focando na camada lógica e regulatória.


---

## 1. Arquitetura do Processamento (Cálculo Recursivo)

O cálculo nutricional resolve árvores de receitas complexas. Se uma "Massa de Pizza" contém "Molho de Tomate" (sub-receita), o sistema:
1.  Calcula o Molho proporcionalmente ao peso na Pizza.
2.  Soma os nutrientes do Molho aos ingredientes secos da Pizza.
3.  Propaga os alérgenos do Molho para a Pizza final.

---

## 2. Estrutura de Banco de Dados (DDL)

### 2.1. Tabelas de Suporte ANVISA

```sql
-- Dicionário de Alérgenos
CREATE TABLE public.anvisa_alergenicos (
    id SERIAL PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL -- Ex: 'LEITE', 'SOJA'
);

-- Regras de Arredondamento (IN 75)
CREATE TABLE public.anvisa_regras_tabela (
    constituinte TEXT PRIMARY KEY,
    unidade TEXT NOT NULL,
    limite_nao_significativo NUMERIC,
    regra_arr_menor_1 NUMERIC, -- Casas decimais p/ valores < 1
    regra_arr_menor_10 NUMERIC, -- Casas decimais p/ 1 a 10
    regra_arr_maior_10 NUMERIC  -- Casas decimais p/ > 10
);

-- VDR (Valores Diários de Referência)
CREATE TABLE public.anvisa_vdr (
    id TEXT PRIMARY KEY,
    valor NUMERIC NOT NULL,
    unidade TEXT NOT NULL
);
```

### 2.2. Vínculo de Alérgenos por Ingrediente

```sql
CREATE TABLE public.ingrediente_alergenicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingrediente_id UUID REFERENCES public.ingredientes(id),
    anvisa_alergenico_id INTEGER REFERENCES public.anvisa_alergenicos(id),
    nivel_contato VARCHAR CHECK (nivel_contato IN ('DIRETO', 'TRACOS_CRUZADOS')),
    is_derivado BOOLEAN DEFAULT false -- RDC 727: Se true, gera "DERIVADOS DE [NOME]"
);
```

---

## 3. Lógica Especial de Compliance (Regras de Ouro)

### 3.1. Harmonização de Porção (Art. 10 §2º RDC 429)
O sistema ajusta a porção declarada automaticamente para evitar números quebrados de unidades:
- Se a medida caseira (ex: 1 pão) pesa 45g e a porção de referência é 50g.
- Como 45g está dentro da tolerância de **70% a 130%** de 50g, o sistema ajusta a porção oficial para 45g.
- Isso permite declarar "Porção de 45g (1 unidade)" em vez de "50g (1,1 unidades)".

### 3.2. Transgênicos (Decreto 4.680/2003)
Se um ingrediente é marcado como `is_transgenico`:
- O sistema anexa automaticamente o símbolo `(transgênico*)` ao nome do ingrediente na lista.
- Se houver `especie_doadora`, ela é listada entre parênteses (ex: "Milho transgênico* (doador: Bacillus thuringiensis)").

### 3.3. Aditivos Alimentares (RDC 727)
- Aditivos são agrupados por função tecnológica.
- **Regra**: A função deve estar em CAIXA ALTA (ex: "CONSERVANTE: Sorbato de potássio (INS 202)").
- **Exceção Tartrazina**: O nome "Tartrazina" deve ser explicitado, não apenas o INS.

---

## 4. Checklist de Auditoria Manual

| Etapa | O que validar | Referência |
| :--- | :--- | :--- |
| **Alergênicos** | Estão em negrito e caixa alta? "Derivados" aparecem antes dos nomes diretos? | RDC 727, Art. 15 |
| **Lactose** | Se o valor por 100g for > 0,1g, a frase "CONTÉM LACTOSE" deve aparecer. | RDC 727, Art. 6º |
| **Glúten** | A frase "CONTÉM GLÚTEN" está visível logo após os ingredientes? | Lei 10.674 |
| **Lupa (FOP)** | O selo de "Alto em..." aparece se os limites da tabela `anvisa_limites_lupa` forem atingidos? | RDC 429, Art. 7 |
| **Arredondamento** | Nutrientes como Sódio e Calorias seguem as casas decimais da `anvisa_regras_tabela`? | IN 75, Anexo IV |

---

## 5. Manutenibilidade do Sistema

Para atualizar o comportamento do sistema sem código:
1.  **Mudança de Legislação**: Atualize as tabelas `public.anvisa_*`.
2.  **Novos Insumos**: Garanta o preenchimento dos campos `is_transgenico` e `alergenicos_ids`.
3.  **Configuração de Medida**: Ajuste `medida_caseira_peso_g` na receita para disparar a harmonização automática.

---
*Este documento segue o padrão premium de documentação técnica do projeto NutriDev.*
