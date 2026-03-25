# **Manual Avançado de Engenharia Financeira, Auditoria e Conciliação de Marketplaces de Delivery no Brasil**

## **Sumário Executivo**

A transformação digital do setor de *Food Service* no Brasil, impulsionada pela consolidação de plataformas como iFood e Rappi, redefiniu a estrutura de capital e fluxo de caixa de restaurantes e operações de *Dark Kitchens*. O que antes era um canal de vendas auxiliar tornou-se, para muitos estabelecimentos, a principal fonte de receita e, paradoxalmente, o centro de custos mais complexo e opaco. A dependência dessas plataformas introduziu uma camada de intermediação financeira onde a "cegueira de dados" pode corroer margens de lucro já estreitas.

Este relatório técnico oferece uma análise exaustiva da arquitetura de dados financeiros dos principais *players* do mercado brasileiro. O objetivo é fornecer aos gestores financeiros, auditores e desenvolvedores de ERPs os métodos lógicos e algoritmos necessários para auditar repasses, identificar taxas ocultas e automatizar a conciliação financeira. A análise estende-se para além da simples conferência de extratos, abordando a engenharia de dados necessária para cruzar informações de Pontos de Venda (PDV), Adquirentes de Cartão e Gateways de Marketplaces, estabelecendo *benchmarks* de rentabilidade real para o cenário econômico de 2025/2026.

## ---

**1\. O Ecossistema de Repasses Digitais e a Complexidade da Conciliação**

Para desenhar uma lógica de conciliação robusta, é imperativo compreender primeiramente a mecânica do fluxo financeiro no ecossistema de delivery. A transação não é bilateral (Cliente ![][image1] Restaurante), mas multilateral, envolvendo o consumidor, a plataforma (Marketplace), a processadora de pagamentos (Adquirente/Sub-adquirente), a operadora logística e o estabelecimento comercial.

### **1.1. Arquitetura de Fluxo de Pagamentos: O Modelo "Split Payment"**

O coração da complexidade reside no modelo de *Split Payment* (divisão de pagamentos). Quando um cliente realiza um pedido de R$ 100,00 no iFood ou Rappi, o valor não transita integralmente para o restaurante.

1. **Captura:** O cliente paga R$ 100,00 via cartão de crédito no app.  
2. **Retenção na Fonte:** A plataforma retém automaticamente sua comissão (ex: 23%), taxas de transação (ex: 3,2%) e taxas de serviço cobradas do consumidor (ex: R$ 0,99).  
3. **Liquidação Líquida:** O restaurante recebe apenas o valor residual (ex: R$ 72,80) em uma data futura.

**O Desafio da Conciliação:** O extrato bancário do restaurante reflete apenas o valor líquido (R$ 72,80), enquanto o cupom fiscal emitido no PDV reflete o valor bruto (R$ 100,00). Sem uma "camada de tradução" (middleware) que reconcilie essas duas pontas, a contabilidade torna-se impossível, gerando passivos fiscais e perda de controle sobre a margem real.

### **1.2. O Problema da "Trava de Recebíveis" e Cessão de Crédito**

No cenário financeiro brasileiro atual, a complexidade é amplificada pela "Trava de Recebíveis" bancária. Os marketplaces, atuando frequentemente como instituições de pagamento ou parceiros de bancos, podem direcionar os repasses para contas específicas ou "travar" esses valores como garantia de empréstimos.

* **Implicação na Auditoria:** Um repasse esperado de R$ 10.000,00 pode aparecer no extrato bancário como R$ 0,00 ou um valor parcial, caso haja retenção por crédito tomado. A conciliação automatizada deve, portanto, diferenciar "Retenção por Taxas Operacionais" (Comissão, Entrega) de "Retenção Financeira" (Empréstimos, Antecipações). Os relatórios financeiros das plataformas, como detalharemos adiante, possuem colunas específicas para segregar esses eventos, mas que frequentemente são ignoradas em conciliações manuais.1

### **1.3. Modalidades de Pagamento e suas Lógicas Distintas**

A auditoria deve aplicar algoritmos diferentes para as duas modalidades principais de venda:

* **Pagamento Online (In-App Payment):** O marketplace atua como custodiante do dinheiro. O risco de fraude (Chargeback) é gerido pela plataforma, mas o custo financeiro é repassado ao restaurante. A conciliação foca em validar se as taxas descontadas batem com o contrato.  
* **Pagamento Offline (Pagamento na Entrega):** O dinheiro entra diretamente no caixa do restaurante (dinheiro) ou na sua própria maquininha (cartão). Neste caso, o marketplace *não* retém o valor na fonte. Em vez disso, ele gera um **débito** (conta a pagar) para o restaurante.  
  * **Mecanismo de Compensação:** O iFood, por exemplo, abate a comissão dos pedidos Offline do saldo a receber dos pedidos Online. Se o saldo Online for insuficiente, gera-se um boleto.3  
  * **Risco de Duplicidade:** Um erro comum em sistemas de gestão é registrar a taxa do cartão da maquininha própria *e* a taxa de transação do app equivocadamente.

## ---

**2\. Engenharia de Dados: iFood (Estrutura e API)**

O iFood oferece a infraestrutura de dados mais madura para conciliação no Brasil, migrando recentemente de APIs legadas para uma arquitetura baseada em eventos financeiros e arquivos de reconciliação CSV robustos (API v3/v4). Compreender a ontologia desses dados é o primeiro passo para a automação.

### **2.1. A Lógica de "Competências" e Janelas de Apuração**

Diferente da conciliação bancária tradicional (D+1, D+30), o iFood opera com o conceito de **Competência Semanal**.

* **Janela de Vendas:** As vendas são agregadas de segunda-feira (00:00) a domingo (23:59).  
* **Processamento:** Na segunda-feira subsequente, o sistema "fecha" a competência e gera os arquivos financeiros.  
* **Liquidação (Repasse):** O pagamento ocorre, para a maioria dos parceiros no modelo padrão, na quarta-feira da semana seguinte (ou conforme plano de antecipação contratado).4

**Ponto Crítico de Auditoria:** Tentar conciliar vendas do dia 1 ao dia 30 do mês civil resultará em falhas, pois os repasses quebram semanas entre meses. A automação deve, obrigatoriamente, ingerir os dados por id\_competencia ou semana\_epidemiologica e não por mês calendário civil.3

### **2.2. Anatomia do Relatório "Extrato Financeiro" (API Reconciliation)**

O arquivo CSV gerado pela API de Reconciliação do iFood é a "fonte da verdade". Ele é um livro-razão detalhado onde cada linha representa um evento financeiro atômico. Para construir um modelo de dados, devemos mapear os campos críticos.3

#### **2.2.1. Dicionário de Dados para Engenharia Reversa**

Abaixo, detalhamos os campos essenciais que devem constar no banco de dados de conciliação:

| Nome da Coluna (CSV/API) | Tipo de Dado | Definição Técnica e Lógica de Negócio |
| :---- | :---- | :---- |
| pedido\_associado\_ifood | UUID / String | **Chave Primária da Entidade Pedido.** É o elo de ligação entre o PDV e o Financeiro. Lançamentos que não possuem este ID (null ou vazio) são "Ocorrências de Loja" (mensalidades, taxas avulsas). |
| data\_fato\_gerador | Datetime (ISO) | A data em que o evento ocorreu (venda ou cancelamento). Fundamental para regime de competência contábil. |
| fato\_gerador | Enum / String | Define a macro-classe do evento. Valores críticos: VENDA, CANCELAMENTO, RESSARCIMENTO, OCORRENCIA, AJUSTE. Este campo dita o sinal algébrico da operação na maioria dos algoritmos.3 |
| tipo\_lancamento | Enum / String | Refina a natureza contábil. Ex: Comissão, Taxa de Entrega, Incentivo Promocional, Taxa de Adquirente. |
| valor | Decimal (10,2) | O valor monetário do evento. **Atenção:** Números negativos indicam saídas (débitos/comissões) e positivos indicam entradas (vendas/créditos). |
| impacto\_no\_repasse | Boolean / String | **O Campo Mais Importante.** Valores SIM ou NAO. A soma de todas as linhas onde impacto\_no\_repasse \= SIM deve bater exatamente, centavo a centavo, com o valor depositado no banco.3 |
| descricao\_lancamento | String | Texto descritivo. Útil para categorizar despesas via NLP (Processamento de Linguagem Natural) ou RegEx, ex: identificar "Taxa de Antecipação" vs "Mensalidade". |

#### **2.2.2. Tratamento de Subsídios e Promoções (Incentivos)**

Uma das maiores fontes de erro na conciliação automatizada é a interpretação incorreta de promoções. O iFood distingue dois tipos de subsídios, que aparecem como eventos financeiros distintos:

1. **Promoção Incentivada pelo iFood:** O iFood custeia o desconto.  
   * Lógica no Relatório: O valor da venda aparece reduzido ou cheio, mas há um crédito adicional (Lançamento positivo) chamado "Incentivo Promocional iFood".  
   * Ação de Auditoria: Este valor deve ser somado à receita bruta do restaurante. É dinheiro entrando.  
2. **Promoção Incentivada pela Loja:** O restaurante custeia o desconto.  
   * Lógica no Relatório: O valor da venda já entra líquido do desconto, ou aparece um débito correspondente.  
   * Ação de Auditoria: Este valor é uma dedução de receita (Dedução de Vendas).

Se o algoritmo ignorar a coluna tipo\_lancamento \= Incentivo, o restaurante parecerá ter recebido menos do que deveria, gerando falsos positivos na auditoria.5

### **2.3. Algoritmo de Reconstrução do Repasse (iFood)**

Para validar matematicamente um pedido, o algoritmo deve agregar todas as linhas do CSV que compartilham o mesmo pedido\_associado\_ifood.

**Fórmula de Conciliação por Pedido:**

**![][image2]**  
**Pseudocódigo de Implementação (Python/Pandas):**

Python

def calcular\_liquido\_pedido(df\_extrato, id\_pedido):  
    \# Filtrar apenas linhas do pedido específico que impactam o repasse  
    linhas\_pedido \= df\_extrato\[  
        (df\_extrato\['pedido\_associado\_ifood'\] \== id\_pedido) &   
        (df\_extrato\['impacto\_no\_repasse'\] \== 'SIM')  
    \]  
      
    \# Soma algébrica simples (assumindo que o CSV já traz sinais \+/- corretos)  
    valor\_liquido \= linhas\_pedido\['valor'\].sum()  
      
    return valor\_liquido

Este cálculo deve ser comparado com o "Valor Líquido Esperado" calculado pelo ERP com base nas regras contratuais. Divergências \> R$ 0,05 devem ser flagradas para revisão.

## ---

**3\. Engenharia de Dados: Rappi (Desafios e Riscos)**

A Rappi apresenta um ambiente mais hostil para a conciliação automatizada, caracterizado por menor granularidade de dados acessíveis via API pública e um regime contratual que penaliza a falta de agilidade na conferência.

### **3.1. O Ciclo Quinzenal e a "Armadilha da Preclusão"**

Diferente do ciclo semanal do iFood, a Rappi opera com cortes quinzenais rígidos. Esta estrutura impacta diretamente o fluxo de caixa e a lógica de corte de dados para auditoria.

* **Corte 1 (Início do Mês):** Pedidos realizados entre dia 01 e dia 15\.  
  * Data de Pagamento: Dia 08 do mês seguinte.  
* **Corte 2 (Fim do Mês):** Pedidos realizados entre dia 16 e o final do mês (30/31).  
  * Data de Pagamento: Dia 23 do mês seguinte.

**Risco Jurídico-Financeiro (Preclusão):** As investigações 6 apontam para uma cláusula contratual crítica na Rappi: o prazo de conciliação. O parceiro tem, frequentemente, apenas **60 dias (2 meses)** após a data do pedido para contestar qualquer divergência. Após esse período, ocorre a preclusão do direito, ou seja, o restaurante "aceita" tacitamente o pagamento incorreto. Isso torna a conciliação automatizada uma ferramenta de *compliance* jurídico urgente, não apenas de controle financeiro.

### **3.2. Estrutura do Relatório de Pagamentos Rappi**

O extrato da Rappi, geralmente exportado via Portal Partners (devido às restrições da API para parceiros não integrados via *middleware* específico), contém colunas que exigem interpretação cuidadosa.7

#### **3.2.1. Mapeamento de Colunas Críticas (Rappi Excel Export)**

| Coluna (Relatório) | Interpretação para Conciliação |
| :---- | :---- |
| ID do Pedido / Order ID | Chave de ligação. Atenção: A Rappi pode gerar múltiplos IDs para o mesmo pedido em casos de cancelamento/repedido. |
| Data de Entrega | Define em qual quinzena (Corte) o pedido será pago. Pedidos entregues às 23:59 do dia 15 podem cair no corte seguinte dependendo do fuso horário do servidor. |
| Total Venda (GMV) | Valor bruto da venda. Deve incluir a taxa de serviço paga pelo cliente, se esta transitar pela NF do restaurante. |
| Desconto Rappi | Subsídios pagos pela plataforma. Deve ser tratado como Receita. |
| Comissão | Valor retido (negativo). |
| Ajustes / Adjustments | **Coluna de Alto Risco.** Aqui ficam ocultas multas operacionais, como atrasos ou erros de itens.6 |
| Taxa de Serviço | Valor pago pelo cliente à Rappi. Geralmente é descontado integralmente do restaurante, tendo efeito neutro no caixa, mas impacto fiscal (bitributação). |

### **3.3. Auditoria de Taxas Ocultas e Penalidades Operacionais**

A automação na Rappi deve monitorar agressivamente a coluna de "Ajustes" ou "Outros Débitos". A pesquisa identificou penalidades automáticas que frequentemente passam despercebidas:

* **Multa por Atraso de Motoboy:** Desconto automático de **R$ 10,00** se o entregador aguardar mais de 5 a 10 minutos no restaurante.6  
* **Multa por Atraso de Preparo:** Em alguns contratos, há previsão de desconto percentual (ex: 10%) sobre o valor do pedido para atrasos de preparo superiores a 40 minutos.6  
* **Estornos Automáticos (Dispute Lost):** Se um cliente reclama de item faltante, a Rappi pode debitar o valor integral do item ou do pedido. A conciliação deve cruzar esses débitos com os "Tickets de Suporte" para verificar se a contestação foi feita.

## ---

**4\. Métodos e Lógicas para Conciliação Automatizada (Algoritmos)**

A "Conciliação 1:N" (Um depósito para N pedidos) é o padrão ouro. O depósito bancário é a "verdade imutável". O objetivo do algoritmo é explicar como a soma de milhares de micro-transações resulta naquele valor exato.

### **4.1. Lógica de Conciliação de Cartões vs. Repasses de App**

Existe uma distinção fundamental entre conciliar adquirentes de cartão (Cielo, Rede, Stone) e conciliar Marketplaces.

* **Adquirentes (Cartões):** Conciliação baseada em NSU (Número Sequencial Único) e TID. O fluxo é linear: Venda ![][image1] Taxa MDR ![][image1] Líquido.  
* **Marketplaces (Apps):** Conciliação baseada em **ID do Pedido**. O fluxo é complexo: Venda ![][image1] Comissão ![][image1] Taxa Pgto ![][image1] Taxa Entrega ![][image1] Incentivo ![][image1] Líquido.

**Integração das Lógicas (Desafio do NSU no Delivery):**

Para pedidos pagos ONLINE (In-App), **não existe NSU** visível para o restaurante, pois a transação ocorre entre o cliente e o iFood/Rappi. O restaurante não pode conciliar esses pedidos na sua adquirente de cartão. O "extrato do cartão" do restaurante é, na verdade, o "Extrato de Repasse" do Marketplace.

**Solução Lógica para ERPs:**

O ERP deve ser configurado para tratar "iFood" e "Rappi" como **Portadores Financeiros** (semelhantes a um banco ou administradora de cartão), e não apenas como clientes.

1. Venda PDV (Forma de Pagto: "iFood Online") ![][image1] Gera Título a Receber no Portador "iFood".  
2. Importação do Extrato iFood ![][image1] Baixa os Títulos a Receber e lança as Despesas (Comissões) no DRE.

### **4.2. Algoritmo de Cruzamento de Dados (Passo a Passo)**

Para implementar uma rotina automatizada, sugere-se o seguinte fluxo de dados:

**Passo 1: Ingestão e Normalização**

* Importar CSV iFood e XLSX Rappi.  
* Normalizar nomes de colunas para um padrão interno (ex: external\_id, gross\_amount, commission\_fee, net\_amount, payout\_date).  
* Converter todas as datas para formato YYYY-MM-DD.

**Passo 2: "Matching" (Batimento)**

* **Match Perfeito:** Procurar no ERP pedidos com o mesmo ID e Valor Bruto. Se a diferença for R$ 0,00, marcar como "Conciliado".  
* **Match com Divergência:** Mesmo ID, mas valores diferentes. Calcular a diferença. Se for exatamente o valor da "Taxa de Serviço do Cliente" (ex: R$ 0,99), classificar como "Divergência de Taxa de Serviço" (ajuste contábil). Se for maior, flagrar para revisão humana.  
* **Match Órfão (Sobras):**  
  * *Sobra no ERP:* Pedido existe no sistema, mas não no extrato. Possível causa: Cancelamento não registrado no ERP ou atraso no repasse (verificar data de corte).  
  * *Sobra no Extrato:* Pedido existe no extrato, mas não no ERP. Possível causa: Pedido inserido manualmente no tablet do app e não lançado no caixa. Risco alto de furo de estoque.

**Passo 3: Auditoria de Taxas (Compliance)**

* Aplicar a "Regra Contratual" sobre o Valor Bruto do extrato.  
  * Comissão\_Calculada \= Valor\_Bruto \* 0.23 (exemplo iFood Entrega).  
  * Comparar Comissão\_Calculada com a coluna valor\_comissao do extrato.  
  * Se Abs(Diferença) \> 0.10, gerar alerta de "Erro de Comissionamento".

## ---

**5\. Taxas, Tarifas e Custos Ocultos (Panorama 2025/2026)**

A auditoria eficaz exige o conhecimento dos parâmetros exatos de cobrança. As plataformas atualizam suas tabelas anualmente. Abaixo, consolidamos as principais taxas vigentes para os exercícios de 2025 e 2026, baseadas nas últimas atualizações contratuais e *releases* de imprensa.10

### **5.1. Tabela Mestra de Taxas: iFood**

| Componente de Custo | Plano Básico (Entrega Própria) | Plano Entrega (Logística iFood) | Notas de Auditoria e Pontos de Atenção |
| :---- | :---- | :---- | :---- |
| **Comissão sobre Venda** | **12%** | **23%** | Incide sobre o valor total (Produtos \+ Taxa de Entrega cobrada do cliente). |
| **Taxa de Pagamento Online** | **3,2%** | **3,2%** | Cobrada sobre o valor transacionado digitalmente. Pedidos pagos em dinheiro/máquina na entrega não devem ter essa taxa. |
| **Mensalidade** | R$ 130,00 | R$ 150,00 | Cobrada apenas se o faturamento bruto exceder R$ 1.800,00/mês. Verificar isenção em meses fracos. |
| **Taxa de Serviço (Consumidor)** | R$ 0,99 (Fixo) | R$ 0,99 (Fixo) | Cobrada do cliente. O restaurante arrecada e o iFood retém. Neutro no caixa, mas impacta a base de cálculo de impostos se a NF for bruta. |
| **Logística "Sob Demanda"** | Variável (Distância) \+ Taxa | N/A | Se usar o entregador iFood pontualmente no Plano Básico, paga-se o frete \+ taxa de \~4% ou fixa.10 |
| **Antecipação de Recebíveis** | Variável (D+1, D+7) | Variável | Taxas de antecipação (ex: 1.5% a 2.5% a.m.) aparecem como despesa financeira separada no extrato. |

### **5.2. Tabela Mestra de Taxas: Rappi**

| Componente de Custo | Plano "Entrega do seu Jeito" | Plano "Full Service" | Notas de Auditoria e Pontos de Atenção |
| :---- | :---- | :---- | :---- |
| **Comissão sobre Venda** | **12%** | **27% a 30%** | A Rappi possui variações regionais e por categoria de restaurante. O Full Service inclui logística e atendimento. |
| **Taxa de Pagamento (Cartão)** | **3,5%** | **Incluída ou \+3,5%** | Verificar contrato específico. Alguns contratos Full embutem a taxa, outros cobram à parte.11 |
| **Taxa de Adesão (Setup)** | R$ 40,00 | R$ 150,00 | Cobrança única (setup). Pode ser parcelada. Verificar se não está sendo cobrada duplicada em renovações. |
| **Multas Operacionais** | Variável | Variável | Penalidades por atraso (R$ 10,00) e cancelamento são frequentes e aparecem como "Adjustments". |

### **5.3. Custos Ocultos e Bitributação**

Um dos maiores ralos financeiros no delivery é a **bitributação de taxas**.

* **Cenário:** O cliente paga R$ 50,00 (Hambúrguer) \+ R$ 0,99 (Taxa Serviço iFood). Total NF emitida pelo restaurante: R$ 50,99.  
* **Problema:** No Simples Nacional, o imposto incide sobre R$ 50,99. Porém, o R$ 0,99 nunca pertenceu ao restaurante; foi retido integralmente pelo iFood.  
* **Auditoria:** O sistema deve verificar se a contabilidade está segregando essas receitas de terceiros ou se o restaurante está pagando imposto sobre a receita da plataforma. Embora juridicamente complexo, a conciliação deve ao menos evidenciar o montante anual pago em impostos sobre taxas de serviço.

## ---

**6\. Benchmarks: A Margem de Contribuição Real no Delivery**

A simples auditoria de repasses não garante lucro. É necessário confrontar os dados auditados com a estrutura de custos do negócio. A "Margem de Contribuição Real" (MCR) é o indicador definitivo de saúde financeira.

### **6.1. Fórmula da Margem de Contribuição Real**

Diferente da margem bruta (Preço \- CMV), a MCR desconta todos os custos variáveis de venda.

![][image3]

### **6.2. Benchmarks de Mercado (Brasil 2025/2026)**

Com base em dados agregados do setor 12, estabelecemos os seguintes parâmetros de referência para operações saudáveis:

| Indicador | Operação Física (Salão) | Operação Delivery (Dark Kitchen) | Comentário Analítico |
| :---- | :---- | :---- | :---- |
| **CMV (Custo Mercadoria)** | 28% \- 32% | **30% \- 35%** | Delivery permite CMV levemente maior devido à escala, mas acima de 38% torna-se insustentável. |
| **Embalagem** | \< 1,5% | **6% \- 9%** | Custo crítico. Embalagens "premium" podem destruir a margem. Benchmark ideal é tentar manter abaixo de 6%. |
| **Taxas de Marketplace** | 0% | **22% \- 30%** | O "aluguel digital". Substitui o custo de ocupação (ponto caro) do salão físico. |
| **Margem Contribuição** | 50% \- 55% | **25% \- 35%** | Margens abaixo de 25% no delivery indicam que a operação trabalha apenas para girar caixa, sem gerar lucro real. |
| **Lucro Líquido Final** | 10% \- 15% | **8% \- 12%** | A operação de delivery ganha no volume e giro de ativos, não na margem unitária alta. |

### **6.3. O "Markup" de Inflação para Delivery**

Para preservar a margem em meio a comissões de 27%, os restaurantes devem aplicar um *markup* diferenciado no cardápio digital. A matemática simples de "somar 27%" está errada, pois a comissão incide sobre o preço final inflacionado.

**Fórmula de Precificação Correta:**

Para manter R$ 10,00 de margem em um produto que custa R$ 20,00 no salão, o preço no app deve ser calculado dividindo-se pela (1 \- Taxa Total).

![][image4]

## ---

**7\. Implementação Prática: Modelos de Planilha e Rotina**

Para gestores que não dispõem de ERPs avançados, a conciliação pode ser semim-automatizada via Excel ou Google Sheets utilizando o modelo de dados descrito abaixo.

### **7.1. Modelo de Planilha de Conciliação (Estrutura de Abas)**

Sugere-se a criação de um arquivo mestre com três abas principais 15:

**Aba 1: DB\_IFOOD\_IMPORT (Dados Brutos)**

* Esta aba recebe o "Copiar/Colar" do CSV de Reconciliação do iFood.  
* Não deve haver formatação manual, apenas dados brutos para alimentar fórmulas.

**Aba 2: DB\_PDV\_VENDAS (Dados Internos)**

* Exportação do sistema de caixa/PDV.  
* Colunas obrigatórias: Data, ID\_Pedido\_Externo (chave de ligação), Valor\_Total\_Pedido, Status (Concluído/Cancelado).

**Aba 3: DASHBOARD\_AUDITORIA (Cálculos)**

* Esta aba cruza as informações usando funções de busca (XLOOKUP ou INDICE/CORRESP).  
* **Coluna A:** ID do Pedido (Vem da DB\_PDV\_VENDAS).  
* **Coluna B:** Status no PDV.  
* **Coluna C:** Status no iFood (Busca na DB\_IFOOD\_IMPORT). *Check:* Se PDV="Cancelado" e iFood="Venda", alerta vermelho imediato.  
* **Coluna D:** Valor Líquido Recebido (SOMA.SE na DB\_IFOOD\_IMPORT onde impacto\_no\_repasse="SIM").  
* **Coluna E:** Comissão Calculada (Valor\_Venda \* Taxa Contratada).  
* **Coluna F:** Comissão Real (SOMA.SE na DB\_IFOOD\_IMPORT onde tipo="Comissão").  
* **Coluna G:** Divergência (Comissão Calculada \- Comissão Real).  
* **Validação Condicional:** Destacar em vermelho qualquer divergência superior a R$ 0,10.

### **7.2. Rotina Operacional de Conciliação**

1. **Semanalmente (Segundas-feiras):** Baixar o arquivo de reconciliação da semana anterior.  
2. **Processamento:** Importar para a planilha ou sistema.  
3. **Análise de Desvios:**  
   * Filtrar pedidos com status divergente (Cancelado no sistema x Pago no app, ou vice-versa).  
   * Filtrar pedidos com "Divergência de Comissão" alta.  
4. **Abertura de Chamados:** Para o iFood, abrir chamados via Portal do Parceiro anexando a evidência (linha do CSV). Para Rappi, atentar ao prazo de 60 dias para evitar preclusão.6  
5. **Conciliação Bancária:** Verificar se o valor total da coluna impacto\_no\_repasse=SIM bate com o crédito na conta corrente na quarta-feira.

## **Conclusão**

A conciliação financeira de marketplaces de delivery transcendeu a simples conferência de caixa para se tornar uma disciplina de engenharia de dados e *compliance* contratual. Com margens comprimidas e custos variáveis elevados (CMV \+ Embalagem \+ Logística \+ Taxas), a ineficiência na gestão dos repasses pode representar a diferença entre o lucro e a insolvência.

A adoção de métodos baseados na leitura granular dos arquivos de reconciliação (especialmente o campo impacto\_no\_repasse do iFood e os Adjustments da Rappi), combinada com o entendimento das travas bancárias e prazos de preclusão, permite que o estabelecimento recupere o controle sobre seu fluxo de caixa. A automação não é apenas recomendada, é mandatória para operações que escalam acima de centenas de pedidos mensais, garantindo que a tecnologia sirva à rentabilidade do negócio, e não apenas à conveniência do consumidor.

#### **Referências citadas**

1. Introduction \- iFood Developer, acessado em fevereiro 18, 2026, [https://developer.ifood.com.br/docs/guides/modules/financial/intro](https://developer.ifood.com.br/docs/guides/modules/financial/intro)  
2. API Antecipation \- iFood Developer, acessado em fevereiro 18, 2026, [https://developer.ifood.com.br/docs/guides/modules/financial/api-antecipation](https://developer.ifood.com.br/docs/guides/modules/financial/api-antecipation)  
3. API Reconciliation \- iFood Developer, acessado em fevereiro 18, 2026, [https://developer.ifood.com.br/pt-BR/docs/guides/modules/financial/api-reconciliation](https://developer.ifood.com.br/pt-BR/docs/guides/modules/financial/api-reconciliation)  
4. Gestão Financeira no iFood: saiba como fazer neste guia completo\!, acessado em fevereiro 18, 2026, [https://blog-parceiros.ifood.com.br/gestao-financeira-no-ifood/](https://blog-parceiros.ifood.com.br/gestao-financeira-no-ifood/)  
5. Understand how the iFood Financial Reconciliation Report works \#experience \#iFoodconnection \- YouTube, acessado em fevereiro 18, 2026, [https://www.youtube.com/shorts/i9pZSGw0KdM](https://www.youtube.com/shorts/i9pZSGw0KdM)  
6. O CONTRATO LEONINO DA RAPPI: não assine antes de ver esse vídeo\! ⚠️ | 2025 \[DELIVERY\] EP 64/150, acessado em fevereiro 18, 2026, [https://www.youtube.com/watch?v=Bw24DLTO9mg](https://www.youtube.com/watch?v=Bw24DLTO9mg)  
7. Taxas Rappi para Restaurantes Brasil \- Rappi Partners Mexico, acessado em fevereiro 18, 2026, [https://merchants.rappi.com/pt-br/taxas-rappi-para-restaurantes](https://merchants.rappi.com/pt-br/taxas-rappi-para-restaurantes)  
8. Merchant Reconciliation Report | Rapyd Docs, acessado em fevereiro 18, 2026, [https://docs.rapyd.net/en/merchant-reconciliation-report.html](https://docs.rapyd.net/en/merchant-reconciliation-report.html)  
9. buffolander/rappi-payless-conciliation-sample \- GitHub, acessado em fevereiro 18, 2026, [https://github.com/buffolander/rappi-payless-conciliation-sample](https://github.com/buffolander/rappi-payless-conciliation-sample)  
10. Taxas do iFood: entenda planos, comissão e taxa de serviço para ..., acessado em fevereiro 18, 2026, [https://blog-parceiros.ifood.com.br/taxas-ifood/](https://blog-parceiros.ifood.com.br/taxas-ifood/)  
11. Quais as taxas do Rappi para restaurantes | Alloy, acessado em fevereiro 18, 2026, [https://www.alloy.al/post/quais-as-taxas-do-rappi-para-restaurantes-e-como-pagar-menos](https://www.alloy.al/post/quais-as-taxas-do-rappi-para-restaurantes-e-como-pagar-menos)  
12. CMV em restaurantes: como calcular, controlar e reduzir custos, acessado em fevereiro 18, 2026, [https://blog-parceiros.ifood.com.br/cmv/](https://blog-parceiros.ifood.com.br/cmv/)  
13. Sua embalagem vende ou só gasta sua margem? | 2025 \[delivery\] EP 86/150 \- YouTube, acessado em fevereiro 18, 2026, [https://www.youtube.com/watch?v=ze2O7pbDbyE](https://www.youtube.com/watch?v=ze2O7pbDbyE)  
14. Brazil Food Delivery Market Size, Share & Forecast 2034 \- IMARC Group, acessado em fevereiro 18, 2026, [https://www.imarcgroup.com/brazil-food-delivery-market](https://www.imarcgroup.com/brazil-food-delivery-market)  
15. 17 planilhas gratuitas para baixar e usar \- iFood para Parceiros, acessado em fevereiro 18, 2026, [https://blog-parceiros.ifood.com.br/planilhas/](https://blog-parceiros.ifood.com.br/planilhas/)  
16. Planilha Restaurante Excel, acessado em fevereiro 18, 2026, [https://planilha-controle.com/restaurante/](https://planilha-controle.com/restaurante/)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAYCAYAAAAYl8YPAAAAX0lEQVR4XmNgGAWjgKpAAV2AEuABxPzoguQCkEFB6IKUgItALI8uSC7gBuLFQCyDLjENiGeRgRcA8S8g7mOgEOB0GTkA5LLt6ILkgisMVIoAFyAWRBckF7SiC4yC4QYA/C8RC4AA67MAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,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>

[image3]: <data:image/png;base64,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>

[image4]: <data:image/png;base64,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>