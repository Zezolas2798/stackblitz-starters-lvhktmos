# Motor de Estoque: Regras de Negócio e Modelagem Matemática

Este documento estabelece as diretrizes técnicas e matemáticas para o processamento de estoque no **SaaS Food Service**. Ele deve servir como referência obrigatória para o desenvolvimento de stored procedures, edge functions e lógica de backend relacionada ao inventário.

---

## 1. Integridade de Dados e Rastreabilidade (GxP/ANVISA)

Para garantir a conformidade com as normas sanitárias e auditorias fiscais, o sistema adota uma arquitetura de **Dados Imutáveis** no nível de movimentação.

### 1.1 Proibição de Exclusão Definitiva (Hard Delete)
*   **Regra**: É estritamente proibido o uso do comando `DELETE` na tabela de movimentações (`inventory_movements`) ou lotes (`inventory_lots`).
*   **Implementação**: Utilizar a coluna `deleted_at`. Registros marcados como excluídos devem ser preservados para fins de auditoria (quem excluiu e por que).
*   **Impacto**: O saldo de estoque nunca é um valor estático editável; ele é o resultado da soma de todos os eventos não deletados.

### 1.2 Event Sourcing e Kardex
*   **Kardex**: O sistema deve manter um registro cronológico (Razão de Estoque) de todas as entradas, saídas, transferências e ajustes.
*   **Fonte da Verdade**: O saldo em tempo real de um insumo deve ser validado periodicamente comparando o campo `current_stock` com a soma histórica dos movimentos (`inventory_movements`).

---

## 2. Logística de Picking: Regra FEFO

Diferente do varejo comum (que muitas vezes usa FIFO), o setor de Food Service exige a regra **FEFO (First Expired, First Out)** para garantir a segurança alimentar e reduzir o desperdício (*waste*).

*   **Lógica**: Ao realizar uma baixa de estoque (venda ou requisição para produção), o sistema deve sugerir ou forçar a saída do lote que possui a **Data de Validade (`expiry_date`) mais próxima**.
*   **Critério de Desempate**: Caso dois lotes tenham a mesma validade, utiliza-se o critério FIFO (o que entrou primeiro no sistema).

```sql
-- Exemplo de lógica de consulta para Picking FEFO
SELECT id, lot_number, expiry_date, quantity
FROM inventory_lots
WHERE product_id = 'XYZ' 
  AND quantity > 0
  AND deleted_at IS NULL
ORDER BY expiry_date ASC, created_at ASC;
```

---

## 3. Modelagem Matemática de Custos

O sistema deve processar o custo dos insumos utilizando o método **CMPM**, garantindo que as flutuações de mercado sejam refletidas no custo médio do estoque.

### 3.1 Custo Médio Ponderado Móvel (CMPM)
O custo médio é recalculado a cada nova entrada de mercadoria.

$$Novo\ Custo\ Médio = \frac{(Estoque\ Atual \times Custo\ Médio\ Atual) + (Qtde\ Entrada \times Custo\ Entrada)}{Estoque\ Atual + Qtde\ Entrada}$$

> [!IMPORTANT]
> Saídas de estoque (vendas/perdas) não alteram o Custo Médio Ponderado, apenas a quantidade total.

---

## 4. Engenharia de Insumos: Rendimento e Perda

Em Food Service, o custo de um item na Ficha Técnica quase nunca é o preço pago na nota fiscal, devido às perdas de processamento.

### 4.1 Fator de Correção (FC)
O FC antecipa a perda natural no pré-preparo (cascas, ossos, aparas).

$$FC = \frac{Peso\ Bruto\ (PB)}{Peso\ Líquido\ (PL)}$$

*   **Peso Bruto (PB)**: Peso como comprado (As Purchased - AP).
*   **Peso Líquido (PL)**: Peso após limpeza/preparo (Edible Portion - EP).
*   **Interpretação**: O FC é sempre $\ge 1$. Um FC de 1.25 significa que 25% do produto foi perdido no processo.

### 4.2 Rendimento (Yield)
O Yield é a expressão percentual do aproveitamento.

$$Yield\ (\%) = \left( \frac{Peso\ Líquido}{Peso\ Bruto} \right) \times 100$$
*OU*
$$Yield\ (\%) = \left( \frac{1}{FC} \right) \times 100$$

### 4.3 Cálculo de Custo Real (Custo EP)
Para precificar corretamente uma receita, o sistema deve aplicar o Yield sobre o custo de compra.

$$Custo\ Real\ (EP) = \frac{Custo\ de\ Compra\ (AP)}{Yield\ (em\ decimal)}$$

---

## 5. Resumo de Variáveis para o Backend

| Sigla | Nome | Descrição |
| :--- | :--- | :--- |
| **AP** | As Purchased | Estado do produto no momento da compra (Bruto). |
| **EP** | Edible Portion | Estado do produto pronto para uso na receita (Líquido). |
| **PB** | Peso Bruto | Massa total com desperdícios inclusos. |
| **PL** | Peso Líquido | Massa útil após processamento. |
| **COGS** | Cost of Goods Sold | Custo da Mercadoria Vendida (CPV em português). |

---

> [!TIP]
> Ao calcular a necessidade de compras para um evento, o sistema deve usar a fórmula de **Previsão de Compras (APQ)**:
> $$APQ = \frac{Quantidade\ Necessária\ na\ Receita\ (EP)}{Yield}$$
