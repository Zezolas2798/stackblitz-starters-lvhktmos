> [!NOTE] Ancestry
> ⬆️ **Parent**: [[hub-mestre|Hub de Legislação]]

---

﻿---
id: legislacao.vdr_tabelas
titulo: "VDR por Grupo Populacional (IN 75/2020)"
tipo: legislacao
orgao: ANVISA
data_publicacao: 2020-10-08
status: vigente
tags:
  - norma/anvisa
  - tema/vdr
  - tema/grupo-populacional
  - referencia/tabela
edges:
  - referenciada_por: "[[legislacao/hub-mestre]]"
  - referenciada_por: "[[legislacao/RDC_429_2020_IN_75_2020]]"
---

← [[legislacao/hub-mestre|Voltar ao Hub de Conformidade]]
# Tabela de Referência: VDR por Grupo Populacional (IN 75/2020)

Esta tabela consolida os Valores Diários de Referência (VDR) utilizados pela Edge Function `calcular-nutrientes` para determinar o %VD no rótulo.

## 1. Valores Diários para Adultos (Geral)
*Referência: Anexo II da IN 75/2020*

| Constituinte | VDR | Unidade |
| :--- | :--- | :--- |
| Valor energético | 2000 | kcal |
| Carboidratos | 300 | g |
| Açúcares totais | - | g |
| Açúcares adicionados | 50 | g |
| Proteínas | 50 | g |
| Gorduras totais | 65 | g |
| Gorduras saturadas | 20 | g |
| Gorduras trans | 2 | g |
| Fibras alimentares | 25 | g |
| Sódio | 2000 | mg |

## 2. Grupos Populacionais Específicos
*Referência: Anexo VIII da IN 75/2020*

O sistema deve aplicar os denominadores abaixo conforme o `grupo_populacional_id` selecionado:

| Nutriente | Unidade | 1 a 3 anos | 4 a 8 anos | 9 a 18 anos | Gestantes | Lactantes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Energia** | kcal | 1000 | 1500 | 2500 | 2300 | 2600 |
| **Proteínas** | g | 25 | 35 | 60 | 55 | 65 |
| **Gorduras Totais** | g | 33 | 50 | 80 | 75 | 85 |
| **Fibras** | g | 19 | 25 | 38 | 28 | 29 |
| **Sódio** | mg | 1000 | 2000 | 2000 | 2000 | 2000 |
| **Cálcio** | mg | 700 | 1000 | 1300 | 1300 | 1300 |
| **Ferro** | mg | 7 | 10 | 15 | 27 | 10 |

## 3. Regras de Cálculo e Arredondamento (Anexo III)

Ao calcular o `%VD` para a tabela, o sistema deve seguir:
1.  **Arredondamento:** 
    - Valores $\ge 10$: Declarar em números inteiros.
    - Valores $< 10$ e $\ge 1$: Uma casa decimal (se a decimal for 0, declarar inteiro).
2.  **Expressão de %VD:** Sempre em números inteiros.
3.  **Gatilho de Isenção:** Se a quantidade for "não significativa" (Anexo IV), declarar "0" ou conforme permissão de cada nutriente.
