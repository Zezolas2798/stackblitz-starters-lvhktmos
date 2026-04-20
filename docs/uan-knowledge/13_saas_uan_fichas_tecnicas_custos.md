# Base de Conhecimento UAN: SaaS - Fichas Técnicas e Arquitetura de Custos Financeiros

Documentação focada nas matrizes matemáticas (Business Rules) que comandam o coração financeiro de qualquer sistema ERP de gastronomia industrial (CMV, Fatores de Rendimento e Algoritmos de Precificação de Contratos).

---

## 1. Fatores Termodinâmicos de Engenharia de Produto (FTP)

Dentro da Ficha Técnica de Preparo (FTP), os alimentos não são entidades de massa e volume estáticos. O código processará multiplicações e divisões compulsórias sobre os pesos.

### 1.1 Fator de Correção (FC)
Perda fria inevitável no pré-preparo (cascas, ossos, sementes e descarte natural).
*   **A Relação Padrão:** $FC = \frac{Peso Bruto (Almoxarifado)}{Peso Líquido (Limpo)}$
*   **Acionamento do Trigger no Módulo de Compras:** Ao compilar as FTPs da grade do cardápio, a Inteligência do SaaS inverte a fórmula para calcular autonomamente o peso da Ordem de Compra.
    *   $Necessidade Total Líquida = (Comensais \times Per Capita Líquido)$
    *   $Ordem de Compra (Peso Bruto) = Necessidade Total Líquida \times FC$
*   **Correção de Custo Monetário:** O Custo Líquido da porção na FTP nunca será o preco bruto pago na NFe. O software precisa recalcular no banco: $Custo Líquido = Custo Bruto da NFe \times FC$. 

*(Alimentos industrializados como óleo e laticínios têm o FC hard-coded como 1.0).*

### 1.2 Índice de Cocção (IC)
Ganhos (hidratação) ou perdas (retração/exsudação) por energia térmica aplicada ao Peso Líquido.
*   **A Fórmula Padrão:** $IC = \frac{Peso Cozido (Servido na Rampa)}{Peso Líquido Cru (Panela)}$
    *   *Ganho ($IC > 1.0$):* Arroz e feijões que estufam em água (IC médio de 2.5 a 3.0).
    *   *Perda ($IC < 1.0$):* Carnes magras (IC 0.65) ou gordurosas (IC 0.45) que retraem.

**Rotina Backward Scheduling (Frente-para-Trás):**
Na prática, o cliente exige a gramatura servida cozida na banda da rampa (ex: $150g$ bife ao ponto). O SaaS executará o reverso:
1.  $Peso Cru Líquido = \frac{150g}{IC (ex: 0.70)} = 214.28g$ 
2.  Descoberto o prumo Cru da panela, volta-se para descobrir o bruto a comprar:
    $Peso Compra = 214.28g \times FC (ex: 1.15) = 246.42g$ a faturar por pessoa.

### 1.3 Fator de Absorção de Gordura
A fritura transfere massa de óleo pro alimento. Um ERP de restaurantes tem que diluir automaticamente esse óleo oculto.
*   **Equivalência por Diferença:** $Massa de Óleo Fritada = Litros Iniciais - Volume que sobrou na cuba - Descarte Borra/Sólidos$
*   **O Fator Multiplicador (%):** $FA_{oleo} = (\frac{Massa de Óleo Fritada}{Total de Carne Crua Fritada}) \times 100$
*   Isso força o software a acrescer o percentual exato na soma de Custos Indiretos à Receita processada, erradicando prejuízos não documentados.

---

## 2. A Governança do CMV (Custo da Mercadoria Vendida)

A zona verde tolerado por SaaS na indústria de Alimentação Coletiva B2B é CMV cravado em **27% a 33%**. Limite crítico e insustentável de **40%**.
Para isso, o Dashboard dividirá seus KPIs num plano dual de checagem.

### 2.1 CMV Teórico (Projeto Mapeado / Orçamento Padrão)
É a utopia perfeita. O *budget* contratual que a diretoria almejou ao fechar a licitação, puxando o extrato direto do painel das Fichas Técnicas cadastradas.
```math
CMV Teórico (R$) = \sum (Número de Refeições Planejadas \times Custo da respectiva FTP)
```
Se uma semana exceder a alíquota em simulação (por usar ingredientes Premium D+), o gatilho sistêmico recusa a homologação do cardápio semanal sem senha de Gerente Sênior.

### 2.2 CMV Real e Desvios Operacionais
É amarrado não pela panela, e sim pelos cofres frios da tesouraria do software (NFs e inventários físicos reais de estoque auditados via APP/Tablet).
```math
CMV Real (R$) = Estoque Inicial (Dia 01) + Compras Mensais/Semanais (NF) - Estoque Final Físico Acusado
```
Para transformar em Margem (Percentual Vital do Dashboard):
```math
CMV Real (\%) = \frac{CMV Real (R$)}{Faturamento Bruto Projetado} \times 100
```
*(Nota Técnica de Avaliação de Valoração: Esse Custo no Brasil é calculado em tempo-real no ERP via CMPM - Custo Médio Ponderado Móvel, amenizando as curvas de inflação entre NFes diferentes).*

**Food Cost Variance (O Gap Exposto):**
```math
Desvio Algorítmico = CMV Real - CMV Teórico
```
Se a plataforma apontar R$ 6.000 de diferença, o DRILL-DOWN tem que disparar: Onde sangrou? (Furtos no recebimento, sobra-suja alta ou açougueiros cortando aparas mal feitas rasgando o Fator de Correção $FC$).

---

## 3. Os Algoritmos de Precificação Contratual

Os preços (Ticket/Bandeja) em Catering não são à la carte. Eles obedecem planilhas licitatórias com deduções rigorosas de infraestrutura.

### 3.1. Metodologia de Custeio: O Markup
Acrescentar o valor das despesas gerais que o produto final deve ter fôlego para absorver e as margens da corporação na DRE.
Alimenta-se o painel da UAN com:
*   $DV = $ Despesas Variáveis % (PIS, COFINS, ICMS, ISS)
*   $DF = $ Despesas Fixas rateadas %
*   $ML = $ Margem de Lucro %

A mecânica anti-cascata usa o **Markup Divisor (MKD)**:
```math
MKD = \frac{100\% - (DV + DF + ML)}{100}
```
Ao ter a resposta limitadora, a engine finaliza o Preço Licitação Sugerido ($Target Price$):
```math
Preço de Venda Bruto Sugerido = \frac{Custo Unitário FTP (Produção)}{MKD}
```

### 3.2. Metodologia de Custeio: Margem de Contribuição e Empate
Foge-se de rateios e prova de cima para baixo monetariamente que o negócio sobrevive.
1.  **A Margem Sobrevivente (MC):** O quão o ticket gerou de Caixa "Limpo".
    ```math
    MC Unitária (R$) = Preço Ticket Bruto - (Custo Variável FTP + Despesas Variáveis Tributárias)
    ```
2.  **O Ponto de Equilíbrio Computacional ($Break-even$):**
    ```math
    Ponto de Equilíbrio (Venda de Refeições/Mês) = \frac{Total de Custos Fixos Onerosos da Cozinha}{MC Unitária (R$)}
    ```

Se o SaaS flagrar que a MC de cada almoço está sobrando apenas $R\$ 1,00$ e a rampa serve $2.000$ peões mas o Custo Fixo do Refeitório custa $R\$ 35.000,00$, dispara alerta de Recuperação Judicial Imediata. 

O sistema intercala isso com a **Matriz Kasavana-Smith/BCG**, alertando a remoção de FTPs Classificadas como "Cães" (*Dogs* = Baixo Volume de Safra no Restaurante + Baixa MC/Sangria de custo) e hiperproteção as Fichas "Estrelas" (*Stars* = O item Carro Chefe de alta rotação na rampa + Alta Rentabilidade pro bolso da empresa).
