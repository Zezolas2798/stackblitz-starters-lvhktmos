---
id: legislacao.portaria_inmetro249
titulo: "Portaria INMETRO 249/2021 - Metrologia"
tipo: legislacao
orgao: INMETRO
data_publicacao: 2021-06-09
status: vigente
tags:
  - norma/inmetro
  - tema/conteudo-liquido
  - tema/metrologia
edges:
  - interpreta: "[[fontes/Portaria_INMETRO_249_Original]]"
  - referenciada_por: "[[CONFORMIDADE_ROTULAGEM_MESTRE]]"
---

← [[CONFORMIDADE_ROTULAGEM_MESTRE|Voltar ao Hub de Conformidade]]
# Especificação Técnica: Portaria INMETRO nº 249/2021

Esta portaria estabelece a forma de expressar a indicação quantitativa do conteúdo líquido (metrologia).

## 1. Dimensionamento Automático de Fontes (Layer de Design)

O motor de etiquetas deve calcular a altura mínima dos caracteres baseando-se nas tabelas abaixo.

### 1.1. Tabela para Massa ($g$) e Volume ($ml$)

| Valor do Conteúdo Líquido ($Q_n$) | Altura Mínima (mm) |
| :--- | :--- |
| $\le 50$ | 2,0 |
| $50 < Q_n \le 200$ | 3,0 |
| $200 < Q_n \le 1000$ | 4,0 |
| $> 1000$ | 6,0 |

### 1.2. Tabela por Área do Painel (Unidades/Comprimento)

| Área do Painel Principal ($cm^2$) | Altura Mínima (mm) |
| :--- | :--- |
| $< 40$ | 2,0 |
| $40 \le A < 170$ | 3,0 |
| $170 \le A < 650$ | 4,5 |
| $650 \le A < 2600$ | 6,0 |
| $\ge 2600$ | 10,0 |

> [!IMPORTANT]
> Se a indicação quantitativa for posicionada fora da "Vista Principal", a altura dos caracteres deve ser **no mínimo o dobro (2x)** do especificado nas tabelas acima.

## 2. Regras de Unidades e Símbolos

### 2.1. Formatação de Símbolos
-   Os símbolos das unidades (`g`, `kg`, `ml`, `L`, `m`) devem ter altura mínima de **2/3 da altura** dos algarismos.
-   O sistema deve impedir o uso de símbolos incorretos (Ex: `grs`, `GR`, `Kgs`, `ML`).

### 2.2. Unidades Dinâmicas
-   O sistema deve sugerir a unidade mais adequada para evitar excesso de zeros:
    -   Abaixo de 1000g: usar `g`.
    -   Igual ou acima de 1000g: usar `kg`.

## 3. Produtos em Duas Fases (Peso Drenado)

Para produtos que possuem fase sólida e líquida (ex: conservas, azeitonas, palmito):
-   **Obrigatoriedade:** Exibir tanto o "PESO LÍQUIDO" quanto o "PESO DRENADO".
-   **Destaque:** Ambas as indicações devem ter **mesma dimensão e destaque**.

## 4. Requisitos de Visualização

-   **Contraste:** A cor da indicação deve contrastar fortemente com o fundo.
-   **Embalagens Transparentes:** O contraste deve ser garantido em relação à **cor do produto** contido.
-   **Expressões Permitidas:** Usar preferencialmente "PESO LÍQUIDO" (para massa) e "CONTEÚDO" ou "VOLUME LÍQUIDO" (para volumes).
