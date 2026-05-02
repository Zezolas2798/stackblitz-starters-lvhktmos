<h1>Arquitetura de Custos e Engenharia de Produto para SaaS em UAN: Modelagem Matemática e Financeira</h1><p>A engenharia de cardápio e a gestão de custos em Unidades de Alimentação e Nutrição (UAN) representam o núcleo operacional crítico de qualquer serviço de alimentação coletiva, catering e restaurantes industriais. A transposição da teoria acadêmica, dietética e financeira para uma arquitetura de software (SaaS) exige um rigor matemático absoluto, garantindo que as lógicas de banco de dados reflitam com exatidão a termodinâmica dos alimentos, o comportamento físico-químico dos insumos durante o processamento e a complexidade da malha tributária brasileira.</p><p>Neste contexto, a espinha dorsal de qualquer sistema de gestão gastronômica é a Ficha Técnica de Preparo (FTP). A literatura especializada e as diretrizes de governança em saúde pública determinam que a FTP transcende a função de um simples receituário empírico; ela atua como um instrumento gerencial de controle de qualidade, rastreabilidade de custos e promoção da saúde (AKUTSU et al., 2005).<sup>1</sup> O desenvolvimento de um módulo financeiro e de engenharia de produto para <em>food service</em> requer a profunda compreensão de que os insumos sofrem drásticas transformações dimensionais — perdas por limpeza, ganhos por hidratação, perdas por cocção, e absorção de lipídios —, variáveis que impactam de forma implacável o Custo da Mercadoria Vendida (CMV) e as metodologias de precificação de contratos (ATENAS, 2021).<sup>3</sup></p><p>Este relatório técnico consolida as formulações matemáticas padrão-ouro, as metodologias de custeio e as diretrizes de regra de negócio (business rules) indispensáveis para a programação do <em>backend</em> de um ERP ou SaaS voltado à alta gastronomia industrial e refeições coletivas de grande escala.</p><h2>1. Fórmulas de Rendimento (FC, IC, Absorção) com exemplos numéricos</h2><p>A precisão analítica e financeira do banco de dados de um SaaS para UAN depende fundamentalmente da correta parametrização dos índices de rendimento. Os alimentos <em>in natura</em> raramente são consumidos em sua totalidade ou mantêm seu peso original após o processamento térmico e mecânico (ORNELLAS, 2014).<sup>5</sup> Para o desenvolvimento do algoritmo de dimensionamento de compras e custeio, é imperativo mapear três variáveis físico-químicas que incidem diretamente sobre o <em>per capita</em> — definido como a quantidade de alimento necessária para satisfazer as necessidades nutricionais de um indivíduo em uma refeição (GARCIA et al., 2014).<sup>6</sup></p><h3>Fator de Correção (FC) ou Indicador de Parte Comestível (IPC)</h3><p>O Fator de Correção (FC) é o índice matemático que quantifica e prevê as perdas inevitáveis que ocorrem durante as etapas de pré-preparo dos alimentos, tais como descascamento, desossa, evisceração, retirada de aparas, sementes, talos e sujidades (ORNELLAS, 2014).<sup>5</sup> Trata-se da relação direta e proporcional entre o alimento na forma como é adquirido (Peso Bruto) e o alimento processado e pronto para a cocção (Peso Líquido).</p><p>Do ponto de vista algorítmico e de modelagem de dados relacionais, o FC atua como um multiplicador obrigatório no módulo de planejamento de compras (ATENAS, 2021).<sup>4</sup> Se o sistema ignora o Fator de Correção ou permite o cadastro de valores irrealistas, a UAN invariavelmente enfrentará rupturas de estoque (falta de comida na rampa de distribuição) ou subfaturamento de custos operacionais (comprando mais do que o custo alocado no contrato prevê).</p><p>A equação matemática padrão-ouro para a determinação do Fator de Correção é expressa por:</p><p>
[IMAGEM_REMOVIDA]
</p><p>Onde:</p><ul><li>
[IMAGEM_REMOVIDA]
 = Fator de Correção. Este valor será sempre 
[IMAGEM_REMOVIDA]
 para alimentos <em>in natura</em> que sofrem perdas; será rigorosamente igual a 
[IMAGEM_REMOVIDA]
 para alimentos industrializados prontos para uso (ex: leite condensado, requeijão) (ORNELLAS, 2014).<sup>5</sup></li><li><sup>
[IMAGEM_REMOVIDA]
</sup> = Peso Bruto (massa do alimento na forma como é adquirido do fornecedor e registrado na Nota Fiscal, em gramas ou quilogramas).</li><li>
[IMAGEM_REMOVIDA]
 = Peso Líquido (massa do alimento após as etapas de limpeza e pré-preparo, limpo e pronto para cocção ou consumo, em gramas ou quilogramas).</li></ul><p>Alguns teóricos e sistemas legados utilizam o conceito de Indicador de Parte Comestível (IPC), que é essencialmente o inverso matemático do FC, expresso em percentual de aproveitamento:</p><p>
[IMAGEM_REMOVIDA]
</p><p><strong>Lógica de Código e Arquitetura para SaaS:</strong></p><p>No momento de processar uma <em>query</em> para escalar uma FTP para 
[IMAGEM_REMOVIDA]
 comensais, o software deve partir do <em>per capita líquido</em> (a porção limpa estipulada pelo nutricionista que o cliente vai efetivamente consumir). Para gerar a Ordem de Compra de forma automatizada, a fórmula deve ser revertida no código:</p><p>
[IMAGEM_REMOVIDA]
</p><p><strong>Exemplo Numérico e Impacto Financeiro Direto:</strong></p><p>Suponha que uma UAN precise preparar uma FTP de "Filé Mignon Suíno ao Molho Pardo". O engenheiro de cardápio estipula um <em>per capita líquido</em> de 
[IMAGEM_REMOVIDA]
 (peso totalmente limpo, sem gorduras excessivas ou aponeuroses). A previsão de produção diária do contrato é de 2.000 refeições. Historicamente, através de testes de rendimento cadastrados no sistema, a UAN aferiu que ao limpar uma peça de 
[IMAGEM_REMOVIDA]
 de filé mignon suíno bruto, restam 
[IMAGEM_REMOVIDA]
 de carne limpa.</p><ol><li>Cálculo do FC a ser gravado no banco de dados (Tabela de Insumos):<br />
[IMAGEM_REMOVIDA]
</li><li>Cálculo da Necessidade de Produção (Peso Líquido Total exigido pela cozinha):<br />
[IMAGEM_REMOVIDA]
</li><li>Cálculo da Ordem de Compra via Sistema (Peso Bruto Total a faturar no fornecedor):<br />
[IMAGEM_REMOVIDA]
</li></ol><p>Neste cenário, se o custo do quilograma bruto pago ao fornecedor é de 
[IMAGEM_REMOVIDA]
, o algoritmo de custeio não pode considerar 
[IMAGEM_REMOVIDA]
 como o custo da carne na FTP. O custo real da porção limpa (Custo Líquido) que o software deve embutir na precificação é indexado pelo Fator de Correção:</p><p>
[IMAGEM_REMOVIDA]
</p><p>Uma falha de arquitetura que utilize o peso bruto sem o indexador de correção para calcular o custo da porção geraria um prejuízo oculto massivo, corroendo a margem de contribuição do contrato de forma silenciosa e letal.</p><h3>Índice de Cocção (IC) ou Fator de Rendimento</h3><p>Enquanto o FC lida com perdas mecânicas a frio, o Índice de Cocção (IC) ou Fator de Rendimento Térmico avalia a alteração de peso do alimento decorrente da aplicação de energia térmica. Este índice reflete a dinâmica de fluidos nos tecidos biológicos: a perda de líquidos por exsudação, fusão de lipídios e retração de fibras (no caso de proteínas animais e hortaliças) ou o ganho de peso exponencial por hidratação e gelatinização do amido (no caso de cereais e leguminosas secas) (ORNELLAS, 2014).<sup>5</sup></p><p>O rigoroso controle sistêmico desse índice permite que o gestor da UAN saiba exatamente o peso final da porção que irá para a cuba de distribuição (o <em>réchaud</em> do <em>self-service</em>) ou para a montagem de marmitas térmicas.</p><p>A fórmula padrão estabelecida pela técnica dietética é:</p><p>
[IMAGEM_REMOVIDA]
</p><p>Onde:</p><ul><li>
[IMAGEM_REMOVIDA]
 = Índice de Cocção. Se o resultado for 
[IMAGEM_REMOVIDA]
, significa que houve hidratação/ganho de peso (ex: arroz, feijão, massas). Se o resultado for 
[IMAGEM_REMOVIDA]
, ocorreu desidratação/perda de peso e estrutura (ex: carnes assadas, grelhados, vegetais salteados) (ORNELLAS, 2014).<sup>5</sup></li><li><sup>
[IMAGEM_REMOVIDA]
</sup> = Peso Cozido (massa do alimento final após o término do processamento térmico).</li><li>
[IMAGEM_REMOVIDA]
 = Peso Líquido Cru (massa do alimento já limpo imediatamente antes de ser submetido ao calor).</li></ul><p>Para referenciar o banco de dados inicial do SaaS (valores default), a literatura clássica de Ornellas e Akutsu sugere os seguintes parâmetros base de conversão térmica (ORNELLAS, 2014) <sup>5</sup>:</p><table><thead><tr><th><p><strong>Categoria do Alimento</strong></p></th><th><p><strong>Tipo de Cocção / Características</strong></p></th><th><p><strong>Índice de Cocção Estimado (IC)</strong></p></th><th><p><strong>Efeito Físico</strong></p></th></tr><tr><th><p>Carnes bovinas/suínas</p></th><th><p>Com muita gordura (ex: costela, pernil)</p></th><th><p>0,40 a 0,50</p></th><th><p>Extrema retração</p></th></tr><tr><th><p>Carnes bovinas/aves</p></th><th><p>Com pouca gordura (ex: peito, patinho)</p></th><th><p>0,60 a 0,70</p></th><th><p>Retração moderada</p></th></tr><tr><th><p>Cereais (Arroz, milho)</p></th><th><p>Ebulição em água</p></th><th><p>2,00 a 3,00</p></th><th><p>Ganho de peso (Hidratação)</p></th></tr><tr><th><p>Leguminosas (Feijão)</p></th><th><p>Pressão em água</p></th><th><p>2,00 a 3,00</p></th><th><p>Ganho de peso (Hidratação)</p></th></tr><tr><th><p>Hortaliças folhosas</p></th><th><p>Refogado contínuo (Calor misto)</p></th><th><p>0,40 a 0,50</p></th><th><p>Perda de água estrutural</p></th></tr></thead></table><p><strong>Lógica de Código e Arquitetura para SaaS:</strong> A engenharia de cardápio nas UANs modernas geralmente opera de "frente para trás" (<em>backward scheduling</em>). A FTP é montada e validada pelo cliente (o contratante do refeitório) definindo-se a <em>porção final servida</em> no prato (Peso Cozido Per Capita). O algoritmo deve retroceder matematicamente para descobrir o Peso Líquido e, subsequentemente, acionar a rotina do Fator de Correção para achar o Peso Bruto (ATENAS, 2021).<sup>4</sup> A sequência algorítmica imperativa deve ser:</p><ol><li>Determinação do Peso Líquido Cru necessário:<br />
[IMAGEM_REMOVIDA]
</li><li>Determinação do Peso Bruto de Compra:<br />
[IMAGEM_REMOVIDA]
</li></ol><p><strong>Exemplo Numérico e Análise de Desvio Operacional:</strong> O contrato reza que a UAN deve fornecer porções exatas de 
[IMAGEM_REMOVIDA]
 de contra-filé em bifes grelhados para 1.500 operários siderúrgicos. O contra-filé possui um 
[IMAGEM_REMOVIDA]
 parametrizado no banco de dados de 
[IMAGEM_REMOVIDA]
 (retirada de cordão, espelho e excesso de gordura externa) e um 
[IMAGEM_REMOVIDA]
 de 
[IMAGEM_REMOVIDA]
 (perda de água intracelular e gotejamento de gordura na chapa - calor seco) (ORNELLAS, 2014).<sup>5</sup></p><ol><li>Para obter exatamente 
[IMAGEM_REMOVIDA]
 cozidos no prato do operário, qual o Peso Líquido cru de cada bife que o açougueiro deve padronizar?<br />
[IMAGEM_REMOVIDA]
</li><li>Para obter 
[IMAGEM_REMOVIDA]
 de carne limpa, qual o Peso Bruto de compra necessário por pessoa?<br />
[IMAGEM_REMOVIDA]
</li><li>Ordem de Compra Automática do Sistema para as 1.500 refeições daquele turno:<br />
[IMAGEM_REMOVIDA]
</li></ol><p>A ausência desse encadeamento rigoroso na arquitetura de software fatalmente resultará na falta crônica de proteína principal na linha de distribuição (gerando quebra de contrato e multas severas à UAN) ou na oferta de gramaturas abaixo do licitado (configurando fraude alimentar).</p><h3>Fator de Absorção de Óleo</h3><p>Nos processos de fritura por imersão (calor seco com veículo lipídico), ocorre uma troca de massa em via de mão dupla: os alimentos desidratam (perdem água sob a forma de vapor, gerando a crosta crocante) e, simultaneamente, absorvem moléculas de gordura em sua matriz porosa (ORNELLAS, 2014).<sup>10</sup> O custo financeiro dessa gordura absorvida é frequentemente negligenciado, subestimado ou inserido através de estimativas rústicas em <em>softwares</em> genéricos de restaurante, o que oblitera a acurácia do Custo da Mercadoria Vendida (CMV). O cálculo rigoroso da engenharia de produção exige a quantificação exata da absorção para diluir o custo unitário do óleo no preço da porção.</p><p>O Fator de Absorção de Óleo (
[IMAGEM_REMOVIDA]
) pode ser expresso em percentual de absorção relativo ao peso cru do alimento principal que está sendo frito:</p><p>
[IMAGEM_REMOVIDA]
</p><p>Como, na prática ruidosa de uma cozinha industrial, medir o peso exato de gotículas de óleo dentro da estrutura de uma batata frita é impossível, a engenharia de produção utiliza o método de equivalência volumétrica e de massa por diferença na fritadeira:</p><p>
[IMAGEM_REMOVIDA]
</p><p>O custo embutido que o SaaS deverá alocar na Ficha Técnica de Preparo será calculado por:</p><p>
[IMAGEM_REMOVIDA]
</p><p><strong>Exemplo Numérico de Apuração e Custeio:</strong></p><p>Uma UAN operou a fritura de 
[IMAGEM_REMOVIDA]
 de iscas de frango empanado cruas (Peso Líquido). O encarregado abasteceu as cubas da fritadeira com 
[IMAGEM_REMOVIDA]
 de óleo de algodão. Após o ciclo de fritura daquele lote, coou-se o óleo restante para medição, constatando-se a sobra física de 
[IMAGEM_REMOVIDA]
. Houve o descarte de 
[IMAGEM_REMOVIDA]
 de resíduos sólidos (borra de empanamento retida no filtro e água residual decantada).</p><ol><li>Apuração da massa de óleo efetivamente retida no alimento:<br />
[IMAGEM_REMOVIDA]
</li><li>Determinação do Fator de Absorção:<br />
[IMAGEM_REMOVIDA]
</li></ol><p>No <em>backend</em> do SaaS, o comportamento arquitetural deve ser o seguinte: para cada 
[IMAGEM_REMOVIDA]
 de isca de frango crua processada na Ficha Técnica, o sistema deve adicionar autonomamente 
[IMAGEM_REMOVIDA]
 de óleo à composição de custos da receita. Essa amarração deve ocorrer no banco de dados de forma oculta (<em>under the hood</em>), mesmo que o cozinheiro não declare o óleo como um "ingrediente ativo" da receita. Essa automação sistêmica eleva o nível do ERP e garante um custo teórico impecável, impedindo evasão de lucros.</p><h2>2. Cálculo do CMV em UAN</h2><p>O Custo da Mercadoria Vendida (CMV) em serviços de alimentação coletiva e <em>food service</em> industrial figura como o Indicador Chave de Desempenho (KPI) financeiro absoluto. Ele representa o valor monetário global de todos os insumos (comida e bebida) que foram efetivamente consumidos para gerar a receita financeira de um determinado período (KONCLUI, 2025).<sup>11</sup> A maestria no controle do CMV é o divisor de águas que determina a viabilidade econômica do restaurante industrial.</p><p>A literatura de gestão gastronômica e os <em>benchmarks</em> da indústria de <em>facilities</em> estipulam que o CMV deve operar idealmente na faixa de <strong>27% a 33%</strong> do Faturamento Bruto, configurando zona de excelência. Sob nenhuma hipótese gerencial um CMV sustentável pode ultrapassar o teto crítico de <strong>40%</strong>, ponto a partir do qual a margem operacional se desintegra frente aos altos custos fixos (mão de obra e estrutura) típicos do setor (KONCLUI, 2025).<sup>11</sup></p><p>A arquitetura financeira do software deve, de forma inflexível, bifurcar a apuração do CMV em duas vertentes analíticas interconectadas, permitindo a conciliação contábil: O CMV Teórico (Padrão ou Orçamentário) e o CMV Real (Global Praticado) (ZANINI et al., 2020).<sup>16</sup></p><h3>CMV Teórico (Padrão e Orçamentário)</h3><p>O CMV Teórico é o custo prospectivo e calculado <em>a priori</em>, extraído unicamente da matriz estruturada das Fichas Técnicas de Preparo. Ele baseia-se na premissa algorítmica de um cenário perfeito: zero furtos, zero deterioração no estoque, precisão milimétrica nos cortes do açougue, e comensais consumindo porções exatamente iguais ao <em>per capita</em> projetado (ZANINI et al., 2020).<sup>18</sup></p><p>A fórmula do CMV Teórico Total de um turno, dia ou mês é a somatória do produto do número de refeições vendidas pelo custo unitário de suas respectivas FTPs:</p><p>
[IMAGEM_REMOVIDA]
</p><p>Onde o 
[IMAGEM_REMOVIDA]
 já embute todos os indexadores discutidos na Seção 1 (insumos ajustados por FC, IC e absorções de gordura) (ZANINI et al., 2020).<sup>18</sup></p><p>Este indicador serve primariamente como um <em>Compliance de Budget</em> (Orçamento). Por exemplo, se uma montadora de veículos (cliente) contrata a UAN exigindo uma refeição a 
[IMAGEM_REMOVIDA]
 (Preço de Venda) e a concessionária impôs à sua equipe de nutrição um <em>target</em> de CMV de 
[IMAGEM_REMOVIDA]
, o sistema SaaS deve gerar um gatilho de bloqueio e alerta visual se a composição das FTPs daquela semana ultrapassar o 
[IMAGEM_REMOVIDA]
 limite de 
[IMAGEM_REMOVIDA]
 (
[IMAGEM_REMOVIDA]
).</p><h3>CMV Real (Global Praticado) e Curva ABC</h3><p>O CMV Real é a constatação fática e implacável do consumo de mercadorias. Diferente do Teórico, ele ignora o que "deveria ter sido" na Ficha Técnica; baseia-se puramente na movimentação físico-financeira real da operação (notas fiscais contrapostas aos saldos de estoque físicos) num dado período (geralmente ciclos semanais ou mensais) (ZANINI et al., 2020).<sup>21</sup></p><p>A fórmula padrão global para a apuração contábil e apuração de resultados (DRE) do CMV é (KONCLUI, 2025) <sup>11</sup>:</p><p>
[IMAGEM_REMOVIDA]
</p><p>Onde:</p><ul><li>
[IMAGEM_REMOVIDA]
 = Estoque Inicial (Valor financeiro de todos os insumos nas prateleiras e câmaras frias no primeiro minuto do dia de abertura do período analisado) (ZANINI et al., 2020).<sup>21</sup></li><li><sup>
[IMAGEM_REMOVIDA]
</sup> = Compras / Entradas (Valor financeiro de todas as Notas Fiscais de entrada registradas no sistema ao longo do período, acrescido de fretes se aplicável).</li><li>
[IMAGEM_REMOVIDA]
 = Estoque Final (Valor financeiro total levantado pelo inventário cego ou varredura de código de barras no último dia do período).</li></ul><p>Para indexar a eficiência financeira, o CMV é expresso percentualmente sobre a Receita Bruta (
[IMAGEM_REMOVIDA]
) ou Faturamento (KONCLUI, 2025) <sup>11</sup>:</p><p>
[IMAGEM_REMOVIDA]
</p><p><strong>Exemplo Numérico Integrado:</strong></p><p>No dia 1º do mês, a contagem de estoque da UAN apontou 
[IMAGEM_REMOVIDA]
 em mercadorias (
[IMAGEM_REMOVIDA]
). Durante as quatro semanas, o módulo de suprimentos acusou o processamento de 
[IMAGEM_REMOVIDA]
 em mercadorias entregues por fornecedores (
[IMAGEM_REMOVIDA]
). No dia 30, o inventário finalizou o balanço registrando 
[IMAGEM_REMOVIDA]
 estocados (
[IMAGEM_REMOVIDA]
). O faturamento emitido em boletos para a empresa contratante foi de 
[IMAGEM_REMOVIDA]
 (
[IMAGEM_REMOVIDA]
).</p><ol><li>Apuração Monetária do Custo:<br />
[IMAGEM_REMOVIDA]
</li><li>Apuração Percentual da Eficiência:<br />
[IMAGEM_REMOVIDA]
</li></ol><p>O resultado de 
[IMAGEM_REMOVIDA]
 atesta que a gestão de suprimentos e produção manteve a UAN dentro da faixa estrita de rentabilidade e excelência preconizada pelo setor de <em>food service</em> corporativo (KONCLUI, 2025).<sup>14</sup></p><p><strong>Métodos de Valoração de Estoque no SaaS:</strong> O valor monetário do 
[IMAGEM_REMOVIDA]
 e do 
[IMAGEM_REMOVIDA]
 não é estático devido à inflação de gêneros alimentícios. A arquitetura do SaaS deve obrigatoriamente permitir a parametrização do método de valoração de estoque, sendo os mais críticos na gestão de suprimentos (ATENAS, 2021) <sup>4</sup>:</p><ul><li><strong>PEPS (Primeiro que Entra, Primeiro que Sai):</strong> Utiliza o custo do lote mais antigo. Mandatório do ponto de vista de vigilância sanitária (PVPS - Primeiro que Vence, Primeiro que Sai) e reflete um estoque final valorizado aos preços mais recentes (ATENAS, 2021).<sup>4</sup></li><li><strong>Custo Médio Ponderado Móvel (CMPM):</strong> O método mais utilizado pela contabilidade tributária brasileira. A cada nova entrada de Nota Fiscal, o software recalcula o preço médio do quilo do ingrediente, suavizando os picos inflacionários (ZANINI et al., 2020).<sup>17</sup></li><li><strong>Gestão de Estoque por Curva ABC:</strong> O SaaS deve ranquear os itens usando o Princípio de Pareto (80/20), focando o controle de inventário severo nos insumos Classe A (carnes nobres, laticínios), que detêm o maior impacto financeiro no CMV (ATENAS, 2021).<sup>4</sup></li></ul><h3>Conciliação Financeira: Real vs. Teórico (Desvio e Eficiência)</h3><p>O maior diferencial analítico que um SaaS avançado para UAN pode entregar à controladoria financeira é o "Relatório de Desvio de CMV" ou <em>Food Cost Variance</em>. O desvio é a métrica absoluta que desnuda a ineficiência, o amadorismo ou a corrupção dentro do complexo produtivo (ZANINI et al., 2020).<sup>16</sup></p><p><sup>
[IMAGEM_REMOVIDA]
</sup></p><table><thead><tr><th><p><strong>Cenário Analítico Mensal</strong></p></th><th><p><strong>Valor Monetário</strong></p></th><th><p><strong>Percentual sobre Receita</strong></p></th><th><p><strong>Significado Estratégico</strong></p></th></tr><tr><th><p>Receita Bruta (Faturamento)</p></th><th><p>R$ 160.000,00</p></th><th><p>100,0%</p></th><th><p>Base financeira</p></th></tr><tr><th><p>
[IMAGEM_REMOVIDA]
 (Projeto via FTP)</p></th><th><p>R$ 42.000,00</p></th><th><p>26,25%</p></th><th><p>Custo estritamente projetado</p></th></tr><tr><th><p>
[IMAGEM_REMOVIDA]
 (Inventário Físico)</p></th><th><p>R$ 48.000,00</p></th><th><p>30,00%</p></th><th><p>Custo fático desembolsado</p></th></tr><tr><th><p><strong>Desvio de CMV (Gap)</strong></p></th><th><p><strong>R$ 6.000,00</strong></p></th><th><p><strong>3,75%</strong></p></th><th><p><strong>Sangria de Margem de Lucro</strong></p></th></tr></thead></table><p>Neste cenário de um desvio de R$ 6.000,00 entre a teoria e a prática, a arquitetura do software deve oferecer a ferramenta de <em>Drill-Down</em> (mineração de dados) para que o gestor investigue as anomalias, categorizadas em quatro pilares (ZANINI et al., 2020) <sup>16</sup>:</p><ol><li><strong>Desperdício Operacional e Fator de Correção corrompido:</strong> Os manipuladores estão executando cortes de má qualidade, descartando polpa e carne junto com cascas e ossos, fazendo com que o FC real seja maior que o cadastrado. O software identifica isso se a requisição física de quilos do almoxarifado estiver muito superior ao projetado.</li><li><strong>Superprodução e Sobra Suja (Resto-Ingestão):</strong> O planejamento previu 
[IMAGEM_REMOVIDA]
 pratos, mas a cozinha produziu 
[IMAGEM_REMOVIDA]
, e o excedente foi sumariamente descartado (ZANINI et al., 2020).<sup>20</sup></li><li><strong>Variação de Preço de Compra (Erro de Suprimentos):</strong> A engenharia de produto projetou a FTP com o Custo Padrão. No entanto, o departamento de compras homologou pedidos emergenciais com valor unitário acima do previsto. O SaaS deve emitir um alerta de <em>Variância de Preço de Compra</em>.</li><li><strong>Furtos, Desvios e Falha no Recebimento:</strong> O <em>gap</em> não justificado por perdas no processo ou inflação denota roubo de mercadorias do estoque ou recebimento "cego" (assinar a nota sem conferir se o fornecedor entregou os pesos exatos) (ZANINI et al., 2020).<sup>16</sup></li></ol><h2>3. Metodologias de Precificação</h2><p>Precificar milhões de refeições em uma Unidade de Alimentação e Nutrição está longe de possuir a elasticidade de preços inerente a restaurantes comerciais do varejo tradicional (<em>À la carte</em> ou <em>Fast Food</em>). Nos serviços industriais, hospitais, presídios e refeitórios corporativos, o preço unitário (ticket) é rotineiramente submetido a rigorosos processos de licitação e concorrência comercial (B2B). Trata-se de uma dinâmica pautada em contratos engessados, altíssimo volume diário (escala) e margens de lucro espremidas em centavos (ATENAS, 2021).<sup>4</sup></p><p>Portanto, o <em>engine</em> de precificação do SaaS precisa obrigatoriamente conciliar, de modo complementar, duas consagradas metodologias financeiras: a formação técnica do preço de venda baseada em <strong>Markup</strong> e o imperativo de gestão por <strong>Margem de Contribuição</strong> (BRUNA, 2025).<sup>24</sup> A literatura e as boas práticas de gestão reiteram veementemente que o uso simplista do <em>Markup</em> desacompanhado da validação por Margem de Contribuição acarreta um "ponto cego" fatal para a liquidez da UAN (BRUNA, 2025).<sup>24</sup></p><h3>Metodologia 1: Método <strong><em>Markup</em></strong> e Custos de Produção</h3><p>O <em>Markup</em> é o índice de marcação (fator numérico de acréscimo) inserido sob o Custo Unitário de Produção. Este custo basilar (frequentemente o próprio CMV teórico da FTP somado a embalagens e insumos diretos da porção) necessita de um indexador que o infle até atingir um Preço Bruto de Venda viável. O objetivo exclusivo do <em>Markup</em> é garantir que o preço final gerado tenha lastro suficiente para absorver as Despesas Variáveis operacionais (impostos, comissões comerciais, taxas do PAT), liquidar a proporção exigida das Despesas Fixas (aluguel do pavilhão, folha de pagamento corporativa, <em>overhead</em>, depreciação) e ainda assim concretizar a Margem de Lucro líquida desenhada pelos investidores da empresa de refeições coletivas (VILELLA, 2021).<sup>25</sup></p><p>Na matriz arquitetural de dados do SaaS, a taxonomia contábil das variáveis é um pré-requisito irrefutável:</p><ul><li>
[IMAGEM_REMOVIDA]
<strong> / 
[IMAGEM_REMOVIDA]
</strong> = Custo Unitário de Produção ou Custo Total de Venda (A somatória do CMV Teórico extraído da FTP, acrescido de possíveis custos per capita diretos e rastreáveis).</li><li>
[IMAGEM_REMOVIDA]
 = Despesas Variáveis, representadas em valor percentual (%). No Brasil, isto invariavelmente traduz a somatória de tributações federais e municipais incidentes sobre o Faturamento Bruto: PIS (ex: 0,65% a 1,65%), COFINS (ex: 3% a 7,6%), ICMS estadual e o ISS municipal, somados às taxas de empresas de vale-refeição (VILELLA, 2021).<sup>3</sup></li><li><sup>
[IMAGEM_REMOVIDA]
</sup> = Despesas Fixas percentuais (taxa de rateio ou absorção imposta pelo Controller baseada no faturamento global anual projetado).</li><li>
[IMAGEM_REMOVIDA]
 = Margem de Lucro percentual líquida que a empresa intenciona reter na última linha da DRE.</li></ul><p><strong>O Fator Divisor (Markup Divisor - MKD):</strong> A doutrina contábil estabelece que o cálculo por divisor garante que as alíquotas impostas governamentais (que sempre cobram "por dentro" do preço final de venda) não entrem em um perigoso efeito cascata reverso (VILELLA, 2021).<sup>25</sup> A equação modelada no backend do software será:</p><p>
[IMAGEM_REMOVIDA]
</p><p>O Preço Bruto de Venda Sugerido (
[IMAGEM_REMOVIDA]
) é extraído diretamente pela divisão:</p><p>
[IMAGEM_REMOVIDA]
</p><p><strong>O Fator Multiplicador (Markup Multiplicador - MKM):</strong> Muitos gerentes comerciais e administradores de UAN preferem visualizar e negociar o <em>Markup</em> como um multiplicador empírico direto (ex: "Aplico um fator 2,4 no meu CMV"). O sistema deve permitir a conversão linear do MKD em MKM (VILELLA, 2021) <sup>3</sup>:</p><p>
[IMAGEM_REMOVIDA]
</p><p>
[IMAGEM_REMOVIDA]
</p><p><strong>Implementação Sistemática e Exemplo Prático com Engenharia Tributária:</strong> Com base nos paradigmas de estruturação de custos da engenharia de produção em <em>food service</em> industrial (VILELLA, 2021) <sup>3</sup>, considere uma concessionária UAN formulando uma proposta para operar o refeitório de uma mineradora.</p><p>As premissas de negócio inseridas no sistema são:</p><ul><li>As alíquotas agregadas de impostos incidentes sobre a venda (PIS, COFINS, ISS) totalizam 
[IMAGEM_REMOVIDA]
 do faturamento.</li><li>A equipe financeira definiu que as Despesas Fixas Operacionais devem ter um rateio de absorção projetado de 
[IMAGEM_REMOVIDA]
 sobre a receita.<sup>3</sup> (Nota: em propostas de UAN de altíssimo volume, as Despesas Fixas podem ser internalizadas no Custo de Produção como Custo Indireto de Fabricação, mas adotaremos o método abrangente padrão de varejo/serviços de alimentação onde são tratadas em base percentual).</li><li>A Margem de Lucro almejada pelo conselho executivo é de 
[IMAGEM_REMOVIDA]
 líquidos (VILELLA, 2021).<sup>3</sup></li><li>O Custo Unitário de Produção (comida e insumos da FTP processados sob os preceitos de FC e IC) fechou em exatos 
[IMAGEM_REMOVIDA]
 por prato servido (VILELLA, 2021).<sup>3</sup></li></ul><ol><li>Consolidação das Variáveis Percentuais de Retenção:<br />Soma 
[IMAGEM_REMOVIDA]
</li><li>Cálculo Sistêmico do MKD (Markup Divisor):<br />
[IMAGEM_REMOVIDA]
</li><li>Determinação do Preço Bruto de Venda Sugerido (<em>Target Price</em>):<br />
[IMAGEM_REMOVIDA]
</li></ol><p>Com este modelo matemático embarcado, o <em>software</em> assegura instantaneamente ao setor comercial que, ao fechar a licitação por 
[IMAGEM_REMOVIDA]
 a refeição, os 
[IMAGEM_REMOVIDA]
 comprarão a comida com os índices de correção aplicados, os governos municipal e federal receberão sua cota-parte exata, e a concessionária registrará o lucro <em>target</em> em cada bandeja operada.</p><h3>Metodologia 2: Margem de Contribuição (MC) e Ponto de Equilíbrio</h3><p>A vulnerabilidade inerente da precificação baseada unicamente em <em>Markup</em> reside no fato de que rateios estáticos (Despesa Fixa percentual) são perigosamente subjetivos e baseados em projeções de venda que podem não se concretizar (BRUNA, 2025).<sup>24</sup> Por esta razão, o controle operacional profundo de um SaaS não sobrevive sem painéis gerenciais focados em Margem de Contribuição.</p><p>Enquanto o <em>Markup</em> constrói o preço empurrando de baixo para cima (a partir do CMV), a Margem de Contribuição avalia a realidade operacional descendo o topo do faturamento. A MC evidencia de maneira cristalina o quanto de dinheiro (em valor nominal) sobra de cada refeição vendida para primeiramente <em>contribuir</em> para o amortecimento das Despesas Fixas massivas da empresa (como folha da equipe de nutrição, aluguel, infraestrutura de gás industrial) e, apenas num segundo momento superavitário, configurar lucro líquido autêntico (BRUNA, 2025).<sup>3</sup></p><p>A formulação unitária analítica é imperativa na programação (VILELLA, 2021) <sup>3</sup>:</p><p>
[IMAGEM_REMOVIDA]
</p><p>Onde:</p><ul><li>
[IMAGEM_REMOVIDA]
 = Preço Bruto de Venda praticado na Nota Fiscal (faturamento unitário).</li><li>
[IMAGEM_REMOVIDA]
 = Custos Variáveis diretos inerentes (CMV da Ficha Técnica e descartáveis térmicos).</li><li>
[IMAGEM_REMOVIDA]
 = Despesas Variáveis incidentes (Impostos calculados proporcionalmente sobre o 
[IMAGEM_REMOVIDA]
).</li></ul><p><strong>O Ponto de Equilíbrio Contábil (<em>Break-even Point</em>):</strong> Se a Margem de Contribuição é o oxigênio de cada venda, o Ponto de Equilíbrio (PE) é a quantidade de unidades de ar necessárias para a empresa de refeitórios simplesmente respirar e sobreviver à asfixia financeira sem registrar prejuízo. Um módulo financeiro inteligente deve parametrizar a plotagem do volume mínimo mandatório de refeições/mês que, ao atingir a intersecção de custos totais com a receita bruta, gera um Lucro Zero ou Ponto de Empate (VILELLA, 2021).<sup>3</sup></p><p><sup>
[IMAGEM_REMOVIDA]
</sup></p><p><strong>Análise de Cenário Operacional (Modelagem do Software):</strong> Uma UAN instalada em um conglomerado industrial possui a seguinte configuração em seu <em>Dashboard</em> sistêmico (VILELLA, 2021) <sup>3</sup>:</p><ul><li>Custos Fixos Consolidados no mês (folha de cozinheiros, nutricionistas gerentes, depreciação de maquinário Hobart, aluguéis de câmara fria): 
[IMAGEM_REMOVIDA]
.<sup>3</sup></li><li>A diretoria negociou o almoço com o conglomerado contratante por um ticket travado de 
[IMAGEM_REMOVIDA]
 (Preço Bruto de Venda estabelecido).</li><li>O software lê que a composição média da FTP (CV) e os devidos impostos e taxas daquele mês (DV) resultam em deduções totais de 
[IMAGEM_REMOVIDA]
.</li></ul><ol><li>Computação da Margem de Contribuição Unitária:<br />
[IMAGEM_REMOVIDA]
<br /><em>Análise da Lógica:</em> Cada vez que um operador da fábrica passa o crachá na catraca e se serve na rampa, a concessionária acumula exatamente 
[IMAGEM_REMOVIDA]
 disponíveis na tesouraria exclusivamente voltados ao abatimento dos R$ 35 mil mensais de infraestrutura da cozinha.</li><li>Determinação Automática do Ponto de Equilíbrio de Quebra (PE):<br />
[IMAGEM_REMOVIDA]
</li></ol><p>A partir destas métricas, a capacidade preditiva do SaaS atinge o <em>state-of-the-art</em>. Se o calendário da contratante sofre paradas técnicas, dissídios, greves, pontes de feriados extensas, ou simplesmente o efetivo fabril encolhe gerando uma projeção de giro de catraca de 
[IMAGEM_REMOVIDA]
 pessoas naquele mês, o algoritmo acionará um alerta vermelho imediato na tela da Diretoria Financeira. A operação está inexoravelmente condenada ao prejuízo antes mesmo do mês encerrar, pois os 
[IMAGEM_REMOVIDA]
 angariados 
[IMAGEM_REMOVIDA]
 vezes não conseguirão cobrir o leviatã do Custo Fixo e seus 
[IMAGEM_REMOVIDA]
.</p><p><strong>A Matriz Integrada de Kasavana e Smith para o Food Service:</strong></p><p>Como evolução natural e funcionalidade <em>premium</em> da programação, o sistema de engenharia de cardápio cruza os dados do Ponto de Equilíbrio e CMV para enquadrar cada Ficha Técnica em um matriz de classificação bi-dimensional. O gestor pode visualizar o mix completo de seus cardápios sob quatro quadrantes absolutos:</p><table><thead><tr><th><p><strong>Quadrante Estratégico</strong></p></th><th><p><strong>Nível de Popularidade (Volume de Saída)</strong></p></th><th><p><strong>Margem de Contribuição (Saúde Financeira)</strong></p></th><th><p><strong>Ação Recomendada pelo Sistema</strong></p></th></tr><tr><th><p><strong>Estrelas</strong> (<em>Stars</em>)</p></th><th><p>ALTA</p></th><th><p>ALTA</p></th><th><p>Proteger severamente a consistência da FTP e os procedimentos de FC/IC. A âncora da UAN.</p></th></tr><tr><th><p><strong>Cavalos de Batalha</strong> (<em>Plowhorses</em>)</p></th><th><p>ALTA</p></th><th><p>BAIXA</p></th><th><p>(Ex: Frango assado em UAN). Reduzir <em>per capita</em>, alterar cortes da carne, negociar Custo Unitário com fornecedores para blindar a alta demanda com lucratividade marginal (ZANINI et al., 2020).<sup>20</sup></p></th></tr><tr><th><p><strong>Quebra-cabeças</strong> (<em>Puzzles</em>)</p></th><th><p>BAIXA</p></th><th><p>ALTA</p></th><th><p>Aumentar o destaque e as ilhas de atratividade da preparação no <em>layout</em> do refeitório, fazendo campanhas táticas de distribuição.</p></th></tr><tr><th><p><strong>Cães</strong> (<em>Dogs</em>)</p></th><th><p>BAIXA</p></th><th><p>BAIXA</p></th><th><p>O sistema recomenda ativamente a eliminação sumária do cardápio e a reestruturação da grade semanal.</p></th></tr></thead></table><p>As métricas contábeis e físicas que circundam uma Ficha Técnica de Preparação constituem uma intrincada engrenagem de controle de massa, temperatura e dinheiro. Na arquitetura central de um software ERP para cozinhas industriais, não há espaço para estimativas superficiais. O domínio sistêmico dos parâmetros biológicos (perdas e rendimentos térmicos e de higienização), das modelagens financeiras de apropriação (CMV Teórico vs. Real) e das metodologias matemáticas de viabilidade de <em>pricing</em> (Markup e Ponto de Equilíbrio sob Margem de Contribuição) (VILELLA, 2021) <sup>3</sup> representam, na essência, as regras de negócio imperativas. A solidez computacional dessas lógicas algorítmicas é o que blinda a margem de lucro de operações B2B que batalham diariamente contra a brutal inflação do varejo alimentício.</p><h2>4. Referências Bibliográficas</h2><ul><li>AKUTSU, Rita de Cássia; BOTELHO, Raquel Assunção; CAMARGO, Erika Barbosa; SÁVIO, Karin Eleonora Oliveira; ARAÚJO, Wilma Coelho. A ficha técnica de preparação como instrumento de qualidade na produção de refeições. <strong>Revista de Nutrição</strong>, Campinas, v. 18, n. 2, 2005.</li><li>ATENAS. <strong>Planejamento de Custo em Unidade de Alimentação e Nutrição (UAN)</strong>. Centro Universitário Atenas, 2021.</li><li>BRUNA. Markup x Margem de Contribuição: qual fórmula é melhor para precificar. <strong>Tributei Blog</strong>, 2025.</li><li>FERRAZ, et al. Informações e Aplicações para Estabelecimentos Produtores de Alimentos. In: <strong>Simpósio em Saúde e Alimentação</strong>, UFFS, Chapecó, 2013.</li><li>GARCIA, Paloma Popov Custódio; AKUTSU, Rita de Cássia; SÁVIO, Karin Eleonora; SILVA, Izabel Cristina Rodrigues. Eficácia de treinamento de manipuladores de alimentos na formulação e uso de Fichas Técnicas. <strong>Revista CRN-1</strong>, n. 19, Brasília, 2014.</li><li>KONCLUI. <strong>Como Calcular CMV do Restaurante: O Guia Definitivo Para o Lucro</strong>. Konclui Tecnologia e Gestão, 2025.</li><li>ORNELLAS, Lieselotte Hoeschl. <strong>Nutrição e Técnica Dietética</strong>. 3. ed. São Paulo: Manole, 2014.</li><li>ROMERO, G. et al. <strong>Serviço de Alimentação e Nutrição Hospitalar: Elaboração de Fichas Técnicas</strong>. Manual Clínico e de Administração, 2014.</li><li>VILELLA, Andreza. <strong>Impostos em Refeições Coletivas / Custos em Unidades de Alimentação (Aulas 9 e 10)</strong>. Material de Apoio Acadêmico, 2021.</li><li>ZANINI, M.; MOURA, G.; TEIXEIRA, E.; BALSAN, L. <strong>Redução do desperdício de alimentos: estudo em um restaurante universitário</strong>. Revista de Administração, 2020.</li><li>ZUNINO, Adriel et al. <strong>Custo e desempenho socioeconômico do restaurante universitário da Universidade Federal de Santa Catarina</strong>. UFSC, Florianópolis, 2012.</li></ul><h4>Referências citadas</h4><ol><li>A ficha técnica de preparação como instrumento de qualidade na produção de refeições, acessado em abril 17, 2026, <a href="https://www.scienceopen.com/document?vid=cdf5571f-b294-497e-af80-bbfbd3f0ab17">https://www.scienceopen.com/document?vid=cdf5571f-b294-497e-af80-bbfbd3f0ab17</a></li><li>Adequacy of good manufacturing procedures in foodservice establishments - ResearchGate, acessado em abril 17, 2026, <a href="https://www.researchgate.net/publication/237651034_Adequacy_of_good_manufacturing_procedures_in_foodservice_establishments">https://www.researchgate.net/publication/237651034_Adequacy_of_good_manufacturing_procedures_in_foodservice_establishments</a></li><li>Impostos em Refeições Coletivas | PDF - Scribd, acessado em abril 17, 2026, <a href="https://pt.scribd.com/document/539653476/AULAS-9-E-10-CUSTOS-2021-2">https://pt.scribd.com/document/539653476/AULAS-9-E-10-CUSTOS-2021-2</a></li><li>PLANEJAMENTO DE CUSTOS EM UNIDADE DE ... - UniAtenas, acessado em abril 17, 2026, <a href="https://www.atenas.edu.br/uniatenas/assets/files/spic/monography/1/9/PLANEJAMENTO_DE_CUSTOS_EM_UNIDADE_DE_ALIMENTACAO_E_NUTRICAO_2021.pdf">https://www.atenas.edu.br/uniatenas/assets/files/spic/monography/1/9/PLANEJAMENTO_DE_CUSTOS_EM_UNIDADE_DE_ALIMENTACAO_E_NUTRICAO_2021.pdf</a></li><li>Livro Fórmulas e Fator de Cocção | PDF - Scribd, acessado em abril 17, 2026, <a href="https://www.scribd.com/document/805205682/livro-Formulas-e-fator-de-coccao">https://www.scribd.com/document/805205682/livro-Formulas-e-fator-de-coccao</a></li><li>Ficha Técnica de Preparação de Alimentos | PDF | Qualidade (negócios) - Scribd, acessado em abril 17, 2026, <a href="https://pt.scribd.com/presentation/592692921/Elaboracao-de-ficha-tecnica-de-preparacao-completa">https://pt.scribd.com/presentation/592692921/Elaboracao-de-ficha-tecnica-de-preparacao-completa</a></li><li>Ficha Técnica de Preparo | PPTX - Slideshare, acessado em abril 17, 2026, <a href="https://pt.slideshare.net/slideshow/ficha-tcnica-de-preparo/80661306">https://pt.slideshare.net/slideshow/ficha-tcnica-de-preparo/80661306</a></li><li>Revista_19.pdf - CRN-1, acessado em abril 17, 2026, <a href="https://novoportal.crn1.org.br/wp-content/uploads/2015/04/Revista_19.pdf">https://novoportal.crn1.org.br/wp-content/uploads/2015/04/Revista_19.pdf</a></li><li>Ficha Técnica de Preparo: Importância e tipos de Ficha Técnica - Nutri da Teoria a Prática, acessado em abril 17, 2026, <a href="https://nutridateoriaapratica.com.br/ficha-tecnica-de-preparo-importancia-e-tipos-de-ficha-tecnica/">https://nutridateoriaapratica.com.br/ficha-tecnica-de-preparo-importancia-e-tipos-de-ficha-tecnica/</a></li><li>Manual para elaboração de Fichas Técnicas de Preparação e oficinas culinárias - Repositório da UFRN, acessado em abril 17, 2026, <a href="https://repositorio.ufrn.br/server/api/core/bitstreams/8ccb15a3-7b0f-4c94-a52f-64be73077dc5/content">https://repositorio.ufrn.br/server/api/core/bitstreams/8ccb15a3-7b0f-4c94-a52f-64be73077dc5/content</a></li><li>How to calculate CMV (cost of goods sold)? #ifood #fooddelivery #burger #price - YouTube, acessado em abril 17, 2026, <a href="https://www.youtube.com/shorts/5StekJziNCY">https://www.youtube.com/shorts/5StekJziNCY</a></li><li>Cómo calcular el costo de los productos vendidos en un restaurante - WISK, acessado em abril 17, 2026, <a href="https://www.wisk.ai/es/blog/como-calcular-el-costo-de-mercaderias-vendidas-en-un-restaurante">https://www.wisk.ai/es/blog/como-calcular-el-costo-de-mercaderias-vendidas-en-un-restaurante</a></li><li>Como Calcular CMV do Restaurante: O Guia Definitivo Para o Lucro - Koncluí, acessado em abril 17, 2026, <a href="https://konclui.com/blog/como-calcular-cmv-restaurante/">https://konclui.com/blog/como-calcular-cmv-restaurante/</a></li><li>Calculadora CMV para Restaurantes Gratis y al Instante - OlaClick, acessado em abril 17, 2026, <a href="https://olaclick.com/es/herramientas/calculadora-de-cmv-para-restaurantes/">https://olaclick.com/es/herramientas/calculadora-de-cmv-para-restaurantes/</a></li><li>¡El CMV al descubierto! Conoce el indicador más poderoso para la rentabilidad de tu restaurante. - YouTube, acessado em abril 17, 2026, <a href="https://www.youtube.com/watch?v=xwM2yH5D6dI">https://www.youtube.com/watch?v=xwM2yH5D6dI</a></li><li>Como calcular e comparar o CMV teórico com o CMV real - YouTube, acessado em abril 17, 2026, <a href="https://www.youtube.com/watch?v=_ECJ1t6d5rQ">https://www.youtube.com/watch?v=_ECJ1t6d5rQ</a></li><li>Domine o CMV Gastronômico: O que é e como calcular - Marcelo Politi, acessado em abril 17, 2026, <a href="https://marcelopoliti.com.br/blog/cmv/domine-o-cmv-gastronomico/">https://marcelopoliti.com.br/blog/cmv/domine-o-cmv-gastronomico/</a></li><li>ROSANA MEDEIROS FERREIRA - RI UFPE, acessado em abril 17, 2026, <a href="https://repositorio.ufpe.br/bitstream/123456789/13924/1/Disserta%C3%A7%C3%A3o%20de%20Mestrado_Rosana%20Medeiros.pdf">https://repositorio.ufpe.br/bitstream/123456789/13924/1/Disserta%C3%A7%C3%A3o%20de%20Mestrado_Rosana%20Medeiros.pdf</a></li><li>“A AVALIAÇÃO DA IMPLANTAÇÃO DE UNIDADES DE REDES VAREJISTAS – UM ESTUDO DE OPÇÕES REAIS” - Biblioteca Digital de Teses e Dissertações da USP, acessado em abril 17, 2026, <a href="http://www.teses.usp.br/teses/disponiveis/12/12139/tde-26042004-142324/publico/Eduardo_Padilha_02-12-2003.pdf">http://www.teses.usp.br/teses/disponiveis/12/12139/tde-26042004-142324/publico/Eduardo_Padilha_02-12-2003.pdf</a></li><li>Mensuração de custos no restaurante ... - repositorio.ufal.br, acessado em abril 17, 2026, <a href="https://www.repositorio.ufal.br/bitstream/123456789/14763/1/Mensura%C3%A7%C3%A3o%20de%20custos%20no%20restaurante%20universit%C3%A1rio%20da%20Universidade%20Federal%20de%20Alagoas.pdf">https://www.repositorio.ufal.br/bitstream/123456789/14763/1/Mensura%C3%A7%C3%A3o%20de%20custos%20no%20restaurante%20universit%C3%A1rio%20da%20Universidade%20Federal%20de%20Alagoas.pdf</a></li><li>Como calcular o CMV de Restaurante por KILO? - YouTube, acessado em abril 17, 2026, <a href="https://www.youtube.com/watch?v=FtaSKwKCa7k">https://www.youtube.com/watch?v=FtaSKwKCa7k</a></li><li>Precificação, margem de lucro e ponto de equilíbrio: você domina esses conceitos?, acessado em abril 17, 2026, <a href="https://sebraepr.com.br/comunidade/artigo/precificacao,-margem-de-lucro-e-ponto-de-equilibrio-voce-domina-esses-conceitos">https://sebraepr.com.br/comunidade/artigo/precificacao,-margem-de-lucro-e-ponto-de-equilibrio-voce-domina-esses-conceitos</a></li><li>Restaurante: como garantir eficiência, lucratividade e sucesso no mercado - Teknisa, acessado em abril 17, 2026, <a href="https://www.teknisa.com/restaurante/">https://www.teknisa.com/restaurante/</a></li><li>Markup x Margem de Contribuição: qual fórmula é melhor para precificar no e-commerce? -, acessado em abril 17, 2026, <a href="https://tributei.net/blog/blog-markup-ou-margem-de-contribuicao-no-ecommerce/">https://tributei.net/blog/blog-markup-ou-margem-de-contribuicao-no-ecommerce/</a></li><li>Markup: saiba calcular para definir preços com segurança - Sebrae, acessado em abril 17, 2026, <a href="https://sebrae.com.br/sites/PortalSebrae/artigos/markup-saiba-calcular-para-definir-precos-com-seguranca,94b3013555956810VgnVCM1000001b00320aRCRD">https://sebrae.com.br/sites/PortalSebrae/artigos/markup-saiba-calcular-para-definir-precos-com-seguranca,94b3013555956810VgnVCM1000001b00320aRCRD</a></li><li>Markup: O que é, sua importância e como calcular? - Expert XP, acessado em abril 17, 2026, <a href="https://conteudos.xpi.com.br/aprenda-a-investir/relatorios/markup-o-que-e-como-calcular/">https://conteudos.xpi.com.br/aprenda-a-investir/relatorios/markup-o-que-e-como-calcular/</a></li><li>Markup: o que é, fórmula de como calcular o preço de venda e exemplos - Conta Azul, acessado em abril 17, 2026, <a href="https://contaazul.com/blog/como-calcular-o-markup-e-por-que-usar-essa-precificacao/">https://contaazul.com/blog/como-calcular-o-markup-e-por-que-usar-essa-precificacao/</a></li></ol>