---
tags: [incamp, edital, candidatura, produto, estrategia]
node_type: application-draft
layer: market
nature: reference
status: draft
version: 0.1.0
last_updated: 2026-08-11
---

# Nutridev — V0 da candidatura à INCAMP

> Documento de trabalho baseado no `EDITAL-INCAMP-2025`. Não é uma versão pronta para submissão. Todo marcador `[PREENCHER]` exige informação ou evidência dos fundadores. O legado é tratado como antecedente experimental, nunca como produto V2 operacional.

## 1. Leitura estratégica

### Posicionamento em uma frase

O Nutridev propõe uma plataforma operacional vertical e modular para negócios de alimentação, iniciada pela coordenação da qualidade entre consultorias, empresas e unidades.

### Narrativa executiva

O problema estrutural é a fragmentação dos dados e processos entre os setores do negócio alimentar. Na experiência relatada pelo fundador como consultor, um mesmo fato pode ser recriado em planilhas, mensagens e documentos incompatíveis: a ficha técnica mantida pela qualidade diverge da receita usada na produção e dos dados considerados por compras e financeiro. Isso gera redigitação, inconsistência e decisões baseadas em versões diferentes.

A hipótese de diferenciação é fazer um registro governado produzir efeitos coerentes em múltiplos contextos, sem criar novas fontes concorrentes. Um núcleo comum representa organizações, unidades, pessoas, regras, documentos, evidências, permissões e eventos; os módulos são habilitados conforme a operação e o tipo de negócio. Audit/CAPA é a primeira porta observável: a consultoria conduz a auditoria, a empresa responde aos achados e autoridades definidas validam as ações, preservando autoria, versão e histórico.

O `_legacy` contém a formulação funcional mais avançada da visão do Nutridev e protótipos de checklist, fotos, não conformidades, ações, PDF/GED e módulos operacionais. Esse projeto não foi finalizado. Ele funciona simultaneamente como fonte da ambição modular, registro de aprendizado e evidência de prototipação; não prova um produto integrado, seguro ou validado. O projeto novo reconstrói essa visão com documentação, arquitetura, segurança, testes e boas práticas de desenvolvimento mais rigorosas. A V2 encontra-se em descoberta e desenho estruturado, sem implementação alegada.

A entrada proposta é por consultorias de alimentos, que podem implementar o primeiro fluxo em múltiplos clientes e unidades e sugerir novos módulos conforme as necessidades observadas. Empresas de alimentação também podem contratar diretamente. Esse modelo de canal e a prioridade de Audit/CAPA ainda serão testados em campo.

O escopo demonstrável da candidatura não tenta implementar de uma vez RH, ASO, expedição, estoque, compras, produção, nutrição, solvers ou IA. Isso é uma decisão de sequência, não a negação da visão. Alguns módulos futuros serão habilitados conforme o tipo de negócio, a operação, a jurisdição e a necessidade validada. Na V0, se uma auditoria identificar requisito de ASO ou RH, será registrada somente uma pendência documental no processo de qualidade, sem copiar o documento ou dados de saúde.

Audit/CAPA é o recorte escolhido para tornar a candidatura e a primeira validação observáveis. O horizonte do Nutridev é uma plataforma modular para operações de alimentos, na qual um núcleo comum de organizações, unidades, pessoas, regras, documentos, evidências e workflows sustenta módulos contextuais. Conforme o tipo de negócio, isso pode incluir demanda, cardápio, compras, estoque, produção, expedição, qualidade, gestão de pessoas e requisitos ocupacionais, desperdício e otimização. Esses módulos não integram a V0, não estão implementados na V2 e somente serão promovidos após evidência de aplicabilidade, recorrência, disponibilidade de dados e capacidade de entrega.

### As quatro camadas que não devem ser confundidas

| Camada | Papel na narrativa | O que não significa |
|---|---|---|
| Visão do produto | Plataforma modular adaptável aos diferentes tipos de operação de alimentos. | Não significa que todos os clientes receberão todos os módulos. |
| `_legacy` | Expressão funcional mais avançada dessa visão, projeto inacabado e fonte de protótipos/aprendizado. | Não significa produto pronto, seguro, integrado ou validado. |
| Projeto novo/V2 | Reconstrução da visão com melhores definições, documentação, arquitetura e práticas de desenvolvimento. | Não significa abandono ou redução definitiva da ambição. |
| V0 para a INCAMP | Recorte narrativo e experimental que permite à banca compreender e testemunhar um fluxo completo. | Não significa que Audit/CAPA seja o limite final do produto ou um wedge já validado. |

### Arquitetura de aplicabilidade modular

O produto não deve ser descrito como uma coleção indiscriminada de funcionalidades. A composição pretendida é:

1. **Núcleo comum:** organizações, unidades, pessoas e papéis, regras, documentos, evidências, permissões e histórico.
2. **Fluxos transversais:** auditoria/CAPA, controle documental, treinamentos, requisitos e indicadores.
3. **Módulos condicionais ao negócio:** por exemplo, expedição onde existe operação de saída; estoque e produção onde há transformação e consumo; controles de pessoas e ASO onde a necessidade operacional e jurídica for validada.
4. **Camada de inteligência:** análises, previsão e otimização somente quando os módulos anteriores produzirem dados confiáveis e houver benefício mensurável.

A regra arquitetural é que a aplicabilidade de um módulo depende do perfil do negócio e de contratos explícitos com o núcleo comum; não da intenção de transformar o Nutridev em um ERP horizontal genérico.

### Escala de evidência

| Grau | Significado | Situação atual |
|---|---|---|
| G0 | Sem evidência disponível | Mercado, tração, finanças e impacto ainda têm lacunas materiais. |
| G1 | Hipótese, regra ou arquitetura documentada | Estado da V2 e do fluxo Audit/CAPA proposto. |
| G2 | Antecedente experimental ou protótipo legado | Checklists, fotos, NCs, ações, PDF/GED e outros protótipos. |
| G3 | Fluxo V2 integrado e demonstrável | Ainda não alcançado. |
| G4 | Validação externa repetida, com resultados mensurados | Ainda não alcançado. |

O teto evidencial atual é G2. A candidatura não deve converter volume de código legado em alegações de segurança, integração, conformidade, tração ou impacto.

## 2. Rascunho do Anexo I

As contagens são aproximadas e precisam ser refeitas depois da substituição dos marcadores.

### 2.1 Identificação

- Razão social: `[PREENCHER: razão social ou informar proponente pessoa física]`
- Nome fantasia: `[PREENCHER]`
- CNPJ: `[PREENCHER]`
- CNAE principal: `[PREENCHER]`
- Endereço: `[PREENCHER]`
- Proponentes/sócios: `[PREENCHER: nomes completos]`
- RG/CPF: `[PREENCHER]`
- Data de nascimento: `[PREENCHER]`
- Endereço residencial: `[PREENCHER]`
- E-mail: `[PREENCHER]`
- Celular: `[PREENCHER]`
- Formação acadêmica: `[PREENCHER]`
- Área de atuação: `Software B2B vertical para integração de dados, qualidade e operações de negócios de alimentação.`
- Principais produtos: `Plataforma operacional modular em descoberta. O primeiro produto validável é um fluxo multi-organização de Audit/CAPA; não há V2 implementada ou comercialmente validada nesta etapa.`
- Modalidade: `[PREENCHER: residente ou não residente]`
- Aceita modalidade não residente se não houver espaço: `[PREENCHER: sim ou não]`

### 2.2 Resumo do projeto — limite de 1.500 caracteres

Contagem conservadora do Markdown nesta revisão: 1.208 caracteres; texto efetivo sem marcadores: 1.206.

> O Nutridev propõe uma plataforma operacional vertical e modular para negócios de alimentação. O problema observado pelo fundador em sua atuação como consultor é a fragmentação de dados: qualidade, produção, estoque, compras e financeiro podem registrar o mesmo ingrediente, receita, requisito ou ocorrência em ferramentas diferentes, gerando redigitação e inconsistência. A plataforma terá um núcleo comum de organizações, unidades, pessoas, regras, documentos, evidências e permissões; módulos serão habilitados conforme o tipo de operação. A entrada será pela qualidade, com um fluxo Audit/CAPA que conecta consultoria, empresa e unidade: auditoria, achado, ação corretiva, evidência, validação e relatório preservado por versão. Esse primeiro fluxo deverá estabelecer fatos governados que, após validação, possam ser reutilizados por módulos contextuais. O `_legacy` contém a formulação funcional mais ampla e protótipos, mas ficou inacabado. A nova versão está em descoberta e desenho para uma reconstrução com melhores definições, arquitetura, segurança, testes e práticas de desenvolvimento. A incubação será usada para validar problema, mercado, diferenciação, arquitetura e modelo econômico antes da expansão modular.

### 2.3 Perfil empreendedor — até 1.000 caracteres por resposta

#### Qual é sua maior motivação para empreender?

> A ideia nasceu da minha experiência como consultor de alimentos, ao observar empresas repetindo registros e mantendo versões divergentes dos mesmos dados entre qualidade, produção, estoque, compras e financeiro. `[PREENCHER: caso concreto, período e resultado observável dessa experiência.]` Minha motivação é transformar esse aprendizado numa plataforma que preserve contexto e permita evolução modular, sem repetir os problemas do projeto legado inacabado. Quero validar cada hipótese antes de ampliar o escopo e construir um negócio sustentável que melhore a coordenação das operações de alimentação.

#### Quais são suas expectativas ao participar do Programa de Incubação?

> Esperamos usar a incubação para reduzir as incertezas centrais do empreendimento: confirmar o perfil de cliente, observar a recorrência do ciclo Audit/CAPA, comparar alternativas concorrentes, testar disposição a pagar, definir o modelo comercial e amadurecer a arquitetura multi-organização. Também buscamos orientação em estratégia, propriedade intelectual, aspectos jurídicos, finanças, vendas B2B e formação de parcerias. Ao final das primeiras etapas, queremos ter evidência suficiente para decidir entre avançar, alterar o wedge ou interromper a hipótese. `[PREENCHER: recursos específicos da INCAMP que serão utilizados.]`

#### Como você se mantém atualizado sobre tendências em inovação e no mercado?

> `[PREENCHER: fontes realmente utilizadas por cada integrante — eventos, associações, periódicos, cursos, comunidades, clientes, normas e frequência.]` Para este projeto, propomos combinar entrevistas com consultorias e responsáveis por unidades, análise estruturada de concorrentes, acompanhamento de requisitos aplicáveis e testes frequentes de protótipos. Aprendizados serão registrados como hipótese, evidência, lacuna e próximo experimento, evitando tratar tendências ou percepções isoladas como validação de mercado.

#### Qual é a disponibilidade de cada integrante?

> `[PREENCHER: nome, vínculo profissional atual, disponibilidade por dias/períodos, data possível de início e condições para ampliar a dedicação.]` A dedicação deverá ser compatível com as responsabilidades e os marcos apresentados no projeto.

#### Quantas horas semanais serão dedicadas por cada integrante?

> `[PREENCHER: Nome — função — X horas/semana. Informar eventuais mudanças previstas durante a incubação.]`

### 2.4 Qualificação da equipe — até 1.500 caracteres por resposta

#### Formação

> `[PREENCHER: integrante, curso, nível, instituição, ano de conclusão ou situação atual e relação da formação com o projeto.]`

#### Experiência

> `[PREENCHER: experiências profissionais e empreendedoras relevantes, duração, responsabilidades e resultados comprováveis.]`

#### Idiomas

> `[PREENCHER: idioma e nível real de leitura, escrita, conversação e compreensão de cada integrante.]`

#### Competências técnicas necessárias

> O projeto requer competências em operações de alimentação, qualidade e legislação aplicável; descoberta de produto B2B; modelagem de dados e processos entre módulos; experiência do usuário; engenharia de software; segurança multi-organização; testes; vendas consultivas e análise financeira. A equipe já dispõe de `[PREENCHER: competência, integrante e evidência]`. A experiência relatada pelo fundador e o legado indicam conhecimento do domínio e capacidade de prototipação, sem comprovar arquitetura pronta para produção. Precisam ser desenvolvidas ou obtidas por parceria: pesquisa por tipo de negócio; aplicabilidade regulatória; autorização de registros e arquivos; versionamento e trilha; testes automatizados; proteção de dados; arquitetura modular; precificação e vendas. `[PREENCHER: parceiros.]`

#### Competências atuais e futuras que constituem diferenciais

> O diferencial pretendido é combinar conhecimento das operações de alimentação com capacidade de modelar dados compartilhados, regras contextuais e fluxos entre setores. Isso inclui representar organizações, perfis híbridos de unidade, autoridades, versões e eventos; no primeiro recorte, também exige distinguir evidência de detecção e de resolução, rejeição, fechamento e reabertura. A experiência e as competências comprováveis são: `[PREENCHER]`. Como competências futuras, o projeto deverá consolidar arquitetura modular segura, aplicabilidade por tipo de negócio, implantação assistida por consultorias e experimentação comercial. Elas ainda não devem ser descritas como domínio adquirido.

#### Funções e atribuições dos membros

> `[PREENCHER: Nome — papel — decisões sob sua responsabilidade — entregas nos primeiros 12 meses — dedicação semanal. Repetir para todos os empreendedores, colaboradores e docentes.]` Indicar separadamente responsabilidades por produto/domínio, tecnologia/segurança, comercial/parcerias e gestão financeira.

#### Participação de docente da Unicamp

> `[PREENCHER: não há participação prevista; ou nome, unidade, função, dedicação e eventual participação formal na empresa.]`

### 2.5 Grau de inovação — até 2.000 caracteres por resposta

#### Descrever a solução proposta

> A solução proposta é uma plataforma operacional vertical e modular para negócios de alimentação. Um núcleo comum representa organizações, unidades, pessoas, papéis, regras, documentos, evidências, permissões e eventos. Cada unidade poderá combinar perfis operacionais, e somente os módulos aplicáveis ao seu contexto serão habilitados. A entrada será pela qualidade: consultorias poderão conduzir auditorias em clientes e unidades, registrar achados e evidências, abrir não conformidades e acompanhar planos e ações. A empresa submeterá evidências de resolução; uma autoridade definida poderá aceitar, rejeitar, fechar ou reabrir o caso; o relatório será preservado por versão. Esse fluxo inicial testa fronteiras, autoria e histórico entre organizações. No horizonte, registros governados poderão compor-se com documentos, temperatura, equipamentos, pessoas, ficha técnica, estoque, produção e expedição sem redigitação. Esses módulos não integram a V0 e dependerão de pesquisa por tipo de negócio. ASO e RH não serão implementados no recorte inicial; eventual evolução exigirá necessidade validada, minimização de dados e análise jurídica.

#### Descrever a inovação tecnológica e explicar sua relevância

> A base tecnológica consiste na aplicação sistemática de engenharia de software, modelagem de dados, regras versionadas e controle de acesso à integração de processos de alimentação. A hipótese de inovação não está nos módulos isolados, mas na composição: um fato governado deve manter significado, autoria, versão e efeitos ao atravessar contextos. O núcleo proposto combinará perfis operacionais de unidade, aplicabilidade contextual, contratos entre módulos, eventos e autorização por organização, vínculo e papel. O primeiro testemunho materializa esse mecanismo numa máquina de estados de Audit/CAPA, com linhagem entre evidência de detecção e de resolução, rejeição, reabertura, relatório por versão e testes negativos de isolamento. Um segundo contrato futuro é a ficha técnica governada, reutilizada por produção, demanda, compras, custos e, quando aplicável, nutrição/rotulagem. Esses mecanismos são requisitos preliminares, não controles já comprovados. A relevância será validada por benchmark e pilotos que meçam redigitação, inconsistência, tempo e workarounds. A hipótese perde força se a composição não superar ferramentas configuráveis ou exigir a construção simultânea de um ERP horizontal.

#### Informar o estágio de desenvolvimento

> A nova versão está em descoberta estruturada e desenho, classificada internamente como G1. Não há implementação integrada, produto comercial validado, tração, impacto mensurado ou controles de segurança comprovados. O `_legacy` contém a formulação funcional mais ampla da visão e protótipos de checklist, registro fotográfico, não conformidades, ações corretivas, relatórios PDF, gestão documental e outros módulos; esse projeto permaneceu inacabado. Os artefatos demonstram capacidade de prototipação e aprendizado de domínio, mas não integram a V2 nem comprovam segurança, validação, integração ou prontidão comercial. O projeto novo está em descoberta e desenho para reconstruir a visão com melhores definições e práticas. As próximas etapas são pesquisa de campo, protótipo navegável, benchmark, prova técnica multi-organização, teste do ciclo e pilotos. `[PREENCHER: TRL formal e justificativa compatível.]`

#### Informar a viabilidade técnica e econômica

> A viabilidade técnica é plausível, não demonstrada. Aplicação web, banco relacional, armazenamento, autenticação e relatórios são tecnologias disponíveis. Os riscos estão na segregação entre organizações, autorização de arquivos, preservação de versões, contratos entre módulos, atualização de regras e testes. A prova técnica começará pelo fluxo Audit/CAPA e por um único evento externo, como temperatura fora do parâmetro, antes de qualquer expansão. A viabilidade econômica permanece aberta. Consultorias podem permitir que uma implantação alcance múltiplas unidades, mas precisam ser medidos frequência, implantação, suporte, disposição a pagar, ciclo de venda, retenção e margem. O modelo proposto é assinatura B2B com `[PREENCHER: unidade de cobrança]`. Serão comparados preço e custo em dois ou três pilotos. O plano modular usa gates para impedir construção simultânea: só se promove um contexto quando ele demonstra valor independente e reutilização real do núcleo.

### 2.6 Potencial de mercado — limite conservador de 1.500 caracteres para o bloco

Contagem conservadora do Markdown nesta revisão: 1.114 caracteres; texto efetivo sem marcadores: 1.094.

> **a)** O mercado inicial é o de consultorias que apoiam operações de alimentos em `[PREENCHER: região/subsegmentos]`; empresas atendidas são beneficiárias e potenciais contratantes diretas. A oportunidade é reduzir fragmentação entre qualidade e operação, começando por um fluxo compartilhado. Ameaças incluem eQMS/CAPA, ERPs verticais ou genéricos, ferramentas pontuais, desenvolvimento interno, resistência à mudança e vendas longas. Tamanho e crescimento ainda exigem fontes.
>
> **b)** Concorrentes nominais: `[PREENCHER]`. Substitutos incluem eQMS/CAPA, checklists, gestores documentais, portais de consultoria, ERPs e planilhas. A vantagem a testar é combinar implantação pela qualidade, governança consultoria–cliente–unidade e reutilização posterior dos mesmos dados por módulos contextuais. Não há vantagem validada.
>
> **c)** Clientes iniciais: `[PREENCHER: perfil]`. A entrada propõe consultorias parceiras, observação de campo e 2–3 pilotos; venda direta à empresa permanece possível. Canais: venda consultiva, especialistas e indicação. Clientes/parcerias confirmados: `[PREENCHER ou declarar que não há]`.

### 2.7 Aspectos financeiros — limite de 1.000 caracteres

Contagem conservadora do Markdown nesta revisão: 929 caracteres; texto efetivo sem marcadores: 907. A margem é crítica e o bloco deverá ser reescrito depois da inclusão dos números.

> O orçamento de desenvolvimento ainda será consolidado. São necessários recursos para dedicação da equipe, pesquisa com usuários, design, desenvolvimento, infraestrutura, armazenamento, segurança, testes, suporte jurídico/proteção de dados, comercialização e pilotos. Necessidade total: R$ `[PREENCHER]`, distribuída em `[PREENCHER: 6, 12 e 36 meses]`. Capital disponível: R$ `[PREENCHER]`, de origem `[PREENCHER]`. Fontes pretendidas: `[PREENCHER: capital próprio, receita, fomento, investimento ou outras, somente se reais]`. O modelo inicial a testar é assinatura B2B, com preço e unidade de cobrança ainda não definidos. Receita prevista: meses 1–12 R$ `[PREENCHER]`; 13–24 R$ `[PREENCHER]`; 25–36 R$ `[PREENCHER]`. Despesas nos mesmos períodos: R$ `[PREENCHER]`, R$ `[PREENCHER]` e R$ `[PREENCHER]`. As projeções devem explicitar clientes pagantes, ticket, implantação, churn, nuvem, pessoal, vendas, impostos e contingência.

### 2.8 Impacto socioambiental — limite de 1.000 caracteres

Contagem conservadora do Markdown nesta revisão: 769 caracteres; texto efetivo sem marcadores: 767. O bloco deverá ser recontado depois da inclusão das metas.

> O impacto é uma hipótese a medir. Ao reutilizar registros entre qualidade e operação, o projeto poderá reduzir redigitação, inconsistência e atraso na resposta a desvios. Indicadores candidatos: horas de consolidação, registros duplicados, divergências de versão, tempo entre detecção e decisão, NCs resolvidas no prazo e recorrência do mesmo achado. Nenhuma melhoria está comprovada. O empreendimento priorizará retenção mínima de dados, descarte seguro de informações/equipamentos e atendimento remoto quando adequado. Metas, linha de base, período e amostra: `[PREENCHER]`. Impactos sobre desperdício ou recursos somente serão alegados quando o módulo causal correspondente estiver implantado e medido. O software não garante conformidade ou segurança dos alimentos.

### 2.9 Aderência aos propósitos da INCAMP

#### Como teve conhecimento da incubadora?

> `[PREENCHER: canal, evento, pessoa, instituição, busca ou comunicação específica e data aproximada.]`

#### Razão para querer se instalar na incubadora

> O projeto procura a INCAMP para transformar uma hipótese tecnicamente plausível em empreendimento validado, com método e evidências. A incubação poderá apoiar a equipe na descoberta de mercado, desenho do modelo de negócio, arquitetura e segurança, propriedade intelectual, planejamento financeiro, formação de parcerias e preparação comercial. A proximidade com o ecossistema da Unicamp é relevante para confrontar premissas com conhecimento técnico e empresarial, sem antecipar resultados. Esperamos sair do programa com uma decisão sustentada sobre o wedge, um ciclo demonstrável, pilotos com critérios definidos e capacidade de justificar continuidade, mudança ou encerramento. `[PREENCHER: motivos específicos para a modalidade e recursos concretos da INCAMP.]`

- Data: `[PREENCHER]`
- Assinatura: `[PREENCHER]`

## 3. Matriz critério–evidência–lacuna–prova

| Critério | Peso/gate | Tese admissível | Evidência atual | Lacuna e prova requerida |
|---|---:|---|---|---|
| Documento e coerência | Eliminatório | Um wedge, um estágio e um roadmap coerentes | Recorte Audit/CAPA definido | Preencher todos os campos, assinatura, taxa e anexos; remover contradições. |
| Base tecnológica | Eliminatório | O produto depende de software, dados e controles técnicos | Protótipos legados G2 | Prova técnica integrada; não confundir legado com V2. |
| Legalidade | Eliminatório | Atuação deverá observar contratos, proteção de dados e regras aplicáveis | Sem comprovação informada | Identidade legal, CNAE, IP, termos, tratamento de dados e impedimentos. |
| Perfil empreendedor | 10 | Equipe orientada a aprendizagem e teste | `[PREENCHER]` | Motivação autêntica, dedicação e rotina de atualização. |
| Equipe | 15 | Competências complementares de domínio, tecnologia e negócio | `[PREENCHER]` | CVs, atribuição de artefatos, papéis, dedicação, lacunas e parceiros. |
| Inovação | 15 | Núcleo comum, aplicabilidade contextual e composição governada entre módulos; Audit/CAPA é o primeiro witness | Desenho G1; visão/protótipos legados G2 | Benchmark, thin slice e prova de reutilização sem redigitação. |
| Mercado | 10 | Consultorias podem multiplicar o uso por clientes/unidades | Hipótese G1 | ICP, entrevistas, mercado, concorrentes, dor e disposição a pagar. |
| Financeiro | 15 | Assinatura B2B pode ser viável | G0 | Orçamento, capital, preço, CAC, implantação, margem e projeção de 36 meses. |
| Impacto | 10 | Melhor coordenação pode gerar efeitos positivos | Relação causal G1 | Linha de base, indicadores, amostra e medição. |
| Aderência | 10 | A incubação reduz riscos tecnológicos e empresariais | Necessidades identificadas | Ligar recursos concretos da INCAMP a entregas e indicadores. |
| Qualidade da proposta | 15 | Escopo estreito, hipóteses falsificáveis e marcos claros | Wedge, witness e critérios de morte | Tornar equipe, orçamento, cronograma e resultados específicos. |

## 4. Ledger de afirmações

| ID | Afirmação | Classe | Regra de uso |
|---|---|---|---|
| C01 | Existem artefatos legados de checklist, fotos, NC, ações, PDF/GED e P&D algorítmico | Evidência G2 | Pode ser dito com ressalva e identificação do artefato. |
| C02 | Os artefatos formam o novo produto integrado | Não suportada | Proibida. |
| C03 | A V2 está em descoberta e desenho estruturado | Evidência G1 | Deve ser dita. |
| C04 | A solução será uma plataforma operacional vertical e modular; Audit/CAPA será o primeiro fluxo | Hipótese de produto | Usar como proposta, nunca como capacidade atual. |
| C05 | Núcleo comum, composição entre módulos e relação consultoria–cliente–unidade geram valor | Hipótese | Exige entrevistas, benchmark, protótipo e pilotos. |
| C06 | A solução reduz tempo, custos, riscos ou NCs | Não comprovada | Somente como efeito a medir. |
| C07 | O sistema é seguro, imutável, auditável, conforme ou aderente à LGPD | Não comprovada | Proibida no presente. |
| C08 | Controles de banco e arquivos resolverão a segregação | Hipótese técnica | Exige políticas específicas e testes negativos. |
| C09 | Há tração, clientes, receita, parcerias ou mercado validado | Não informado | Proibida sem prova. |
| C10 | A inovação cria uma nova categoria | Não sustentada | Proibida. |
| C11 | Consultorias são um canal multiplicador | Inferência comercial | Testar. |
| C12 | Audit/CAPA é o melhor wedge | Hipótese falsificável | Manter somente enquanto superar critérios de morte. |
| C13 | Documentos, temperatura, fornecedores, ficha técnica e pessoas podem compor o núcleo com fluxos contextuais | Hipótese arquitetural | Testar dependências; não prometer implementação simultânea. |
| C14 | ASO/RH já são módulos da V2 ou da V0 | Não suportada no presente | Proibida como capacidade atual; podem permanecer como módulos condicionais da visão futura. |
| C15 | IA, nutrição ou solvers diferenciam a V2 atual | Não suportada no presente | Proibida como capacidade atual; o legado pode demonstrar exploração e a visão futura pode condicioná-los a dados e validação. |
| C16 | Há viabilidade técnica | Plausibilidade | Formular como hipótese e plano de prova. |
| C17 | Há viabilidade econômica | Não comprovada | Depende de preço, custo, retenção e vendas. |
| C18 | O fluxo preservará custódia histórica | Requisito de design | Não afirmar como implementado. |

## 5. Mapa de capacidades e fronteira de escopo

| Camada | Capacidades | Decisão V0 |
|---|---|---|
| Núcleo comum da plataforma | Organizações, consultorias, empresas, unidades, pessoas/usuários, papéis, perfis operacionais, regras, documentos, evidências, permissões, versões e eventos | Definir de modo mínimo; implementar somente o necessário ao primeiro slice. |
| Primeiro fluxo | Auditoria versionada; achados; NC; planos/ações; submissão; rejeição/aceite; fechamento/reabertura; relatório por versão; ciência/contestação | Construir e validar como entrada pela qualidade. |
| Conexões estruturais candidatas | Document Control; temperatura; equipamentos; treinamentos; fornecedores; ficha técnica | Testar como fontes/consumidores de eventos; promover somente por evidência. |
| Referência mínima | Pendência documental genérica vinculada a um requisito auditado, sem cópia de documento de saúde | Somente se o processo real exigir. |
| Módulos contextuais fora da V0 | Expedição, estoque, compras, produção, cardápio, nutrição, pessoas/RH e controles de ASO | Pertencem à visão modular quando aplicáveis ao tipo de negócio; cada um exige descoberta, fronteira e validação próprias. |
| Inteligência futura | IA, previsão, CSP/NSGA-II e outras otimizações | Ativar somente sobre dados confiáveis, com caso de valor e avaliação. |
| Exclusões do recorte atual | Conteúdo clínico, folha, ponto e suíte horizontal de RH | Não implementar na V0; qualquer inclusão futura exige tese de domínio, necessidade e análise jurídica próprias. |

Regra de fronteira para ASO/RH:

> A V0 não gerencia saúde ocupacional ou RH. Se uma auditoria identificar requisito dessa natureza, registrará somente que existe uma pendência documental no processo de qualidade, sem copiar o documento ou dados de saúde. Na visão futura, controles de pessoas ou ASO podem existir como módulos condicionais para tipos de negócio em que sejam relevantes, mas dependerão de necessidade validada, análise jurídica, minimização e desenho específico de acesso.

## 6. Testemunhos e roteiro de demonstração

A demonstração abaixo é um contrato futuro, não uma descrição de funcionalidade já implementada.

1. A consultoria cria a auditoria V1 para Cliente A / Unidade 01 e designa auditor e responsáveis.
2. O auditor registra requisito, achado, foto e observação.
3. O achado gera uma NC com autoria, data e versão.
4. A unidade contesta ou aceita a NC e propõe plano, responsável e prazo.
5. A unidade conclui uma ação e envia evidência de resolução.
6. O revisor rejeita a primeira submissão com justificativa; o histórico permanece.
7. A unidade envia nova evidência sem sobrescrever a anterior.
8. O revisor aceita e fecha a NC.
9. Uma nova ocorrência provoca reabertura, preservando o fechamento anterior.
10. O sistema preserva a versão do relatório correspondente à auditoria.
11. O relatório é compartilhado; o destinatário registra ciência ou contestação daquela versão.
12. O acesso de um usuário à unidade é removido; registros e arquivos deixam de estar disponíveis.
13. O log registra ator, organização, ação, instante, objeto e versão.
14. Um usuário do Cliente B tenta acessar dados do Cliente A e é bloqueado.

Critérios de sucesso:

- nenhum estado anterior é sobrescrito;
- decisões exigem autoridade contextual;
- arquivos obedecem à mesma fronteira dos registros;
- fechamento e reabertura são distinguíveis;
- relatório reproduz a versão preservada;
- tentativas entre organizações são negadas e testadas;
- o ciclo é concluído sem planilha como fonte paralela de verdade.

### Testemunho 2 — contrato futuro de composição

Uma ficha técnica governada é criada e versionada como fonte comum. A mesma versão alimenta instrução de produção e, conforme o tipo de negócio, cálculo de demanda e compras, custo e informação nutricional/rotulagem. Uma alteração gera nova versão, preserva a anterior e identifica quais consumidores precisam ser recalculados ou revistos.

Esse testemunho não descreve capacidade V2 existente. Sua função no edital é mostrar, sem listar dezenas de telas, como o núcleo e os contratos entre módulos pretendem atacar a fragmentação relatada pelo fundador.

### Thin slice alternativo para testar composição mais cedo

`equipamento/local + regra de temperatura → aferição manual → desvio → alerta à qualidade → avaliação → CAPA → ação/evidência → validação → relatório/histórico`

Esse fluxo deverá ser comparado com Audit/CAPA puro e documento/vencimento por frequência, valor, repetição e disposição a pagar.

## 7. Plano e milestones propostos

Todos os marcos dependem de equipe e orçamento ainda não fornecidos.

| Horizonte | Entregas propostas | Gate |
|---|---|---|
| 0–6 meses | `[PREENCHER: nº]` entrevistas; observação de auditorias; benchmark nominal; protótipo navegável; autoridades/invariantes; orçamento e preço inicial | Prosseguir se dor, frequência, comprador e alternativa atual forem identificados. |
| 7–12 meses | Prova técnica multi-organização; ciclo controlado; testes de isolamento; 2–3 pilotos; métricas e instrumentos comerciais | Mudar o wedge se o benchmark cobrir de modo equivalente as etapas críticas ou se os pilotos não repetirem o ciclo. |
| 13–18 meses | MVP restrito; pilotos acompanhados; análise de uso, implantação, suporte, disposição a pagar e recorrência | Comercializar se houver uso repetido, valor percebido e custo sustentável. |
| 19–36 meses | Aprimorar produto, vendas e suporte; explorar uma adjacência por vez; expansão `[PREENCHER]` | Promover Document Control/Temperatura se evidência superar Audit/CAPA em recorrência e valor. |

## 8. Pitch de 9 slides

1. **Problema:** o mesmo fato operacional é redigitado por setores em sistemas e versões incompatíveis.
2. **Visão:** plataforma operacional vertical e modular para diferentes negócios de alimentação.
3. **Mecanismo:** núcleo comum, aplicabilidade contextual e contratos entre módulos.
4. **Entrada:** consultorias implantam qualidade em clientes e unidades; venda direta também é possível.
5. **Primeiro witness:** auditoria → NC → ação → evidência → validação → relatório/ciência.
6. **Composição futura:** uma ficha técnica governada serve produção, demanda/compras, custo e informação nutricional conforme aplicabilidade.
7. **Estado real:** `_legacy` amplo e inacabado; V2 em reconstrução; lacunas explicitadas.
8. **Mercado/equipe/economia:** ICP, benchmark, pilotos, competências, orçamento e marcos `[PREENCHER]`.
9. **Pedido à INCAMP:** validar tecnologia, mercado, finanças e sequência modular.

## 9. Perguntas prioritárias aos fundadores

### P0 — bloqueiam a submissão

1. Qual é a entidade proponente, situação jurídica, CNPJ/CNAE e responsável pelas assinaturas?
2. Quem são os fundadores, com formação, experiência comprovável, papel, dedicação semanal e entregas anteriores?
3. Qual é a motivação pessoal real de cada fundador e como cada um acompanha tecnologia, mercado e setor?
4. Há docente, colaborador ou parceiro formal? Qual é sua função e evidência de participação?
5. Qual modalidade será escolhida e quais recursos concretos da INCAMP serão utilizados?
6. O que existe hoje além do legado: entrevistas, especificação, protótipo navegável ou implementação V2?
7. Quem detém código, marca, domínio, dados e demais ativos intelectuais do legado?
8. Há impedimento legal, societário, contratual ou de propriedade intelectual?
9. Qual capital já está disponível e qual orçamento de 6, 12 e 36 meses?
10. Quais receitas e despesas são previstas por 36 meses e quais premissas sustentam os números?
11. Existem clientes, pilotos, receita, cartas de intenção ou parcerias? Qual documento comprova cada item?

### P1 — bloqueiam competitividade

12. Qual tipo exato de consultoria é o primeiro perfil de cliente, em qual região e subsegmento?
13. Quantas entrevistas/observações foram feitas, com quais perfis e quais padrões apareceram?
14. Com que frequência Audit/CAPA ocorre e quantas unidades uma consultoria acompanha?
15. Quem usa, quem administra, quem decide, quem compra e quem paga?
16. Quais ferramentas e workarounds são usados hoje e qual é o custo observável da ruptura?
17. Quais concorrentes nominais já foram analisados? Quanto do testemunho cada um cobre?
18. Qual unidade de cobrança e faixa de preço serão testadas?
19. Qual custo máximo de implantação e suporte seria sustentável?
20. Quais artefatos legados podem ser demonstrados e como sua autoria/titularidade será comprovada?
21. Quais dados pessoais ou sensíveis são estritamente necessários?
22. ASO aparece em processos observados ou é apenas hipótese? Um anexo genérico já resolveria?
23. Quais métricas terão linha de base e quem autorizará sua coleta?
24. Qual TRL será adotado e qual evidência sustenta o nível?
25. Qual resultado faria a equipe encerrar, pivotar ou reduzir o projeto?
26. Qual caso real melhor comprova versões divergentes de ficha técnica entre qualidade, produção e financeiro?
27. Quais módulos do `_legacy` representam intenção, quais chegaram a funcionar e quais foram apenas experimentos?
28. Qual tipo de negócio precisa de Expedição e quais fatos ela deve receber de produção/estoque?
29. Em quais clientes ASO/RH são necessidade observada, e qual é o mínimo que não pode ser resolvido por integração externa?

## 10. Checklist de submissão

### Eliminatórios e documentação

- [ ] Usar o formulário oficial e conferir a versão vigente do edital.
- [ ] Preencher todos os campos obrigatórios.
- [ ] Incluir data, assinatura e comprovante de taxa/isenção.
- [ ] Garantir coerência entre pessoa física/jurídica e modalidade.
- [ ] Descrever base tecnológica sem converter protótipo em produto.
- [ ] Revisar CNAE, titularidade de IP, contratos e tratamento de dados.
- [ ] Garantir que texto, pitch, demo e cronograma expressem o mesmo estágio.
- [ ] Confirmar presença de ao menos um fundador na entrevista.

### Limites

- [ ] Resumo ≤ 1.500 caracteres.
- [ ] Perfil ≤ 1.000 por resposta, sob leitura conservadora.
- [ ] Qualificação ≤ 1.500 por resposta, sob leitura conservadora.
- [ ] Inovação ≤ 2.000 por resposta, sob leitura conservadora.
- [ ] Mercado ≤ 1.500 para o bloco.
- [ ] Financeiro ≤ 1.000 para o bloco.
- [ ] Impacto ≤ 1.000 para o bloco.
- [ ] Recalcular tudo depois de remover `[PREENCHER]`.

### Evidência e linguagem

- [ ] Classificar toda alegação importante como evidência, inferência, hipótese ou lacuna.
- [ ] Comprovar ou remover clientes, receitas, impacto, segurança, conformidade e parcerias.
- [ ] Não alegar nova categoria, produto V2 pronto, segurança multi-organização, imutabilidade ou assinatura validada.
- [ ] Citar e datar fontes de mercado e premissas financeiras.
- [ ] Justificar TRL com critérios observáveis.
- [ ] Não usar jargão de teoria das categorias no texto público.

### Escopo

- [ ] Manter o núcleo comum separado do primeiro fluxo; implementar somente o mínimo exigido pelo witness Audit/CAPA.
- [ ] Tratar Document Control, treinamento, fornecedores, temperatura e ficha técnica como conexões estruturais candidatas, sem prometer implantação simultânea.
- [ ] Não copiar ASO ou dados de saúde; registrar somente eventual pendência documental genérica ligada ao requisito auditado.
- [ ] Manter expedição, RH/ASO, estoque, compras, produção, nutrição, solvers e IA fora da V0, sem apagá-los da visão modular condicionada ao tipo de negócio.

### Anexos recomendados — respeitando o limite do edital

- [ ] Currículos e comprovações relevantes.
- [ ] Imagens dos protótipos legados rotuladas como antecedentes.
- [ ] Diagrama do testemunho e matriz de autoridades.
- [ ] Benchmark concorrencial.
- [ ] Cronograma e orçamento de 36 meses.
- [ ] Declaração de titularidade/autorização dos ativos.
- [ ] Registro metodológico de entrevistas e pilotos.
