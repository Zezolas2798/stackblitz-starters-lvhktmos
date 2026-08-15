# **📝 Observações**

ago. 3, 2026

## **Reunião em 3 de ago. de 2026 às 14:31 GMT-03:00**

Registros da reunião [Transcrição](https://docs.google.com/document/d/1ppUzGWRAMRWg5zmumLmRBnXKfKRzbb2n5_iCfmvUnP8/edit?usp=drive_web&tab=t.v0zrw3q2o6m2) 

### **Resumo**

Revisão estratégica da plataforma Nutridev com foco em integração sistêmica, conformidade regulatória e escalabilidade operacional.

**Visão e Problemas Estruturais**  
A plataforma foi definida como um ecossistema de gestão para o setor alimentício. O foco principal é solucionar a fragmentação de dados através da integração total dos processos operacionais.

**Arquitetura e Escopo Técnico**  
O sistema adotará uma arquitetura modular, escalável e hierárquica, permitindo adaptação para múltiplos nichos e legislações. Decidiu-se implementar um controle de acesso granular com perfis de usuários distintos.

**Conformidade e Inteligência Operacional**  
O desenvolvimento priorizará a auditoria constante para atender exigências de órgãos fiscalizadores. Serão integrados alertas automatizados e ferramentas de consulta baseadas em inteligência artificial para otimização operacional.

### **Próximas etapas**

- [ ] \[A group\] Investigar Negócios: Investigar os diferentes tipos de negócio de alimentação para definir as bases legais e as operações de ponta a ponta.

- [ ] \[A group\] Mapear Legislação: Mapear as legislações aplicáveis a cada tipo de negócio nos âmbitos federal, estadual e municipal.

- [ ] \[A group\] Consultar Legacy: Consultar a pasta Legacy para analisar projetos anteriores, estruturas, equipamentos, relatórios e documentos existentes.

- [ ] \[A group\] Documentar Estruturas: Documentar as definições de setores, equipamentos e fluxos operacionais antes de iniciar a codificação.

- [ ] \[A group\] Definir Módulos: Definir os módulos e as respectivas regras de negócio e eventos após a conclusão do mapeamento operacional.

### **Detalhes**

* **Visão Geral do Produto Nutridev**: José Augusto define o Nutridev como um ecossistema de gestão, comunicação e compliance voltado para empresas de alimentação, com o objetivo de realizar a gestão completa do negócio, integrando os diversos setores e garantindo a segurança e qualidade dos processos executados ([00:00:56](#00:00:56)).

* **Evolução do Público-alvo e Papel do Consultor**: A plataforma, inicialmente idealizada apenas para consultores, evoluiu para incluir os clientes finais, sendo que o consultor atua como o "campeão" responsável por implementar módulos de qualidade, auditorias e checklists, além de sugerir novos módulos conforme as necessidades mapeadas de cada negócio ([00:01:33](#00:01:33)).

* **Problemas de Mercado e Integração de Dados**: José Augusto identifica como principal dor do mercado a falta de integração e segurança de dados, onde empresas utilizam ferramentas manuais ou planilhas isoladas que geram inconsistências entre fichas técnicas gerenciais, operacionais e financeiras, resultando em retrabalho e falta de padronização ([00:03:47](#00:03:47)).

* **Mapeamento de Nichos de Mercado**: O sistema precisa cobrir diferentes tipos de estabelecimentos, incluindo serviços de catering, restaurantes comerciais, restaurantes por quilo, e instituições como escolas, hospitais e refeitórios de empresas, respeitando legislações específicas como o Programa Nacional de Alimentação Escolar (PENAI) e o Programa de Alimentação do Trabalhador (PAT) ([00:06:33](#00:06:33)) ([00:09:10](#00:09:10)).

* **Escalabilidade e Independência de Módulos**: A arquitetura do sistema deve ser planejada para que os módulos sejam independentes, porém interconectados, permitindo a implementação por etapas (por camadas) e garantindo que o sistema seja capaz de evoluir e provar seu valor no primeiro ano de operação em diferentes modelos de negócio ([00:09:51](#00:09:51)).

* **Análise do Cenário Competitivo**: Comparando com soluções existentes, José Augusto observa que os concorrentes focam em tarefas muito específicas, como apenas checklists ou tabelas nutricionais, sem integrar todos os setores da cadeia produtiva, mencionando o Food Checker como um sistema que toca em checklists mas falha na entrega da integração total desejada ([00:11:09](#00:11:09)).

* **Hierarquia Administrativa e Permissões de Usuário**: O sistema será estruturado com um super admin (José Augusto), consultores com acesso a carteiras de clientes e donos de estabelecimentos, permitindo a configuração granular de permissões e ações que cada tipo de funcionário pode executar dentro dos módulos ([00:12:52](#00:12:52)) ([00:15:31](#00:15:31)).

* **Painel de Controle e Inteligência Artificial**: A plataforma focará em oferecer um painel de controle (dashboard) centralizado para os donos de negócios, com estudos para integrar Inteligência Artificial, similar ao modelo do Notion, para consultar bases de dados sobre legislação e tirar dúvidas operacionais ([00:16:40](#00:16:40)).

* **Gestão de Funcionários e Acesso Operacional**: O sistema distinguirá usuários ativos (colaboradores com acesso para executar funções específicas como estoquistas ou chefes de cozinha) de colaboradores não ativos, permitindo o registro de treinamentos, controle de saúde ocupacional, como exames médicos e o Atestado de Saúde Ocupacional (ASO), e vinculação a setores específicos ([00:17:34](#00:17:34)) ([00:23:00](#00:23:00)).

* **Conformidade, Auditoria e Documentação**: O sistema deve ser arquitetado para ser totalmente auditável, atendendo aos requisitos de fiscalização da Agência Nacional de Vigilância Sanitária (Anvisa), utilizando uma central de documentos para controle de pragas, limpeza, resíduos e homologação de fornecedores, sem o uso de exclusão definitiva (apenas exclusão lógica) ([00:19:26](#00:19:26)).

* **Arquitetura Escalável e Perfis Híbridos**: O sistema deve suportar uma arquitetura escalável para diversos consultores, clientes e unidades, acomodando perfis híbridos, como empresas que possuem serviços de catering e fornecem alimentação própria para seus trabalhadores, garantindo flexibilidade desde o início ([00:20:27](#00:20:27)).

* **Infraestrutura e Cadastro de Equipamentos**: O planejamento inclui o mapeamento e configuração de setores, equipamentos e locais de armazenamento, permitindo vincular equipamentos (como congeladores, estufas, coifas) a setores e tipos de alimentos para automação de processos, utilizando a base do projeto legado ([00:21:24](#00:21:24)) ([00:36:39](#00:36:39)).

* **Framework de Legislação e Regras de Negócio**: A implementação deve considerar a hierarquia legislativa, do âmbito municipal ao federal, utilizando o CEP para definir as normas aplicáveis, como a Resolução da Diretoria Colegiada (RDC) 216 e 275 da Anvisa, ou portarias estaduais como a CVS1 de São Paulo, mantendo a estrutura preparada para atualizações de parâmetros ([00:25:12](#00:25:12)) ([00:27:27](#00:27:27)).

* **Fluxos Operacionais e Sistema de Alertas**: O sistema funcionará com gatilhos automáticos, disparando alertas para o setor de qualidade ou responsáveis técnicos caso parâmetros, como temperaturas de equipamentos ou prazos de validade, fiquem fora das normas, permitindo intervenções rápidas e corretivas ([00:29:55](#00:29:55)) ([00:32:29](#00:32:29)).

* **Etapa de Descoberta e Próximos Passos**: O projeto entrará em uma fase de investigação e desenvolvimento para mapear os tipos de negócio e definir as legislações pertinentes e as regras operacionais de ponta a ponta, utilizando o material da pasta legada como base para a construção dos novos módulos ([00:33:26](#00:33:26)) ([00:38:41](#00:38:41)).

*Revise as anotações do Gemini para checar se estão corretas. [Confira dicas e saiba como o Gemini faz anotações](https://support.google.com/meet/answer/14754931)*

*Como está a qualidade de **destas observações?** [Responda a uma breve pesquisa](https://google.qualtrics.com/jfe/form/SV_5bXzKQfylMIhSXc?confid=KGcPMtuv738eWFRKU8nFDxIYOAIIigIgABgFCA&detailLevel=standard&hasImages=False&entryPoint=footerMain&isGoogler=False) para nos dar seu feedback, incluindo o quanto as observações foram úteis para o que você precisa.*

# **📖 Transcrição**

ago. 3, 2026

## **Reunião em 3 de ago. de 2026 às 14:31 GMT-03:00 \- Transcrição**

### **00:00:01**

**José Augusto:** Boa, Ademina. A gente vai fazer essa reunião aqui, essa primeira reunião, onde eu vou responder um questionário que você me enviou para falar mais sobre a visão geral do produto que a gente quer desenvolver. E posteriormente a gente depois de responder e analisar esse documento, a gente vai destrinchar mais, tentar deixar realmente um plano bem mais estruturado antes de codificar qualquer coisa, né? a gente vai pra gente utilizar os princípios domainspec, do arcanum, do cyberalchemy, tá?

### **00:00:30**

**José Augusto:** Então vamos pegar aqui o documento, né, e vou ler aqui respondendo. Vou tentar falar, passar o máximo de informação, né? Afinal, a transcrição aí fica como documento. Eh, então o termo de entrevista de escopa, né? Scopa interview. instruoluções de gravação. Abra documento, grave só não só leia a cada sessão e responda em detalhes como se tivesse explicando o sistema para um novo engenheiro, chefe, gerente de produto.

### **00:00:56** {#00:00:56}

**José Augusto:** Não se preocupe, isso é técnico, beleza? Eh, então, visão geral e propósito, né, são a entender a essência do produto e o que define seu sucesso. O que que é o Nutridev em uma frase? O Nutridev, ele é um ecossistema de gestão, comunicação e compliance para empresas de alimentação, né? Gestão do negócio inteiro, gestão dos setores desta empresa, a comunicação entre os setores dessa empresa e compliance garantindo a segurança e qualidade dos processos que essas empresas executam.

### **00:01:33** {#00:01:33}

**José Augusto:** Para quem serve prioritariamente, né? Eh, no início da ideia, essa essa plataforma era para ser usada para consultores, né, ter ferramentas para aplicarem na sua consultoria. E a ideia evoluiu porque o consultor, o trabalho dele é trazer soluções para o negócio de alimentação. Então, hoje, como que eu imagino esse negócio, né? Como que eu imagino essa esse aplicativo? Ele vai ser um aplicativo onde consultores podem utilizar, né?

### **00:02:08**

**José Augusto:** Eh, eles vão ter suas carteiras de clientes e suas respectivas unidades para cada cliente. Na minha lógica, o consultor ele vai implementar a primeira coisa seria o módulo de qualidade, onde ele aplica as auditorias, checklists, planilhas, né? Ess essas questões de controle que ele faz, né? E como ele vai utilizar dessa plataforma, ele já vai configurar algumas coisas referentes a a característica do próprio negócio, né? E ele pode sugerir a implementação de novos módulos, por exemplo, módulos que a gente vai mapear depois do negócio de ponta a ponta, né?

### **00:02:49**

**José Augusto:** desde o planejamento financeiro, recebimento, estoque, produção, expedição, controle de qualidade, controle de de ingredientes, controle de tudo, né? Então isso de forma que os módulos eles são independentes, mas eles se conectam, né, como se fosse a a clopagem. Então o nutricionista ou um consultor, enfim, vai utilizar, né? Ele vai ser o nosso nosso, a gente pode chamar assim de campeão, ele que vai levar a plataforma a nosso cliente final.

### **00:03:21**

**José Augusto:** Então, a gente vai conversar com eles, trazer uma uma ferramenta que vai solucionar e facilitar as suas entregas e que a oferecer novos módulos ao cliente. Então, o cliente quer ali uma gestão de estoque, a gente tem esse módulo, já queremos produção pra gente mapear ali como que tá planejar e mapear como que tá indo a produção, como que foi os desperdícios, o que sobrou, que que a sobra limpa, que que soja, né?

### **00:03:47** {#00:03:47}

**José Augusto:** E o que que isso traz de benefício tanto pro consultor quanto pro dono, né? consultor, ele começa a trabalhar com dados integrados e o dono também, né? Então ele começa a a integrar as coisas que acontecem dentro da sua empresa em um local em local só, desde a limpeza, estoque, enfim, recimento, planejamento, tudo, tudo. Eh, então, se eu fosse falar qual a principal dor do mercado que ele resolve, eh, a integração de dados, né, e segurança.

### **00:04:20**

**José Augusto:** Então, quando das experiências que eu passei como consultor, eh, eu vi muita empresa trabalhando com ferramentas muitas vezes manuais e que tinha que fazer muito trabalho repetitivo, né? Então, contagens de estoque manualmente ou tentava fazer uma planilha, né, e ou fazia às vezes uma ficha técnica, né, o setor de qualidade fazia uma ficha técn técnica, por exemplo, nutricionista ou o próprio consultor. E essa ficha técnica deveria ser usada, né?

### **00:04:57**

**José Augusto:** Deveria ser passado ali, além de uma ficha técnica gerencial, uma operacional para tanto a o pessoal da produção conseguir entender em como executar a receita de forma padronizada e também o setor financeiro e compras, entender exatamente quais são as quantidades que devem comprar, dependendo da demanda. O que acontecia é que a qualidade fazia uma ficha técnica, mas às vezes o a produção, né, seja confeitaria, cozinha quente ou qualquer outro setor ali que produz, ele tinha uma outra receita num livro de receitas que ele tinha.

### **00:05:34**

**José Augusto:** E aí você ia olhar a o financeiro, ele tinha uma outra ficha gerencial, né? E aí vinha às vezes diretoria, mudava. Então a gente não tinha dados unificados. A mesma ficha técnica onde a gente mape os ingredientes, quantidades, processos, tudo deveria ser utilizada, aproveitada para produzir rótulos e tabelas nutricionais dos próprios produtos, caso eles forem forem Tá. algum evento ou para delivery ou forem expostos em alguma prateleira, né?

### **00:06:04**

**José Augusto:** E esses dados não se conversavam, então tinha que sempre repetir o processo de pegar a ficha técnica, jogar numa outra planilha. Então, os dados primordiais, eles poderiam ser usados para várias atividades e isso não acontecia pela não tinha integridade dos dados, não tinha integridade e comunicação entre os setores. Aí, então eu acho que eu tentei explicar bem qual que é a dor que ele soluciona. Com esses dados integrados, com essa comunicação entre setores, a hora que a gente mapear bem eh os diferentes tipos de negócio, né?

### **00:06:33** {#00:06:33}

**José Augusto:** Quais são as características? a gente vai entender eh de ponta a ponta como que é a produção, por exemplo, de uma empresa de Cathering, de um restaurante comercial, um restaurante carart, um restaurante que é por quilo, os diferentes tipos de restaurantes institucionais, então, por exemplo, escola, né, faculdade, eh hospitais, eh refeitórios de empresas, né, que que, por exemplo, alguns têm que respeitar o PENAI, como o Programa Nacional de Alimentação Escolar, ou do PAT, que é do trabalho.

### **00:07:04**

**José Augusto:** ador as diferentes complexidades de um refeitório hospitalar que tem tanto pros seus pros pros trabalhadores quanto as dietas dietoterápicas, né? E então tem as diferentes tipos de texturas, os horários, tipos de diferentes tipos de dietas, né? Outra coisa também que ao mesmo tempo que, por exemplo, pode ser uma empresa de caterine, a gente pode, a própria empresa, ela pode fornecer alimentação aos trabalhadores, né? Então, a gente tem tanta produção, vamos dizer assim, indústria, né?

### **00:07:38**

**José Augusto:** Padarias, eh, confeitarias, mas ao mesmo tempo ele pode fornecer alimentação pro pro profissional. Então, a gente teria dois perfis ao mesmo tempo em uma mesma empresa, tá? Eu também gostaria de entender quais são as outras lacunas, né, que a gente que eu posso ter deixado aqui, né? Mas, por exemplo, se seria, faria sentido a gente deixar nesse nicho ou, por exemplo, a gente abrir ali talvez no supermercado.

### **00:08:07**

**José Augusto:** Eh, no meu ver ali, talvez não, né? Mas bom. E aí a hora que a gente mapear de ponta a ponta como que um restaurante comercial funciona, eh como as cozinhas institucionais, as suas próprias características, eh empresas de caterine, né, que tem a, por exemplo, a expedição, como que a gente vai construir os módulos, quais deles são padronizados, por exemplo, um financeiro, imagino que seja padronizado, onde a gente consegue ali rastrear as contas.

### **00:08:40**

**José Augusto:** contas pagas, né? A gente vai ver tudo emitido por nota fiscal e a gente conecta uma API, a gente consegue ali destinar porque a gente vai ter uma parte toda cadastrada ali de fornecedores e tudo, né? Eh, e já a gente pode automatizar esse recebimento das notas fiscais. a gente consegue começar a automatizar o modulo financeiro. Eh, estoque, imagino que isso também seja bem parecido, mas a gente tem que investigar.

### **00:09:10** {#00:09:10}

**José Augusto:** Ou seja, que o planejamento e produção eh de módulos de de cada tipo de restaurante eh unidade de alimentação é diferente. Então, por quilo é de uma forma, o Alacart é outro. Eu sei que a a uma cozinha institucional para, por exemplo, trabalhadores e escolas, o cardápio, eles segue, tem que seguir legislações de diretrizes diferentes, mas e também a gente pode automatizar a geração de cardápios. A gente tem no último projeto, a gente usou um modelo matemático ali para utilizar, por exemplo, eh, não repetir textura, cor, tipos de proteína, enfim, né?

### **00:09:51** {#00:09:51}

**José Augusto:** e garantir ali os aportes nutricionais. Eh, bom, e aí depois a gente vai ver quais são os módulos que a gente consegue padronizar e quais a gente tem que deixar específico. Então, a gente vai ter que fazer uma parte ali de eh pesquisa e para entender cada tipo de negócio para quem serve prioritariamente. Então essa parte eu expliquei o que faria esse sistema ser considerado um sucesso no primeiro ano seria a gente conseguir implementar ele por completo, né, em diferentes tipos de negócio e que os módulos funcionassem, né?

### **00:10:35**

**José Augusto:** E digo mais, então o sucesso seria a gente começar com talvez com uma solução pequena, né, com uma empresa pequena, com nível de maturidade não tão avançado. A gente ia colopando esses módulos e ver que eles conseguir provar que eles são independentes, mas interconectados, né? Então, a gente consegue avançar, a maturidade avançar e desenvolver um negócio de alimentação e implementando por camadas, por etapas, por módulos esses dessa empresa, né?

### **00:11:09** {#00:11:09}

**José Augusto:** Eh, o que eu vejo de sistemas concorrentes, eu vejo que eles fazem coisas muito específicas. Então, uma ferramenta ali que se propõe a fazer trabalha nutricional, ele faz só tabela nutricional ou faz tabela nutricional e ou só os checklists. Eles não trazem essas soluções paraos diferentes setores eh de um negócio. Nunca vi um sistema que tenta fazer essa essa integração, né, dos setores de dados, dessa forma de comunicação que entenda a operação por completo, de ponto a ponto, né?

### **00:11:46**

**José Augusto:** Eh, não vi algo parecido. O único que eu vi foi o Food Checker, mas que ele foca ainda assim na parte de checklists, né? faz as auditorias, talvez planilhas e que mesmo assim não entrega como a gente quer entregar. Então, além de fazer todos esses registros, a plataforma ela tá pronta para montar dashboards, montar relatórios ali bem mais visuais e compreensíveis, né? A gente vai ter uma central de documentos também, onde, por exemplo, a gente tem uma parte da qualidade que é homologação de fornecedores.

### **00:12:17**

**José Augusto:** A gente vai conseguir automatizar esse processo, a gente vai conseguir automatizar a gestão que o consultor tem que ter sobre os documentos que estão para vencer ou não, né? tudo isso aí vai ser muito bem integrado, né? Então a gente vai entender toda a complexidade da cadeia produtiva desses diferentes tipos de negócio de ponta a ponta, né? Então a gente vai deixar muito bem definido. Óbvio que ao longo da do desenvolvimento a gente vai pensar também em fases de testes para validar o que a gente tá construindo, né?

### **00:12:52** {#00:12:52}

**José Augusto:** Então atores hierarquia de de clientes, né? o consultor. Então, antes de falar o consultor, né, tipo, a gente tem o dono do aplicativo, que no caso sou eu, que a gente vai ser o super admin. O super admin ele tem acesso global a toda a plataforma. Ele ele tem acesso a todos os asos consultores ou empresas de consultorias que utilizam, tanto para gerir ali como que tá quantos clientes estão ativos de consultoria, quantos clientes cada consultor tem,

### **00:13:25**

**José Augusto:** faturamento que a gente tem em relação aos pagamentos da plataforma, a gente consegue gerenciar ali os clientes que compram direto, né? Então, um dono de um de negócio de alimentação que compra direto a solução com a gente, a gente vai ter acesso a dados pra gente começar a entender quais são os módulos que são mais utilizados, eh talvez são eh quais são as soluções que mais compram, se a gente consegue entender também, por exemplo, desperdício, a gente consegue utilizar esses dados pra gente melhorar cada vez a nossa plataforma.

### **00:13:58**

**José Augusto:** Eh, a gente consegue ativar e liberar módulos, ativar e desativar módulos. eh, formar o atendimento, né? Então, ah, o consultor ele utiliza seu qualidade, mas a empresa que ele quer implementar, ele ele implementar, sei lá, estoque em um dos clientes dele, a gente faz essa parte de ativação, né? A gente pode até ver depois, por exemplo, se é o consultor que tá implementando isso dentro de uma empresa, a gente vê de fazer talvez um um uma bonificação, né?

### **00:14:31**

**José Augusto:** Talvez o consultor ou dá um desconto aí. cliente final, a gente vê ali o que que pode ser feito, né? Talvez ser uma bonificação, seja um bom jeito de pro consultor para ele ter essa essa vontade de indicar a nossa plataforma aí. Bom, o consultor, o que que é a rotina dele, né? Ali ele vai ter ele vai cadastrar os seus clientes, né? sua carteira de clientes, eh as unidades de cada um dos seus clientes.

### **00:14:59**

**José Augusto:** E ele também tem acesso global ao seu cliente, né? a gente pode ali colocar, por exemplo, o ele vai ter acesso analisar ali brevemente o financeiro, eh, ou não, a gente pode delimitar ali dependendo de como for a contratação do cliente dele, a plataforma, mas se for pensar bem, ele deve focar muito mais na parte de planejamento, eh, qualidade. Então, às vezes ele tá fazendo, depende muito do serviço, né?

### **00:15:31** {#00:15:31}

**José Augusto:** Então, mas assim, ele pode ter uma uma um acesso ao financeiro. Então, uma coisa que eu pensei nisso foi que cada tipo de funcionário, eh, seja ele o consultor que comprou a plataforma e vendeu e fez um cliente dele implementar também, a gente também consegue configurar as permissões de cada tipo de usuário, né? né? Isso a gente fez no outro ali. Então, depois da gente reformular bem os módulos, as features, quais são os eventos, quais são as regras, a gente entende quais são as ações que podem ser executadas dentro do sistema em cada tipo de módulo.

### **00:16:05**

**José Augusto:** E a gente vai transformar isso em um em um painel de controle. Então, sempre que a gente for cadastrar alguém, a gente vai habilitar ou restringir ações dentro ações, enfim, qualquer tipo de ação dentro da plataforma. a empresa, como que o dono interage com a plataforma? Ele, o dono ali, né? Então ele pode ser, ele pode fechar por uma indicação do próprio consultor e ele tem o dono, ele tem a acesso global, então ele vê ali financeiro, ele analisa como é que tá a produção.

### **00:16:40** {#00:16:40}

**José Augusto:** A gente conforme todas as estruturas forem desenhadas, ele a gente vai concentrar isso num dashboard ali para ele ver, tipo, ah, o que que tá atrasado de produção, quanto que teve de desperdício, quanto, como é que tá a questão do estoque. Então a gente vai tentar através dos dados dar informações mais fáceis, né? A gente vai ter ali a camada de a onde ela vai estar integrada ao banco de dado deles, né?

### **00:17:02**

**José Augusto:** Informação da empresa dele, que pode facilitar tipo perguntas sápidas ou enfim eh instruções de uso. A gente vai ver como que vai fazer isso. Por exemplo, como o Notion, ele faz isso na plataforma dele, né? né? Tem uma IA integrada ali que consegue conversar com as as bases de dados e tanto na base de que como utilizar como tirar eventuais dúvidas sobre legislação, né? Que a gente vai ter essa base de conhecimento também.

### **00:17:34** {#00:17:34}

**José Augusto:** Funcionário operacional, tá? Quando a gente sai agora do dono, né? A gente tem dois tipos de funcionários operacionais. Então, a gente vai ter os usuários, que são colaboradores aí que t conta, que tenham acesso ao aplicativo e eles vão executar ações específicas, vão lidar com módulo específico. Então, o estoquista, ele vai trabalhar ali com modo de estoque, né? Mas, óbvio que, como eu falei anteriormente, ente ele a gente vai configurar quais são os acessos e ações, as permissões dele dentro do sistema, porque pode ser que um estoquista ele faça também, sei lá, um recebimento ou ele execute alguma outra função que não tá eh engessada ao

### **00:18:14**

**José Augusto:** estoque, né? Eh, assim como o chefe de cozinha, ele é focado na produção, mas ele tá, a gente pode permitir ele ou não, a fazer movimentações de estoque, a fazer inventário ou mudar alguma receita, né, um planejamento ali, eh, ou mudar alguma coisa de ingrediente. Enfim, a gente vai ter que definir muito bem esses escopos depois dos módulos estarem prontos. Eh, e também tem os colaboradores que eles existem no sistema, que vão precisar eh existir, né, mas que eles não executam ações dentro do sistema.

### **00:18:48**

**José Augusto:** Por que que isso existe? pra gente delegar funções, pra gente ter o registro isso dentro da plataforma, eh, para, por exemplo, o preenchimento de, eh, de lista de treinamento, a gente também ter o controle da saúde ocupacional, né, ter o registro do ASUS. Eh, também, por exemplo, a gente conseguir vincular um colaborador a um setor, alguma coisa específica. Então a gente vai ter que ter esse controle, mesmo que ele não execute ações dentro do sistema e a isso vai ser definido melhor lá paraa frente.

### **00:19:26** {#00:19:26}

**José Augusto:** Auditor vigilância sanitária, se algum fiscal da Anvisa bater na porta, com o sistema é acessado para comprovar a conformidade. Eh, dentro da nossa base de conhecimento, tem ali um guia da própria Anvisa ou do governo federal que que é validação de sistemas, né, que tem toda uma regra. Então, por exemplo, não ter o hard delete, ter soft delete, o sistema inteiro tem que ser auditável. E quem vai apresentar essa ferramenta para ele pode ser o próprio dono que comprou ou o consultor, que aí vai tá, por exemplo, as planilhas que foram preenchidas, estão ali com a assinatura do consultor, né?

### **00:20:02**

**José Augusto:** Os documentos, por exemplo, de homologação de fornecedores também tá em dia. A gente vai ter a central de documentos, né? Então, controle de pragas, eh, controle de retirada de resíduos, coleta de óleo, tudo isso aí a gente vai mapear quais são as documentações. Isso a gente tem também na pasta Legacy, tá? Do projeto que a gente já veio construindo, a gente tem a central de documentos lá, tá?

### **00:20:27** {#00:20:27}

**José Augusto:** E a muito importante, o sistema aí tem que ser já pensado desde o início na arquitetura dele para ser um modelo escalável, ou seja, a gente vai ter eh diversos consultores que vão utilizar plataforma. Cada um desses consultores pode ter vários clientes e vários clientes podem ter diversas unidades. Eh, essas unidades, inclusive elas podem ser diferentes perfis. por exemplo, ele pode ser apenas uma indústria que, por exemplo, produz um certo tipo de produto, por exemplo, uma confeitaria.

### **00:20:58**

**José Augusto:** eh uma empresa de caterin, um um restaurante ali institucional, mas eles podem ter perfis híbridos, né? Então eles podem, por exemplo, uma empresa de catering que faz para eventos, não tem expedição, mas eles também fornecem alimentação pros trabalhadores, né? A mesma coisa uma confeitaria, por exemplo, enfim. Eh, então a gente tem que pensar na arquitetura desde cedo para ela ser escalável, a suportar isso pra gente tentar otimizar sempre.

### **00:21:24** {#00:21:24}

**José Augusto:** Eh, e por enquanto é isso. Vamos pro próximo. Estruturas internas em mapeamento. Eh, então, como aí a gente vai ter que entender de ponta a ponta, né, cada um tipo de negócio, mas a ideia é que também seja personalizável. Então, quando a gente for implementar, vai ter uma parte de configuração. Então, diferentes tipos de de unidades de alimentação, restaurante, enfim, qualquer um tipo, vai ter seus próprios setores, né?

### **00:21:54**

**José Augusto:** Seus próprios locais de eh seus próprios setores de produção ou os locais ali de para transicionamento, né, para armazenamento, né, os estoques, eh, banheiros, cada um vai ter o seu perfil. Então, a, isso vai ser modulável, a gente pode criar ali para cada um. equipamento também. Então, equipamentos também são cadastrados. Eh, e aí você pode utilizar isso, buscar no legacy também, porque o equipamento ele é vinculado a algum setor, né, para saber onde que ele tá, ele é vinculado quais são os tipos de alimentos que são armazenados neles pra gente automatizar qual que é a faixa ideal,

### **00:22:33**

**José Augusto:** né, se ele é congelado, se ele é resfriado, se ele é um se é um equipamento quente, né? equipamentos que a gente vai ter também de medição de aferição de temperatura, afereiação de peso. A gente tem equipamentos, por exemplo, o de, por exemplo, estufa, a gente vai ter também ar condicionado. Tem diferentes tipos de de equipamentos que você pode buscar também no legacy, tá? Depois pra gente ter uma noção disso.

### **00:23:00** {#00:23:00}

**José Augusto:** Depois a gente vai destrinchar bem melhor, mas se você tem noção que a gente vai mapear todos os equipamentos que precisam eh ser monitorados ou que precisam de manutenção, enfim. Tá? Depois a gente pode, conforme a gente for avançando na documentação, a gente vai por partes, a gente distri melhor funcionários e treinamentos. Então, sim, o controle, o sistema vai controlar os exames médicos, certificados e boas práticas de cada funcionário, né?

### **00:23:27**

**José Augusto:** Além disso, a gente vai, isso vai pro setor de qualidade, mas a gente vai analisar desempenho também, né? Então tem uma série de planilhas que a gente também já pensou que tá dentro da pasta legacy, né, que depois a gente vai trazer melhor. Eh, mas também controle, por exemplo, de acidente de trabalho, tem um monte de coisa, permissões e ou hipóteses de forma exemplos de que pode não fazer. E aí nessa parte eu expliquei, né, conforme a gente for cadastrar um usuário dentro do sistema, o próprio dono ou o consultor, ele vai eh controlar esses acessos.

### **00:24:06**

**José Augusto:** Então, imagina que você foi na configuração, ele abriu um painel ali, acessos e permissões, né? Você clica, seleciona o usuário e aí ou enfim, tem ou você entra na configurações, tem ali o o a parte dos usuários, a gente vai manipular ali a os acessos e permissões dentro do sistema. E a gente tem por módulos. Então, por exemplo, o chefe de cozinha, o chefe de cozinha tem módulo produção, financeiro, eh, financeiro, qualidade e tal.

### **00:24:39**

**José Augusto:** Aí no dentro da produção a gente tem planejar receitas, não sei, tô dando exemplo. Aí cada módulo a gente, depois de terminar de construir cada módulo, a gente vai eh definir os os eventos, todas as regras de negócio de cada um e vai ficar muito claro quais são as ações que podem ser executadas dentro de um sistema. Depois tiver tiver isso muito bem mapeado, dentro dessa configuração dos usuários, a gente escolhe quais são permitidas para cada tipo, tá?

### **00:25:12** {#00:25:12}

**José Augusto:** legislação de modelo de negócio, né? Então, um núcleo duro, complicar, avaliação de rex do 15%. Então, a gente vai ter agora um momento de de discovery, né? Eu vou explicar aqui quais são os tipos de negócios que eu que eu penso em atender, né? A gente tem que entender, tipo, gente fazer uma investigação para se não ficou para ver se não ficou no da lacuna. E aí durante essa investigação a gente vai estabelecer a cada um qual base legal elas devem seguir, né?

### **00:25:44**

**José Augusto:** Então entendendo também a hierarquia da legislação no âmbito federal, estadual, municipal. Hoje a gente tá utilizando dois padrões, né? Então, a cidade de São Paulo, que tem que usar as as portarias, né, da cidade de São Paulo, do estado de São Paulo Federal e do Rio de Janeiro, né, da cidade do Rio de Janeiro, estado do Rio de Janeiro e e também um federal, tá? Eh, porque são as mais complexas, mas depois a gente entender, fazer essa investigação, ní quais são as investigações que a gente tem que fazer, entender quais são os tipos de negócio que a gente pode agrupar.

### **00:26:25**

**José Augusto:** né, mas também sempre segmentando. Então, por exemplo, uma cozinha institucional, a gente tem que lembrar que tem a escolar, tem trabalhador, a gente tem hospitalar, né? Eh, a gente tem o serviço de alimentação, por exemplo, Caton, um restaurante comercial. Eh, a gente tem diferentes tipos de de negócios ali que a gente vai ter que entender qual é a legislação que cada um deles tem que respeitar, tem que seguir, como que é a operação de cada um deles de ponta a ponta,

### **00:26:57**

**José Augusto:** né, pra gente destrinchar He. criar regra de negócio para cada módulo. Eh, e aí, por exemplo, dou exemplos aqui de como a gente vai automatizar. Então, para negócio de alimentação, a gente sabea, tem que ser preenchidas, elas têm que ser preenchidas e tem fases e temperaturas que devem ser respeitadas ali, né? E isso impacta diretamente na validade. Então, a ideia é a gente utilizar, né?

### **00:27:27** {#00:27:27}

**José Augusto:** E aí que eu tô pensando, que a gente já tem que pensar, eh, como que a gente vai criar essas regras de de para respeitar as legislações e como que a gente vai atualizar, né? Porque conforme as leis vão mudando, portarias novas são lançadas, atualizadas, o nosso sistema tem que replicar isso, né? Então, a gente tem que pensar numa forma de conseguir ter uma manutenção dessas regras de código. Pelo que fiz de pesquisa, normalmente as mudanças elas vão mudar muito em parâmetros.

### **00:27:59**

**José Augusto:** Dificilmente vai mexer em alguma regra de negócio, mas a gente tem que ter preparado para isso também. Tipo, posteriormente, a hora que a gente fizer essa investigação de cada tipo de negócio, quais são as legislações, qual de ponta a ponta, a gente vai entender melhor o que que vai ser parâmetro, o que que vai ser, por exemplo, um algoritmo, uma regra de negócio que vai mudar. Legislação geográfica, como vamos lidar com Visa versus uma regra municipal, hierarquia, né?

### **00:28:23**

**José Augusto:** Então, tipo, com o CEP, a gente sabe que cidade que ela tá aí normalmente, a, você pode corrigir se tiver errado, mas a legislação, né, municipal vem para complementar algo que a federal não ou a estadual não não rompeu, né? E se contradizer, a gente vai para hierarquia. O que a gente vai, por exemplo, estamos na cidade de São Paulo, a gente vai seguir a cidade de São Paulo.

### **00:28:54**

**José Augusto:** Ah, portaria, por exemplo, 2619, que é de São Paulo, não fala exatamente de um ponto onde a gente vai buscar essa lei. Ah, então vamos paraa estadual. Ah, estadual não tem uma uma parte que cuida disso. Ah, então vamos pra federal, né? Então, a federal ela meio que abraça tudo e a estadual ela especifica e controla outras coisas, a municipal também. Então, a gente tem que entender isso.

### **00:29:19**

**José Augusto:** Eh, e aí o CEP ele vai quando a gente cadastrar a empresa vai dizer qual que deve seguir. Essa é minha ideia, né? Então, por exemplo, estão na S de São Paulo, el tem que seguir a, por exemplo, a RDC 216 da Anvisa ou a 275, né, que uma é de manipulação de alimentos e outra é boas práticas de fabricação. Eh, além disso, depois, tipo, o estado de São Paulo, né, tem a hoje, se eu não me engano, é CVS1, né, e a municipal portaria 2619 e deve ter outros, tá?

### **00:29:55** {#00:29:55}

**José Augusto:** Mas aqui, só para dar um exemplo. Eh, a operação de ponta a ponta depende de quem que tá abrindo, qual módulo que ele vai utilizar, né? Então, eu vou dar exemplo da do consultor ou de um responsável técnico, ele cuida da parte de qualidade. Ele vai ver ali, ele sabe quais planilhas eles têm que executar agora. Ele já tem um planejamento de quais são as auditorias que ele tem que executar, quanto tempo, então tem o controle de suas atividades.

### **00:30:29**

**José Augusto:** Isso também, se eu não me engano, na pasta da legacy, a gente criou uma coisa para gestão de processos e pessoas e das tarefas, né? Então ele sabe quais planiras tem que preencher as as auditorias, ele sabe quais documentos estão vencendo. Então, por exemplo, ele ali, pô, eu tenho que renovar aqui o AV e o AVCB tá para vencer. Precisamos precisar aqui o dono pra gente correr atrás da atualização da VCB.

### **00:30:56**

**José Augusto:** Não, o o controle de pragas precisamos fazer de novo. Já vencer aqui ah o a limpeza dos reservatórios de água. Então, por esse controle ele consegue fazer, ele também consegue fazer, ah, teve a recebimento, mas a gente não fez mapeamento das das informações nutricionais de novos ingredientes que foram comprados. Então, ele sabe que isso acontecer. Então é realmente uma integração completa. Agora um estoquista ele vai olhar ali, vai abrir o módulo estoque e vai abrir o recebimento.

### **00:31:28**

**José Augusto:** Ah, tá para chegar algumas coisas hoje, né? Amanhã também. Então ele sabe uma visão de recebimento. Ele vai olhar ali, ele vai saber, pô, tem alimentos ali na câmara fria que eles estão perto da validade, eu já vou dar uma olhada, né? E aí já destina para algum lugar para resolver, né? ou se tá vencido ou uma qualidade ruim, já descarta, ele consegue fazer inventários, né?

### **00:31:51**

**José Augusto:** Eh, e aí, por exemplo, a produção solicitou ali para uma para fazer uma produção, eh, ele já fez um requerimento pro estoque. O estoquista já sabe que ele deve separar, qual lote ele deve separar, né? seguindo ali a ordem, eh, primeiro vence, primeiro que sai eh, então ele já consegue separar ali e evitar que alimentos fique vencendo ou que estrague dentro da geladeira. Eh, aí, por exemplo, um financeiro também tem uma outra requerimentos ali, por exemplo, de de eh limite de estoque para já se planejar com compra ou as demandas feitas, né?

### **00:32:29** {#00:32:29}

**José Augusto:** Então, depende muito de quem tá olhando, né? Qual que é o usuário, o que que ele mexe, o que acontece quando algo der errado, eh, vão ser gatilhos. Então, conforme você deu o exemplo aqui da geladeira, é preenchida ali a planilha de equipamentos e temperatura de alimentos. Se estiver fora, já gera uma notificação ali pro setor de qualidade, para ele averiguar. Ah, tá fora porque houve descongelamento.

### **00:32:58**

**José Augusto:** Então, antes de já executar alguma coisa, passa para uma validação. Outros a gente já pode criar alguma automação. Então, depende muito de como os módulos vão ser feitos, né? Mas a ideia é que se alguma coisa tiver fora do parâmetro, o sistema já funcione com uma forma de alerta. É uma forma de de realmente mostrar esse controle ali. Lembrando que tudo tudo tudo deve ser auditável. Então, se perguntou de fluxo assentação corretiva, depende.

### **00:33:26** {#00:33:26}

**José Augusto:** Teve o acidente, eh, tem que ser registrado, né? E aí registrou o acidente, tem que termente um plano de ação, tal, a gente criou ali um modelo também e quem é prova eh depende da função também, né? Mas normalmente para para esses exemplos que eu dei, quem quem aprovaria seria o consultor, o responsável da qualidade, um responsável técnico. Módulos escopo, né? Workfal. Quais são os módulos que precisam existir no dia um?

### **00:34:01**

**José Augusto:** Cara, a gente meio que tem todos ali no na legacy, mas todos. Mas acho que antes da gente colocar as temperaturas, a gente vai ter que fazer essa investigação, eh, tá, quais são os negócios que eu vou atender, né? A gente pode tanto dividir em grupos maiores e depois destrinchar, né? Então, por exemplo, serviço de alimentação, tem por kilo, tem delivery, tem eh Alacart, né? Ah, temos institucionais.

### **00:34:26**

**José Augusto:** Ah, temos a escola, alimentação escolar, a gente tem trabalhador, a gente tem hospitalar, a gente tem normal, não sei. Eh, ah, a gente tem a serv de alimentação, por exemplo, de caterine, não temos fabricação que envolve rotulagem. Então, a gente vai ter que dividir isso e entender de ponta a ponta a base legal, o que que elas devem seguir e entender de ponta a ponta a produção pra gente definir bem os módulos, né?

### **00:34:54**

**José Augusto:** Mas a ideia é que a gente tenha todos, não precisa ser agora. Acho que a gente vai entrar para uma etapa de investigação e desenvolvimento, né? Elaboração de um plano. Eh, os relatórios mais críticos depende da da estrutura. Acho que esse módulo aqui, escopo, a gente vai ter que eh entender melhor sobre o sistema. Acho que essa parte que eu não posso te responder ainda, porque tem inclusive no na pasta legacy que tem ali todo o nosso o nosso aplicativo, ele tem inúmeros tipos de relatórios.

### **00:35:39**

**José Augusto:** Tem auditorias, tem relatório de temperatura, tem relatório de acidente, tem relatório de tem um monte de coisa, né? E limites do sistema, o que que o dev não vai fazer? Nesse primeiro momento, a gente é uma parte exploratória. Acho tem que acho que a gente tem que entender o o que ele pode fazer. Então, por exemplo, até na parte do financeiro ou compras, a gente pode fazer uma automação ali que ele já faça uma cotação com os fornecedores padrões, né?

### **00:36:10**

**José Augusto:** Então, é um exemplo, não tô falando que a gente vai implementar isso, mas eu não quero colocar uma trava agora, né? né? Por exemplo, a gente pode inclusive depois conectar certos tipos de hardwares, por exemplo, eh, termômetros, né? Agora tem equipamentos que você coloca diretamente na câmera e a gente vai monitorando ao vivo a variação de temperatura do dos setores da da câmara, dos estoques, dos equipamentos, enfim.

### **00:36:39** {#00:36:39}

**José Augusto:** Eh, outra coisa que a gente tem que fazer, o sistema que a gente fez, que eu tava construído, a gente mapea tudo quais, porque, por exemplo, e aí você pode utilizar o legacy depois pra gente entender melhor, né? Pra gente, por exemplo, um local de armazenamento, a gente tem modalidades, então a gente tem alimentos, tem EPI, tem uniformes, tem produtos de limpeza, tem um monte de coisa. E aí um equipamento que ali armazena um alimento, ele pode também ser um, aliás, um local de armazenamento, né, um estoque.

### **00:37:14**

**José Augusto:** Ao mesmo tempo ele pode ser um equipamento, né? Isso a gente já tinha feito no outro sistema. Eh, a gente tem equipamentos de que precisa calibrar, né, tanto de temperatura quanto de peso. A gente tem ah coifas, por exemplo, que tem que monitorar ali a limpeza. Isso a gente também vincula o a fornecedores, questão de alimentos, eh, e até para até os prestadores de serviço, né?

### **00:37:42**

**José Augusto:** Então, quando a gente vai refazer um registro de alguma coisa, um controle, a gente sabe qual tipo de prestador de serviço executa qual coisa. Então, uma manutenção de equipamentos, ele tá ligado aos equipamentos, né? Ah, o mesmo de eh de manutenção de equipamentos, ele consegue fazer a calibragem de, por exemplo, balanças ou termômetros. Então, depende muito como a gente vai configurar. Então, a gente tem uma base que deve ser bem fundamentada e a gente pode utilizar do nosso antigo projeto ali para ter uma base e construir, né?

### **00:38:17**

**José Augusto:** tipo, eh, são setores, os setores a gente vincula equipamento ao setor. Um equipamento pode ser ao mesmo tempo um local de armazenamento, né? A gente vai ter setores de produção, vai ter setores de, por exemplo, banheiros, vai ter setor de de recebimento, de transição, enfim, vai ter bastante coisa que a gente tem que entender. Então, a gente vai ter que construir essa arquitetura do não do zero, né?

### **00:38:41** {#00:38:41}

**José Augusto:** Mas a gente tem que deixar muito bem documentado, definido o que é cada coisa pra gente começar antes de começar a codificar. Então, se eu pudesse dar alguma dica, né? Mas aí vamos ver o que que o os princípios do mainspec, o arcanum vão dizer. Mas acho que é entender agora quais são os tipos de negócio pra gente começar a entender base legal e como que é de ponta a ponta a operação de cada um desse tipo de negócio. theing aboutentweent

### **A transcrição foi encerrada após 00:40:30**

*Esta transcrição editável foi gerada por computador e pode conter erros. As pessoas também podem alterar o texto depois que ele for criado.*