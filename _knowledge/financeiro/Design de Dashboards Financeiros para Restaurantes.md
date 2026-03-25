# **Arquitetura Visual para Gestão Financeira no Food Service: Um Relatório Técnico Sobre Design de Dashboards, Psicologia Cognitiva e Data Storytelling**

## **Sumário Executivo**

A indústria de Food Service opera sob uma pressão singular: margens de lucro historicamente baixas (frequentemente entre 3% e 5%), alta velocidade operacional e uma força de trabalho cuja expertise reside na criatividade culinária e hospitalidade, não necessariamente na análise financeira corporativa. O proprietário de restaurante médio enfrenta um paradoxo: ele gera uma quantidade massiva de dados transacionais diariamente (via PDV, compras, folha de pagamento), mas frequentemente carece das ferramentas cognitivas para traduzir esses dados em decisões estratégicas imediatas.

O problema central não é a ausência de dados, mas a falha na comunicação visual desses dados. Relatórios tabulares tradicionais, como o Demonstrativo de Resultados do Exercício (DRE) em formato de planilha, exigem um processamento cognitivo lento e analítico (Sistema 2 de Kahneman), enquanto a cozinha opera em um modo intuitivo e rápido (Sistema 1). O objetivo deste relatório é estabelecer um framework de design para dashboards financeiros que atue como uma "prótese cognitiva", traduzindo a complexidade contábil em narrativas visuais imediatas.

Este documento sintetiza princípios da psicologia da Gestalt, teorias de percepção visual de Stephen Few e Cole Nussbaumer Knaflic, e as melhores práticas técnicas para ferramentas como Power BI e Looker Studio. O foco é transformar o dashboard de um repositório passivo de números em uma ferramenta ativa de diagnóstico e prescrição, desenhada especificamente para reduzir a carga cognitiva de gestores não financeiros e mitigar erros críticos, como o descontrole do Custo de Mercadoria Vendida (CMV).

## ---

**1\. Fundamentos Cognitivos: A Psicologia da Gestalt Aplicada à Percepção Financeira**

Para desenhar um dashboard eficaz para um usuário leigo em finanças, devemos primeiro compreender como o cérebro humano organiza e interpreta estímulos visuais. A teoria da Gestalt, desenvolvida no início do século XX, postula que o cérebro procura padrões e totalidades antes de processar partes individuais. Em um contexto de crise financeira de um restaurante, onde a decisão precisa ser tomada em segundos, a aplicação correta desses princípios determina se o usuário perceberá um alerta crítico ou se perderá no ruído visual.1

### **1.1 O Princípio da Proximidade e a Lógica do "Prime Cost"**

O princípio da Proximidade estabelece que elementos visuais dispostos fisicamente próximos uns dos outros são percebidos como parte do mesmo grupo ou contexto.1 No design de dashboards financeiros, a violação deste princípio é o erro mais comum: métricas relacionadas são espalhadas pela tela em busca de uma "simetria estética" vazia, forçando o usuário a realizar saltos oculares e retenção de memória de curto prazo para conectar os pontos.

No varejo de alimentos, o indicador mais crítico é o **Prime Cost** (Custo Primário), que é a soma do CMV (Custo de Mercadoria Vendida) e do Custo de Mão de Obra. Se o CMV está em um canto da tela e a Folha de Pagamento no outro, o cérebro do dono do restaurante não os soma automaticamente.

**Aplicação Prática:** Para facilitar a percepção imediata da saúde operacional, os cartões de KPI (Key Performance Indicator) de CMV e Mão de Obra devem ser colocados adjacentes, com um terceiro cartão somatório (Prime Cost) imediatamente ao lado. O espaço em branco (white space) entre este grupo e os demais grupos (como Vendas ou Marketing) deve ser maior do que o espaço entre os cartões do grupo. Isso cria uma "unidade visual" de custo, permitindo que o gestor perceba instantaneamente a relação de troca: se o CMV baixou mas a Mão de Obra subiu desproporcionalmente (devido a excesso de pré-preparo, por exemplo), a proximidade revela a ineficiência.3

### **1.2 O Princípio da Similaridade e a Categorização Semântica**

A Similaridade dita que objetos que compartilham atributos visuais (cor, forma, tamanho) são percebidos como relacionados.1 Em interfaces financeiras mal projetadas, cores são usadas de forma decorativa. Um gráfico de vendas é azul porque "fica bonito", e um gráfico de despesas é azul porque "combina". Isso cria uma dissonância cognitiva.

**Aplicação Prática:**

Devemos estabelecer uma taxonomia visual rígida.

* **Entradas de Caixa (Receita):** Devem sempre utilizar a mesma família de cores (ex: tons de Azul ou Verde Petróleo).  
* **Saídas de Caixa (Despesas):** Devem utilizar uma família de cores contrastante e consistente (ex: tons de Laranja Queimado ou Terracota).  
* **Resultado Líquido (Lucro):** Uma cor distinta que denote o "objetivo" (ex: Verde Esmeralda).

Ao manter essa consistência em todos os gráficos e tabelas, treinamos o cérebro do usuário. Quando ele vê uma barra laranja crescendo em um gráfico de tendência, ele sabe intuitivamente — antes mesmo de ler o título do eixo — que se trata de um aumento de custos. Isso reduz o tempo de processamento neural necessário para decodificar o gráfico.3

### **1.3 O Princípio do Fechamento (Closure) e a Redução de Ruído**

O princípio do Fechamento descreve a capacidade do cérebro de completar formas incompletas para perceber um todo.1 Este conceito é fundamental para a "limpeza" visual defendida por Edward Tufte e Stephen Few. Dashboards tradicionais sofrem de "chart junk" (lixo gráfico): bordas pesadas, fundos coloridos, linhas de grade excessivas.

**Aplicação Prática:** Não é necessário desenhar uma caixa preta pesada ao redor de cada gráfico para separá-lo. O alinhamento dos eixos e o uso inteligente do espaço em branco são suficientes para que o cérebro crie a "borda virtual". Remover as bordas explícitas reduz a carga visual, fazendo com que os dados (as barras, as linhas) sejam a coisa mais pesada visualmente na tela. Para um dono de restaurante cansado, um design "arejado" e limpo é menos intimidador e convida à análise, enquanto um design denso e gradeado repele a atenção.5

### **1.4 O Princípio da Continuidade e a Narrativa de Tendência**

A Continuidade afirma que o olho humano segue caminhos, linhas e curvas preferencialmente a mudanças abruptas de direção.1 Este princípio é crucial para a representação de dados temporais.

**Aplicação Prática:** Ao visualizar o faturamento dos últimos 12 meses, um gráfico de linhas é superior a um gráfico de barras. A linha cria um caminho contínuo que o olho percorre, percebendo a "história" da subida e descida. As barras, por serem entidades separadas, quebram essa continuidade, forçando uma comparação discreta entre "mês A" e "mês B". Para contar a história da sazonalidade (ex: queda nas terças-feiras, pico no Dia das Mães), a linha contínua guia o olhar através do tempo, destacando anomalias como interrupções no fluxo esperado.6

## ---

**2\. Arquitetura de Informação: Padrões de Leitura e Layout**

A disposição dos elementos na tela não deve ser arbitrária. Estudos de rastreamento ocular (eye-tracking) revelam padrões distintos de como os usuários consomem informação em telas digitais. O objetivo é posicionar as informações mais críticas nas zonas de maior atenção natural, garantindo que a tomada de decisão ocorra em menos de 30 segundos.7

### **2.1 O Padrão em Z (Z-Pattern) para Dashboards Executivos**

Para dashboards de "Visão Geral" (Overview), onde o objetivo é uma verificação rápida de saúde financeira, o Padrão em Z é o modelo mental dominante.7 O olhar começa no canto superior esquerdo, move-se horizontalmente para a direita, corta diagonalmente para o canto inferior esquerdo e finaliza horizontalmente à direita.

| Zona | Localização na Tela | Conteúdo Estratégico (Food Service) | Racional Psicológico |
| :---- | :---- | :---- | :---- |
| **Zona 1: A Âncora Primária** | **Canto Superior Esquerdo** | **CMV % (Custo Mercadoria) e Vendas Totais** | É o ponto de entrada. O usuário pergunta: "Vendi bem? Gastei muito?". Se o CMV estiver fora de controle, nada mais importa. |
| **Zona 2: Contexto Temporal** | **Canto Superior Direito** | **Seletores de Data e Filtros de Loja** | Após ver o número principal, o usuário busca confirmar o contexto: "Isso é hoje? Ontem? Mês passado?". |
| **Zona 3: A Narrativa Diagonal** | **Centro da Tela** | **Gráficos de Tendência (DRE Visual)** | O olhar cruza a tela buscando explicação. Aqui entram os gráficos que mostram a evolução das Vendas vs. Custos ao longo do tempo. |
| **Zona 4: O Detalhe Acionável** | **Inferior da Tela** | **Tabelas de Detalhe (Top 5 Desperdícios / Itens)** | O "final" da leitura. Se o usuário chegou até aqui, ele quer ver detalhes granulares: "Qual produto causou o aumento do CMV?". |

Este layout mimetiza a leitura ocidental e aproveita a "gravidade" natural da atenção. Colocar o CMV no canto inferior direito é um erro de design grave, pois obriga o usuário a "caçar" a informação mais vital.8

### **2.2 O Padrão em F (F-Pattern) para Relatórios Operacionais**

Para telas focadas em auditoria ou listas longas (ex: Análise de Mix de Produtos ou Inventário), o Padrão em F é mais adequado.7 O usuário escaneia a primeira linha horizontalmente, desce um pouco, escaneia uma linha menor, e depois desce verticalmente pelo lado esquerdo (a "espinha dorsal" do F).

**Aplicação Prática:**

Em um relatório de Engenharia de Cardápio:

* A coluna da esquerda deve conter os Nomes dos Pratos (a âncora).  
* As primeiras colunas de dados devem ser as mais importantes: Margem de Contribuição e Volume de Vendas.  
* Colunas secundárias (Custo Unitário, % Food Cost Teórico) ficam mais à direita.  
  O gestor "varre" a lista de pratos (vertical) e só entra na linha (horizontal) quando um item chama atenção.

### **2.3 A Regra dos 30 Segundos e o Espaço Negativo**

Um dashboard eficaz deve responder à pergunta "Estou ganhando dinheiro?" em menos de 30 segundos. Para isso, o uso do Espaço Negativo (White Space) é vital. O espaço em branco não é "espaço vazio"; é um elemento ativo de design que cria separação e foco.4

**Erro Comum:** O horror vacui (medo do vazio) leva designers a preencherem cada pixel com medidores, logotipos ou textos explicativos.

**Solução:** Aumentar as margens entre os cartões de KPI. Um dashboard com 6 números grandes e muito espaço branco é infinitamente mais acionável do que um com 20 métricas espremidas. O isolamento visual confere importância ao dado.

## ---

**3\. O Ecossistema de KPIs Visuais: Além do Velocímetro**

A escolha da visualização correta é onde a batalha pela clareza é vencida ou perdida. O pedido comum de donos de restaurantes por "velocímetros" (Gauges) deve ser resistido com argumentos técnicos baseados em eficiência de pixels e contexto.10

### **3.1 A Morte do Gráfico de Velocímetro (Gauge Chart)**

Embora popular por sua metáfora automotiva, o gráfico de velocímetro é severamente criticado por especialistas como Stephen Few.

* **Baixa Densidade de Dados:** Ele ocupa um espaço enorme na tela para exibir apenas um único número.  
* **Falta de Contexto Histórico:** Um velocímetro mostrando "Vendas" no verde pode ser enganoso. Se as vendas estão no verde, mas são 15% menores que na mesma sexta-feira do ano passado, o velocímetro esconde a crise.  
* **Ambiguidade:** A agulha no meio significa "médio" ou "na meta"? A interpretação varia.

### **3.2 A Alternativa Superior: O Bullet Graph (Gráfico de Bala)**

Para substituir o velocímetro, a recomendação padrão-ouro para finanças é o **Bullet Graph**.12 Ele condensa múltiplas camadas de informação em um espaço compacto (linear), ideal para visualizar o CMV.

**Anatomia de um Bullet Graph para CMV:**

1. **A Barra Principal (Preta/Escura):** O valor atual do CMV (ex: 32%).  
2. **A Marca de Alvo (Linha Vertical):** A meta ou orçamento (ex: 30%).  
3. **Faixas Qualitativas (Fundo):** Tons de cinza ou cores semânticas de fundo indicando faixas de desempenho.  
   * Fundo Verde Claro: 0% a 28% (Excelente).  
   * Fundo Amarelo Claro: 29% a 31% (Aceitável).  
   * Fundo Vermelho Claro: 32%+ (Crítico).

**Vantagem Narrativa:** O dono do restaurante pode ter uma lista de 10 categorias de inventário (Carnes, Laticínios, Bebidas, etc.) empilhadas em Bullet Graphs. Em um único relance (glanceability), ele vê quais barras pretas ultrapassaram a linha de meta e entraram na zona vermelha. É uma visualização de "exceção", permitindo foco imediato no problema.14

### **3.3 Visualizando o DRE: O Gráfico de Cascata (Waterfall Chart)**

O Demonstrativo de Resultados é, essencialmente, uma história de subtração. Você começa com todas as Vendas Brutas, e então vários "ladrões" (impostos, fornecedores, funcionários, aluguel) retiram pedaços desse valor até sobrar o Lucro Líquido. Tabelas falham em mostrar o impacto proporcional dessas deduções.

**Solução:** O Gráfico de Cascata é a representação visual definitiva para o DRE.15

* **Primeira Barra (Positiva/Verde):** Receita Bruta (o ponto mais alto).  
* **Barras Intermediárias (Negativas/Vermelhas):** CMV, Mão de Obra, Ocupação, Marketing. Elas "flutuam" descendo a partir do topo da anterior.  
* **Barra Final (Total/Azul):** O Lucro Líquido, aterrissando na linha base.

**Data Storytelling:** Esta visualização mostra fisicamente a "erosão" da receita. Se a barra vermelha do "CMV" for visualmente maior que a barra vermelha da "Mão de Obra", o gestor entende intuitivamente onde está o maior impacto no lucro, sem precisar fazer cálculos mentais de porcentagem.18

### **3.4 Sparklines: Contexto em Miniatura**

Um número isolado (ex: "Faturamento: R$ 5.000") carece de vetor. Está subindo ou descendo? **Aplicação:** Inserir **Sparklines** (minigráficos de linha sem eixos) dentro dos cartões de KPI.8 **Benefício:** Ao lado do valor de R$ 5.000, uma pequena linha denteada apontando para cima informa instantaneamente: "Hoje foi bom, e a tendência da semana é de alta". Isso adiciona a dimensão "Tempo" ao dado pontual.

## ---

**4\. Estratégia Cromática e Acessibilidade: Semântica das Cores**

A cor é a ferramenta mais poderosa de comunicação pré-atentiva, mas também a mais perigosa se mal utilizada. O uso indiscriminado de vermelho e verde (o padrão "semáforo") deve ser evitado por razões de acessibilidade e psicologia.

### **4.1 O Problema do Vermelho/Verde**

Aproximadamente 8% da população masculina (uma parcela significativa de chefs e proprietários) possui daltonismo (Deuteranopia), tornando difícil distinguir vermelho de verde.19 Além disso, o uso excessivo de vermelho cria "fadiga de alarme". Se tudo o que está 1% abaixo da meta fica vermelho brilhante, o dashboard parece estar gritando constantemente com o usuário, gerando ansiedade e dessensibilização.

### **4.2 Paleta Semântica Acessível e Profissional**

Recomenda-se o uso de uma paleta divergente **Azul/Laranja** ou **Turquesa/Vermelho-Alaranjado**, que mantém alto contraste e é legível para a maioria dos daltônicos.21

**Sugestão de Paleta (Códigos Hexadecimais):**

| Categoria Semântica | Cor Sugerida | Código Hex | Aplicação no Dashboard |
| :---- | :---- | :---- | :---- |
| **Neutro / Estrutura** | **Cinza Ardósia** | \#2C3E50 | Textos principais, eixos, títulos. |
| **Positivo / Receita** | **Verde Petróleo / Sálvia** | \#2E865F | Barras de receita, variância positiva, lucro. |
| **Negativo / Despesa** | **Laranja Queimado** | \#D35400 | Barras de despesa, perda, desperdício. |
| **Alerta Crítico** | **Vermelho Carmesim** | \#C0392B | **USAR COM PARSIMÔNIA.** Apenas para CMV \> 65% ou Prejuízo. |
| **Contexto / Meta** | **Cinza Frio** | \#95A5A6 | Linhas de meta, ano anterior, benchmarks. |
| **Fundo de Destaque** | **Off-White / Creme** | \#F9F9F9 | Fundo dos cartões de KPI para separá-los do fundo da tela. |

### **4.3 Intensidade como Indicador de Gravidade**

Em vez de mudar a cor (matiz), use a saturação (intensidade) para indicar gravidade.23

* **Laranja Claro:** Desvio leve do orçamento (Atenção).  
* **Laranja Escuro:** Desvio grave do orçamento (Ação Necessária).  
  Isso cria uma hierarquia visual onde os problemas mais graves "saltam" aos olhos devido à densidade da cor, guiando o foco do usuário para o incêndio maior.

## ---

**5\. Implementação Técnica: Power BI e Looker Studio**

Traduzir esses princípios teóricos para as ferramentas de mercado exige configurações específicas, já que os padrões de fábrica (defaults) dessas ferramentas frequentemente violam as melhores práticas de design.

### **5.1 Power BI: Superando as Limitações Nativas**

O Power BI é robusto, mas seus visuais nativos podem ser limitados para storytelling financeiro avançado.

* **Medidas DAX para Cores Dinâmicas:** Não pinte as colunas manualmente. Crie uma medida DAX que defina a cor baseada na lógica financeira: IF(\[Variação\] \< 0, "\#D35400", "\#2E865F"). Isso garante que a semântica visual se mantenha automática.  
* **Custom Visuals (Zebra BI ou Xviz):** Para gráficos de Cascata e Bullet Graphs profissionais, os visuais nativos podem ser insuficientes. Recomenda-se o uso de componentes como o Zebra BI, que segue o padrão IBCS (International Business Communication Standards), implementando automaticamente as melhores práticas de visualização de variância.17  
* **Tooltips (Dicas de Ferramenta) Narrativos:** Use a página de "Tooltip" do Power BI para contar a história. Quando o usuário passar o mouse sobre o "CMV Alto", não mostre apenas o número. Configure um tooltip que mostre a quebra desse CMV pelos top 5 ingredientes mais caros. Isso é "Drill-through" contextual.25

### **5.2 Looker Studio: Simplicidade e Layout**

O Looker Studio (antigo Data Studio) é excelente para layouts baseados em grade, mas exige cuidado com a performance.

* **Sistema de Grades (Grid):** Configure o canvas para um layout de 12 colunas. Isso permite agrupar KPIs em blocos de 3 ou 4 colunas, garantindo o alinhamento Gestalt perfeito.  
* **Workaround para Bullet Charts:** O Looker Studio tem suporte limitado para Bullet Graphs complexos. Uma solução é usar gráficos de barras empilhadas onde a "meta" é uma linha de referência e as "faixas de qualidade" são séries de dados fixas no fundo.26  
* **Desempenho de Dados:** Evite "blends" (mistura de dados) excessivos na própria camada de visualização, pois isso quebra a regra dos 30 segundos (tempo de carregamento). Prepare os dados no BigQuery ou Google Sheets antes de conectá-los ao dashboard.28

## ---

**6\. Data Storytelling: Do "O Quê" para o "E Agora?"**

Para um público não financeiro, o dado por si só é mudo. O dashboard precisa falar. Cole Nussbaumer Knaflic defende a transição da "Análise Exploratória" (deixar o usuário caçar insights) para a "Análise Explicatória" (entregar o insight pronto).29

### **6.1 O Arco Narrativo: O Que, E Daí, E Agora?**

Cada visualização deve guiar o dono do restaurante por três estágios mentais:

1. **O Quê (O Fato):** "O CMV está em 35%." (Visualizado pelo Bullet Graph).  
2. **E Daí? (O Contexto):** "Isso é 5 pontos percentuais acima da meta, o que representa R$ 2.000 de lucro perdido esta semana." (Visualizado por um texto de chamada ou cor de alerta).  
3. **E Agora? (A Ação):** "A alta é impulsionada pelo Filet Mignon. Verifique o porcionamento ou renegocie com o fornecedor." (Visualizado por uma tabela de detalhe adjacente).

### **6.2 Anotações e Texto como Elemento Visual**

Não tenha medo de usar texto. Em vez de deixar o usuário adivinhar por que há um pico no gráfico de vendas em maio, insira uma anotação direta no gráfico: "Dia das Mães \- Recorde de Público".

* **Recomendação:** Use caixas de texto dinâmicas que traduzam "Financeirês" para "Cozinhês".  
  * *Ruim:* "Variação negativa de insumos."  
  * *Bom:* "Alerta: Desperdício de Proteína equivalente a 40 pratos." Essa tradução humaniza o dado e conecta o número abstrato à realidade física da cozinha (o prato de comida).31

## ---

**7\. Melhores Práticas: Do's and Don'ts (O Que Fazer e O Que Evitar)**

Esta seção consolida a pesquisa em diretrizes acionáveis para a equipe de design.

### **O Que Fazer (Do's)**

* **USE Gráficos de Bala (Bullet Graphs):** Para todas as métricas que possuem uma meta clara (CMV, Mão de Obra, Vendas vs Budget). Eles economizam espaço e fornecem contexto imediato.10  
* **AGRUPE por Lógica de Negócio (Gestalt):** Coloque todas as métricas de Custo juntas e todas as de Venda juntas. Use o espaço em branco para separar esses grupos temáticos.1  
* **ADOTE uma Paleta Acessível:** Use Azul/Laranja ou Turquesa/Terracota para garantir que daltônicos possam distinguir o bom do ruim.19  
* **USE Gráficos de Cascata (Waterfall):** Para explicar a formação do lucro (DRE), mostrando visualmente onde a receita está sendo consumida.15  
* **ARREDONDE os Números:** O dono do restaurante não precisa saber que o faturamento foi "R$ 15.432,98". Mostre "R$ 15,4k". O excesso de precisão aumenta a carga cognitiva e retarda a leitura.5  
* **CONTEXTUALIZE com Ícones:** Use setas simples (▲/▼) ao lado dos números percentuais. A forma geométrica é processada mais rápido que a cor ou o texto.3

### **O Que Evitar (Don'ts)**

* **NÃO USE Velocímetros (Gauges):** Eles ocupam muito espaço, têm baixa densidade de informação e são difíceis de comparar lado a lado.11  
* **NÃO USE Gráficos de Pizza:** Especialmente para categorias com mais de 3 itens (ex: Mix de Vendas). O cérebro humano tem dificuldade em comparar ângulos. Use Gráficos de Barras horizontais ordenados por valor.33  
* **NÃO USE Vermelho/Verde Isoladamente:** Nunca confie apenas na cor para transmitir "bom" ou "ruim". Sempre acompanhe a cor com um indicador de posição ou ícone.  
* **NÃO POLUA com "Chart Junk":** Elimine efeitos 3D, sombras, degradês excessivos e linhas de grade pesadas. Se a tinta não representa dado, ela deve ser removida.1  
* **NÃO ESCONDA o Importante:** Não coloque o CMV ou o Lucro Líquido no canto inferior direito ou em uma aba secundária. Siga o Padrão em Z e coloque-os no topo esquerdo.7

## ---

**Conclusão**

O design de um dashboard financeiro para o setor de Food Service não é um exercício estético, mas sim um exercício de **empatia cognitiva**. O usuário final — o restaurateur — opera em um ambiente de alta entropia e baixo tempo de reflexão.

Ao aplicar rigorosamente os princípios da Gestalt (para agrupar e organizar), ao escolher visualizações de alta densidade como Bullet Graphs e Waterfalls (para contextualizar), e ao estruturar o layout seguindo os padrões naturais de leitura (Z-Pattern), transformamos o dashboard. Ele deixa de ser uma planilha glorificada para se tornar uma ferramenta narrativa.

A "história" que o dashboard conta não é sobre contabilidade; é sobre a realidade física do restaurante. Ele diz: "Você trabalhou muito (Vendas Altas), mas a cozinha desperdiçou carne (CMV Alto), por isso não sobrou dinheiro (Lucro Baixo)". Quando o design torna essa história óbvia em menos de 30 segundos, ele cumpre seu objetivo final: capacitar o dono do restaurante a voltar sua atenção para onde ela é mais valiosa — a experiência do cliente e a qualidade da comida.

#### **Referências citadas**

1. Applying Gestalt Principles to Dashboard Design \- Playfair Data, acessado em fevereiro 18, 2026, [https://playfairdata.com/applying-gestalt-principles-to-dashboard-design/](https://playfairdata.com/applying-gestalt-principles-to-dashboard-design/)  
2. How to apply the 6 Gestalt principles in a dashboard \- Data Organisation, acessado em fevereiro 18, 2026, [https://data-organisation.com/how-to-apply-the-6-gestalt-principles-in-a-dashboard/?lang=en](https://data-organisation.com/how-to-apply-the-6-gestalt-principles-in-a-dashboard/?lang=en)  
3. The Gestalt Principles: How to Use Them in Dashboard Design \- Hurree's Marketing Blog, acessado em fevereiro 18, 2026, [https://blog.hurree.co/this-psychology-principle-will-make-your-dashboards-more-powerful](https://blog.hurree.co/this-psychology-principle-will-make-your-dashboards-more-powerful)  
4. Do's and don'ts for Dashboard Design \- Think Design, acessado em fevereiro 18, 2026, [https://think.design/blog/dos-and-donts-for-dashboard-design/](https://think.design/blog/dos-and-donts-for-dashboard-design/)  
5. Book Review: Information Dashboard Design :: UXmatters, acessado em fevereiro 18, 2026, [https://www.uxmatters.com/mt/archives/2007/04/book-review-information-dashboard-design.php](https://www.uxmatters.com/mt/archives/2007/04/book-review-information-dashboard-design.php)  
6. Gestalt Principles for Visual UI Design \- UX Tigers, acessado em fevereiro 18, 2026, [https://www.uxtigers.com/post/gestalt-principles](https://www.uxtigers.com/post/gestalt-principles)  
7. Z-Pattern vs F-Pattern: Which Layout Should You Use and When? | by Farida Fa'ijati, acessado em fevereiro 18, 2026, [https://medium.com/@faridafaijati/z-pattern-vs-f-pattern-which-layout-should-you-use-and-when-be1da6d9c035](https://medium.com/@faridafaijati/z-pattern-vs-f-pattern-which-layout-should-you-use-and-when-be1da6d9c035)  
8. BI Dashboards: Visualisation Techniques And Design Elements \- QMetrix, acessado em fevereiro 18, 2026, [https://qmetrix.com.au/bi-dashboards-visualisation-techniques-design-elements-and-screen-real-estate/](https://qmetrix.com.au/bi-dashboards-visualisation-techniques-design-elements-and-screen-real-estate/)  
9. Visual Hierarchy: Organizing content to follow natural eye movement patterns | IxDF, acessado em fevereiro 18, 2026, [https://www.interaction-design.org/literature/article/visual-hierarchy-organizing-content-to-follow-natural-eye-movement-patterns](https://www.interaction-design.org/literature/article/visual-hierarchy-organizing-content-to-follow-natural-eye-movement-patterns)  
10. Why bullet graphs pack more punch than gauge charts \- Tableau, acessado em fevereiro 18, 2026, [https://www.tableau.com/blog/bullet-graphs-beat-gauge-charts](https://www.tableau.com/blog/bullet-graphs-beat-gauge-charts)  
11. From gauges to bullet graphs \- graphomate, acessado em fevereiro 18, 2026, [https://www.graphomate.com/en/2014/09/from-gauges-to-bullet-graphs/](https://www.graphomate.com/en/2014/09/from-gauges-to-bullet-graphs/)  
12. Understanding and Using Bullet Graphs \- Tableau, acessado em fevereiro 18, 2026, [https://www.tableau.com/chart/what-is-bullet-graph](https://www.tableau.com/chart/what-is-bullet-graph)  
13. An Alternative Design of Bullet Graphs \- Clearly and Simply, acessado em fevereiro 18, 2026, [https://www.clearlyandsimply.com/2017/05/an-alternative-design-of-bullet-graphs/](https://www.clearlyandsimply.com/2017/05/an-alternative-design-of-bullet-graphs/)  
14. Visual Business Intelligence – Bullet Graphs for Not-to-Exceed Targets \- Perceptual Edge, acessado em fevereiro 18, 2026, [https://www.perceptualedge.com/blog/?p=217](https://www.perceptualedge.com/blog/?p=217)  
15. When Waterfall Charts Are The Best Option For Data Visualization Reporting | Sigma, acessado em fevereiro 18, 2026, [https://www.sigmacomputing.com/blog/waterfall-charts-data-visualization](https://www.sigmacomputing.com/blog/waterfall-charts-data-visualization)  
16. Waterfall chart reference | Looker Studio \- Google Cloud Documentation, acessado em fevereiro 18, 2026, [https://docs.cloud.google.com/looker/docs/studio/waterfall-chart-reference](https://docs.cloud.google.com/looker/docs/studio/waterfall-chart-reference)  
17. Enhance Power BI Financial Reporting with Inforiver Analytics+ Waterfall Charts, acessado em fevereiro 18, 2026, [https://inforiver.com/blog/inforiver-analytics-plus/power-bi-financial-reporting-with-waterfall-charts/](https://inforiver.com/blog/inforiver-analytics-plus/power-bi-financial-reporting-with-waterfall-charts/)  
18. Power BI WATERFALL CHART: MasterClass\!\!\! \- YouTube, acessado em fevereiro 18, 2026, [https://www.youtube.com/watch?v=CdWvOsM5cmc](https://www.youtube.com/watch?v=CdWvOsM5cmc)  
19. 5 Tips on Designing Colorblind-Friendly Visualizations \- Tableau, acessado em fevereiro 18, 2026, [https://www.tableau.com/blog/examining-data-viz-rules-dont-use-red-green-together](https://www.tableau.com/blog/examining-data-viz-rules-dont-use-red-green-together)  
20. Accessible Color Palette Generator | WCAG Compliant \- Venngage, acessado em fevereiro 18, 2026, [https://venngage.com/tools/accessible-color-palette-generator](https://venngage.com/tools/accessible-color-palette-generator)  
21. Best Color Palettes for Financial Dashboards \- Phoenix Strategy Group, acessado em fevereiro 18, 2026, [https://www.phoenixstrategy.group/blog/best-color-palettes-for-financial-dashboards](https://www.phoenixstrategy.group/blog/best-color-palettes-for-financial-dashboards)  
22. Using our colour palettes in Microsoft, R and Python \- Government Analysis Function, acessado em fevereiro 18, 2026, [https://analysisfunction.civilservice.gov.uk/policy-store/codes-for-accessible-colours/](https://analysisfunction.civilservice.gov.uk/policy-store/codes-for-accessible-colours/)  
23. 7 Best Practices for Using Color in Data Visualizations \- Sigma Computing, acessado em fevereiro 18, 2026, [https://www.sigmacomputing.com/blog/7-best-practices-for-using-color-in-data-visualizations](https://www.sigmacomputing.com/blog/7-best-practices-for-using-color-in-data-visualizations)  
24. Top 21 Power BI Dashboard Examples for Finance and Accounting \- GrowExx, acessado em fevereiro 18, 2026, [https://www.growexx.com/blog/top-power-bi-dashboard-examples-for-finance-and-accounting/](https://www.growexx.com/blog/top-power-bi-dashboard-examples-for-finance-and-accounting/)  
25. Dashboard Design: 7 Best Practices & Examples \- Qlik, acessado em fevereiro 18, 2026, [https://www.qlik.com/us/dashboard-examples/dashboard-design](https://www.qlik.com/us/dashboard-examples/dashboard-design)  
26. Creating a bullet chart with the Chart Config Editor | Looker \- Google Cloud Documentation, acessado em fevereiro 18, 2026, [https://docs.cloud.google.com/looker/docs/bullet-chart](https://docs.cloud.google.com/looker/docs/bullet-chart)  
27. Create Bullet and Gauge Charts on Looker Studio to Set and Visualize Goals (2026), acessado em fevereiro 18, 2026, [https://www.youtube.com/watch?v=dqgPI7Fmhn4](https://www.youtube.com/watch?v=dqgPI7Fmhn4)  
28. Considerations when building performant Looker dashboards, acessado em fevereiro 18, 2026, [https://docs.cloud.google.com/looker/docs/best-practices/considerations-when-building-performant-dashboards](https://docs.cloud.google.com/looker/docs/best-practices/considerations-when-building-performant-dashboards)  
29. order our newest book, storytelling with data: before & after, acessado em fevereiro 18, 2026, [https://www.storytellingwithdata.com/books](https://www.storytellingwithdata.com/books)  
30. Book Summary \- Storytelling with Data \- Cole Knaflic \- Readingraphics, acessado em fevereiro 18, 2026, [https://readingraphics.com/book-summary-storytelling-with-data/](https://readingraphics.com/book-summary-storytelling-with-data/)  
31. Profits and Loss: The P\&L Story \- Shamrock Foods, acessado em fevereiro 18, 2026, [https://www.shamrockfoodservice.com/business-insights/profits-and-loss-the-pl-story/](https://www.shamrockfoodservice.com/business-insights/profits-and-loss-the-pl-story/)  
32. How to Understand Restaurant PL Like a Chef \- Culinary Business Strategy, acessado em fevereiro 18, 2026, [https://www.culinarybusinessstrategy.com/how-to-understand-restaurant-pl-like-a-chef/](https://www.culinarybusinessstrategy.com/how-to-understand-restaurant-pl-like-a-chef/)  
33. The Dos and Don'ts of Dashboard Design | by Payal Patel | TDS Archive | Medium, acessado em fevereiro 18, 2026, [https://medium.com/data-science/the-dos-and-donts-of-dashboard-design-2beefd5cc575](https://medium.com/data-science/the-dos-and-donts-of-dashboard-design-2beefd5cc575)