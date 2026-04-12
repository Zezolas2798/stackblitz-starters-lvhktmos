# Legislação ANVISA: Rotulagem Nutricional Frontal e Tabela (RDC 429 & IN 75)

Este documento é a Referência Canônica de qualidade legal para a infraestrutura de algoritmos do sistema, no que tange a **Rotulagem Nutricional Frontal (FOP - Front of Package)**, Declaração de Ingredientes, e padronização visual das informações ao consumidor.

O Sistema consome esses normativos primariamente através dos fluxos de geração de **Fichas Técnicas (Indústria)** e na conversão da Master Data de **Ingredientes**.

---

## 1. Bases Legais Consolidadas (Referência: `_knowledge/rotulagem/`)

O sistema foi arquitetado para cumprir automaticamente com os ditames de:

*   **RDC Nº 429, de 8 de Outubro de 2020:** Dispõe sobre a rotulagem nutricional dos alimentos embalados. Exige a legibilidade, visibilidade e declaração padronizada de constituintes (Açúcares Totais, Açúcares Adicionados).
*   **Instrução Normativa - IN Nº 75:** Estabelece os limites e formatos da Rotulagem Nutricional Frontal, listando perfis nutricionais rigorosos, Grupos Populacionais de Referência (ex: Geral, Lactentes) e cálculo de %VD (Valor Diário).
*   **RDC Nº 727, de 1º de Julho de 2022:** Regras sobre rotulagem geral, obrigando a declaração de "Modo de Conservação", alergênicos cruzados e lote.

---

## 2. Lógica Algorítmica da "Lupa Frontal" (Front-of-Package)

Conforme a **IN 75**, alimentos com altas concentrações químicas estão sujeitos à estampa de uma "Lupa" (ícone de advertência preto) em seus rótulos principais. 

A inteligência matemática da nossa Edge Function (`calcular-nutrientes`) reage sob as seguintes diretrizes para disparar a Lupa Nutricional, caso o **Estado Físico** (Sólido/Líquido) da Receita seja atingido nos cortes de 100g ou 100ml:

### Gatilhos (Limites ANVISA)
| Constante Nutricional | Limite para Sólidos (≥ em 100g) | Limite para Líquidos (≥ em 100ml) | Exceções Globais |
| :--- | :--- | :--- | :--- |
| **Açúcares Adicionados** | `15g` | `7,5g` | Suplementos ou Categoria X. |
| **Gorduras Saturadas** | `6g` | `3g` | |
| **Sódio** | `600mg` | `300mg` | |

**Regra Sistêmica de Conflito:** A lupa reage estritamente à matriz unificada de 100g/ml no final da ficha técnica, *independente do tamanho da porção servida*. O fato da `Porção` ser 30g não isenta o produto de carregar a Lupa se no comparativo a 100g ele romper a tabela.

---

## 3. Grupo Populacional e % Valores Diários (VD)

Para a tabela tradicional inferior (Informação Nutricional), aplicamos o Anexo I da **IN 75**.
Toda Base de Ficha Técnica possui a *Property* `grupo_populacional_id` vinculada a tabela `anvisa_grupos_populacionais`.

**Intersecção Tecnológica:**
Quando a UI renderiza `<RotulagemTab />` e `<GraficosNutricionaisTab />`, a API cruza o `rendimento_total_g` vs `porcao_final_g_ml` obtendo a densidade de serviço real, para então calcular a equivalência da caloria servida num espectro diário de **2000 kcal** ou **8400 kJ** (no caso do público `GERAL / Adulto`).

---

## 4. Declaração de Alergênicos e Risco Cruzado (RDC 727)

*   **Alergênicos Endógenos:** Extração automática em cadeia (`SELECT alergenicos_ids FROM ingrediente_alergenicos`). Compõem a cláusula obrigatória *"ALÉRGICOS: CONTÉM DERIVADOS DE [NOME]"*.
*   **Riscos Ocupacionais:** A inserção manual do Risco de Contaminação (Aba Riscos na Ficha) exige a clausula exata *"ALÉRGICOS: PODE CONTER [NOME]"*.
*   **Filtro de Duplicidade:** O *array mapper* recusa renderizar um elemento na linha "Pode Conter" se o mesmo ID estiver detectado na linha química "Contém", obedecendo o princípio de coesão da defesa civil.
