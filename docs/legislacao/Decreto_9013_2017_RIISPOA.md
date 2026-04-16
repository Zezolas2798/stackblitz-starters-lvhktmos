---
id: legislacao.decreto9013
titulo: "Decreto 9.013/2017 - RIISPOA"
tipo: legislacao
orgao: MAPA
data_publicacao: 2017-03-29
status: vigente
tags:
  - norma/mapa
  - tema/origem-animal
  - tema/riispoa
edges:
  - interpreta: "[[fontes/Decreto_9013_RIISPOA_Original]]"
  - referenciada_por: "[[CONFORMIDADE_ROTULAGEM_MESTRE]]"
---

← [[CONFORMIDADE_ROTULAGEM_MESTRE|Voltar ao Hub de Conformidade]]
# Especificação Técnica: Decreto nº 9.013/2017 (RIISPOA)

O RIISPOA regulamenta a rotulagem de produtos de origem animal (POA) sob inspeção federal (SIF), estadual ou municipal.

## 1. Selos de Inspeção (Camada de Layout)

O sistema de geração de etiquetas deve suportar a inserção dinâmica de carimbos de inspeção baseada no registro da unidade produtora.

### 1.1. Geometria dos Carimbos
-   **Federal (SIF):** Círculo com siglas "BRASIL" e "INSPECIONADO".
-   **Estadual/SISP:** Formato de escudo ou círculo com sigla do estado.
-   **Artesanal (Selo ARTE):** Diamante.

| Elemento | Regra de Engenharia |
| :--- | :--- |
| **Localização** | Painel principal, usualmente no canto inferior direito ou centralizado abaixo da denominação. |
| **Tamanho** | Proporcional à área do painel (conforme Anexo do RIISPOA). |
| **Cor** | Contraste de cor única (preto/branco) ou conforme manual de identidade visual do MAPA. |

## 2. Denominação de Venda Dinâmica

A denominação de venda para POA é regida pelos RTIQs (Regulamentos Técnicos de Identidade e Qualidade).

### Regras de Validação:
-   **Adição de Água:** Se a formulação contiver água acima do limite do RTIQ, a denominação deve incluir "Contém até X% de água adicionada".
-   **Presença de CMS:** Se utilizar Carne Mecanicamente Separada, incluir na lista de ingredientes a espécie e a porcentagem se exceder 20% (ou conforme RTIQ específico).

## 3. Disparadores de Alertas (Trava de Segurança)

O backend deve processar a lista de ingredientes e injetar frases obrigatórias:

### 3.1. Alerta para Mel
-   **Trigger:** Ingrediente "Mel" detectado.
-   **Frase:** "Este produto não deve ser consumido por crianças menores de um ano."
-   **Estilo:** Negrito, caixa alta, separado dos demais elementos.

### 3.2. Conservação do Produto
-   Frases padrão baseadas na temperatura de armazenamento definida na ficha técnica:
    -   "Mantenha Resfriado de 0°C a 7°C"
    -   "Mantenha Congelado a -18°C ou mais frio"

## 4. Rastreabilidade (Lote e Datas)

-   **Data de Fabricação:** Obrigatória (Dia/Mês/Ano).
-   **Validade:** Obrigatória.
-   **Nº de Registro:** Correlacionado ao carimbo de inspeção.

## 5. Proibições
-   Omitir a espécie animal na denominação (Ex: "Hambúrguer de Carne Bovina").
-   Uso de imagens que induzam ao erro sobre a composição real (Ex: Foto de mel puro em "Alimento à Base de Mel").
