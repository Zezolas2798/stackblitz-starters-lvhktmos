---
title: Meta-camadas — o guia prático das camadas que ficam acima do código
audience: Dono de SaaS de food service / conformidade ANVISA (nutridev-manager) — pessoa de negócio que entrega software, sem matemática nem teoria
source_docs:
  - Arcanum/BUSINESS-ONTOLOGY.md (Ontologia de Negócio vs Ontologia de Sistema vs Ponte; Axiomas → Constituições → Premissas)
  - domainspec/TAXONOMY.md (os meta-tipos: blocos de construção do domínio)
  - domainspec/RELATIONSHIPS.md (relacionamentos tipados entre conceitos)
  - domainspec/AXIOMS.md (axiomas de governança e o "porquê" das regras)
  - domainspec/docs/features/domainspec-arcanum-superset/ARCHITECTURE.md (DomainSpec como camada do "o quê/por quê" acima do Arcanum, o "como")
---

# Meta-camadas: as camadas que ficam acima do seu código

Você disse que está "pensando em meta-camadas". Este documento é exatamente sobre isso: **o que fica em cima do código** do nutridev-manager e por que essas camadas protegem e fazem o seu produto crescer sem virar uma bagunça.

A ideia central é simples e vale a pena guardar:

> O seu código é só a camada de baixo. Acima dele existem outras camadas — a regra escrita, a intenção do negócio, o porquê da regra existir. E existe uma camada que **conecta** tudo isso e avisa quando elas param de combinar. Essa última é a mais valiosa.

Sem essas camadas, o código é a única "verdade" do sistema. Quando o código muda, ninguém percebe que a regra de negócio mudou junto. Com elas, você tem rastreabilidade e detecção de desvio — você descobre o problema antes do auditor da vigilância sanitária descobrir.

---

## 1. O seu sistema em camadas (o quadro concreto)

Pegue uma regra real do seu negócio e siga ela de cima para baixo:

```
┌─────────────────────────────────────────────────────────────────┐
│ CAMADA 1 — INTENÇÃO DE NEGÓCIO (o porquê)                          │
│ "Todo rótulo com alergênico precisa de aviso destacado."          │
│ Existe porque a RDC 26/2015 da ANVISA exige, e porque um aviso    │
│ faltando pode causar dano ao consumidor e multa.                  │
└─────────────────────────────────────────────────────────────────┘
              │  (a Ponte liga isto àquilo)
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CAMADA 2 — A ESPECIFICAÇÃO / REGRA ESCRITA (o quê)                 │
│ Regra AvisoAlergenico: se a ficha técnica do produto contém       │
│ qualquer um dos 8 grupos alergênicos obrigatórios, o rótulo DEVE  │
│ imprimir o aviso "ALÉRGICOS: contém X". Os 8 grupos são: ...      │
└─────────────────────────────────────────────────────────────────┘
              │  (a Ponte liga isto àquilo)
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CAMADA 3 — O CÓDIGO RODANDO (o como)                              │
│ A função calcular-nutrientes / gerar-rotulo lê os ingredientes,   │
│ verifica os grupos alergênicos e imprime o aviso no rótulo real.  │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
        O rótulo físico que sai na impressora.
```

E atravessando as três, sempre presente:

```
┌─────────────────────────────────────────────────────────────────┐
│ A PONTE (rastreabilidade + detecção de desvio)                    │
│ Guarda o link: "esta intenção → esta regra → este pedaço de       │
│ código → este teste". E fica comparando se eles ainda combinam.   │
│ Quando o código deixa de cumprir a regra, a Ponte acende a luz.   │
└─────────────────────────────────────────────────────────────────┘
```

Traduzindo para o seu negócio:

- **Ontologia de Negócio (Intenção)** = o que o nutridev-manager *é* e por que existe: "garantir rótulo correto, cardápio de UAN conforme, estoque rastreável por lote." É a verdade do domínio, sem nenhum detalhe de programação.
- **Ontologia de Sistema (Realização)** = o código de verdade, o banco de dados, os endpoints, o que realmente roda.
- **A Ponte** = o que liga os dois e detecta quando eles se separam.

---

## 2. Subindo as camadas — uma frase + um exemplo de cada

Do mais concreto (o que você toca) ao mais abstrato (o porquê).

### Camada do código rodando (o mais concreto)
**O que é:** o programa que realmente executa e produz o resultado físico.
**Exemplo:** a função `calcular-nutrientes` roda, soma sódio/gordura/calorias por porção e a `gerar-rotulo` imprime a tabela nutricional e o aviso de alergênico no rótulo que sai na impressora.

### Camada da especificação / regra escrita
**O que é:** a regra de negócio escrita de forma clara e sem ambiguidade, antes de virar código.
**Exemplo:** "Regra FEFO: ao separar um insumo do estoque, sempre consumir primeiro o lote com a menor data de validade." Está escrita, tem nome, e qualquer pessoa (ou auditor) entende sem abrir o código.

### Camada da intenção de negócio
**O que é:** o que o negócio quer alcançar e para quem — o valor, sem dizer *como* fazer.
**Exemplo:** "O cliente UAN precisa servir refeições seguras e dentro da validade, e provar isso numa auditoria sanitária." A regra FEFO existe a serviço dessa intenção.

### Camada dos axiomas (o mais abstrato — o porquê do porquê)
**O que é:** as verdades de base que justificam todas as regras. São poucas, raramente mudam, e sustentam tudo.
**Exemplo:** "Rastreabilidade por lote não é opcional: sem ela, não dá para fazer recall nem provar conformidade." Desse axioma nascem dezenas de regras (FEFO, validade, ficha técnica, registro de auditoria).

A hierarquia, no seu mundo:

- **Axioma** (verdade de base): "Todo item que vai ao prato precisa ser rastreável até o lote."
- **Constituição** (regra de processo derivada): "Nenhuma entrada de estoque é aceita sem lote e validade; nenhuma saída sem aplicar FEFO." É o *como* obrigatório para a equipe e para o sistema.
- **Premissa** (aposta ainda não confirmada): "Talvez clientes de pequenas UANs aceitem lançar lote por foto da nota fiscal." Isso é hipótese — você testa antes de virar regra fixa.

### Premissa vs regra fixa: o detalhe que protege quem cresce

Separe **quão bem comprovado** algo está de **quanto você depende disso hoje**. Na prática: você pode *explorar* uma feature nova de cardápio inteligente (pouca evidência ainda) sem *apoiar a arquitetura inteira nela* (baixo comprometimento). Assim você inova sem deixar o produto frágil. E a regra de ouro para criar axioma novo é a *Via Negativa*: só vire regra fixa **quando a ausência já tiver custado caro** (um rótulo errado, uma multa, um recall). Não encha o sistema de regras teóricas — formalize a dor que já aconteceu.

---

## 3. Drift (desvio): quando o código silenciosamente para de combinar

Esse é o problema que as meta-camadas existem para resolver, e o mais perigoso porque é **invisível**.

**Cenário real:** a regra diz que o sistema verifica os **8 grupos alergênicos obrigatórios**. Seis meses atrás, um desenvolvedor mexeu na `calcular-nutrientes` para corrigir outra coisa e, sem querer, o código passou a checar só **6 dos 8 grupos**. O rótulo continua saindo bonito. Os testes que existiam continuam passando. Ninguém nota.

A regra escrita ainda diz "8". O código agora faz "6". **Eles se separaram.** Isso é drift.

Sem a Ponte, esse desvio só aparece no pior momento: numa auditoria da vigilância, ou quando um consumidor alérgico reage. Com a Ponte, a regra escrita é tratada como uma **linha de base viva** (não um PDF esquecido): ela fica comparando "o que a regra diz" com "o que o código faz" e **acende a luz vermelha** no momento em que divergem. Ela também pega o caso oposto — um pedaço de código que existe sem nenhuma regra ligada a ele (escopo não autorizado ou dívida escondida).

> **No seu caso, isto não é hipótese.** O segundo memorando (TO-ZEZOLAS2, achado 1) mostra um drift real: a trava de isolamento entre clientes (RLS) foi construída para o modelo antigo (`receitas`) e nunca acompanhou o modelo novo (`*_uan`) que o app passou a usar. O código andou; a trava ficou para trás. A Ponte é exatamente o que pegaria isso.

---

## 4. Os blocos de construção: como nomear cada peça do domínio

Quando você escreve a camada da regra (Camada 2), não escreve texto solto. O DomainSpec dá um vocabulário fixo de **tipos de peça**; todo conceito do seu sistema encaixa em exatamente um deles.

Os mais úteis para o nutridev-manager, em linguagem de negócio:

| Tipo de peça (meta-tipo) | O que é | Exemplo no nutridev-manager |
| --- | --- | --- |
| **Entidade** | Uma coisa com identidade e histórico | Lote, Produto, FichaTecnica, Cardapio, RegistroDeAuditoria |
| **Objeto de Valor** | Um valor sem identidade própria, definido pelo conteúdo | TabelaNutricional (sódio, gordura, calorias por porção), Peso, DataDeValidade |
| **Enum / Tipo** | Um conjunto fixo de opções | GrupoAlergenico (8 valores), StatusDoLote (EM_ESTOQUE, RESERVADO, VENCIDO) |
| **Operação** | Uma ação que muda o estado | DarEntradaNoLote, SepararInsumoFEFO, GerarRotulo, RegistrarAuditoria |
| **Cálculo** | Uma fórmula que deriva um valor (mesma entrada, mesma saída) | CalcularNutrientesPorPorcao, CalcularCustoDoLote |
| **Regra** | Uma restrição que bloqueia uma ação se não for satisfeita | RegraAvisoAlergenico, RegraValidadeMinima (não separar lote vencido) |
| **Política** | A lógica que *escolhe* um comportamento (não bloqueia, decide) | PoliticaFEFO (qual lote separar primeiro) |
| **Workflow** | Vários passos coordenados dentro de uma área | FluxoDeProducao (receber → conferir lote → produzir → rotular → estocar) |
| **Máquina de Estados** | Como uma entidade anda pelos estágios | CicloDeVidaDoLote (Recebido → Em estoque → Reservado → Consumido / Vencido) |
| **Evento** | Aviso de que algo aconteceu | LoteVenceuHoje, RotuloGerado, AuditoriaRegistrada |
| **Interface** | A fronteira (API) por onde os dados entram e saem | API de Estoque, API de Rótulos |

O ponto prático: **Regra bloqueia, Política escolhe.** A `RegraValidadeMinima` *impede* separar um lote vencido (sim/não). A `PoliticaFEFO` *escolhe* qual dos lotes válidos sair primeiro. Confundir os dois é a origem de muito bug de conformidade.

E essas peças se conectam por **relacionamentos tipados**, formando um mapa navegável:

```
RegraAvisoAlergenico  --enforces-->  GerarRotulo
GerarRotulo           --produces-->  RotuloGerado (evento)
CalcularNutrientes    --calculates-> GerarRotulo
PoliticaFEFO          --applies-->   SepararInsumo
```

É essa trilha que a Ponte percorre para checar drift — ela sabe exatamente quais pedaços de código uma regra deveria estar protegendo.

---

## 5. As duas altitudes: significado (o quê/por quê) vs execução (o como)

A parte mais importante para um produto que está **crescendo**. Separe o sistema em duas "altitudes", e essa separação é o que impede que o nutridev-manager vire um nó impossível de desatar.

- **Altitude alta — DomainSpec = significado e rastreabilidade (o quê e o porquê).** Aqui moram as intenções, as regras escritas, os axiomas, o mapa de conceitos e a Ponte. É a fonte da verdade sobre *o que o sistema deve fazer e por quê*.
- **Altitude baixa — Arcanum = execução limitada (o como).** Aqui moram as tarefas concretas e delimitadas: "implemente esta função", "rode esta validação", "gere este rótulo". Cada execução tem fronteira clara e dono claro.

A regra de ouro: a altitude alta **decide e registra**; a altitude baixa **executa dentro de limites**. Uma não invade a outra.

### Por que isso protege um produto em crescimento

Quando tudo está misturado numa altitude só — regra de negócio enfiada no meio do código de banco de dados, decisão de conformidade espalhada por funções técnicas — cada mudança vira um campo minado. Separar as altitudes te dá quatro coisas concretas:

1. **Auditoria fácil.** A regra de conformidade fica num lugar claro, não enterrada no código. Quando o auditor pergunta "como vocês garantem o aviso de alergênico?", você mostra a regra escrita e a Ponte que prova que o código a cumpre.
2. **Crescimento sem caos.** Adicionar um cliente, um tipo de cardápio ou uma regra sanitária nova não exige reescrever o sistema inteiro.
3. **Mudança segura.** Cada execução na altitude baixa é delimitada: um desenvolvedor mexendo no rótulo não derruba sem querer o controle de estoque.
4. **Drift visível.** Como significado e execução estão separados, a Ponte consegue compará-los. Se vivessem grudados, o desvio ficaria invisível — o pior caso da Seção 3.

---

## 6. Resumo de uma página (para colar na parede)

- O **código** é só a camada de baixo. Acima há a **regra escrita**, a **intenção de negócio** e os **axiomas** (o porquê do porquê).
- A **Ponte** liga todas elas e **detecta drift** — quando o código silenciosamente para de cumprir a regra (ex.: checar 6 de 8 grupos alergênicos; a RLS antiga não cobrir as tabelas novas). É o seu alarme de conformidade.
- **Axioma → Constituição → Premissa**: verdade de base → regra de processo obrigatória → aposta ainda em teste. Só vire regra fixa a dor que já custou caro (*Via Negativa*).
- Descreva o domínio com **blocos nomeados** (Entidade, Regra, Política, Cálculo, Operação, Máquina de Estados...). **Regra bloqueia; Política escolhe.**
- **Duas altitudes**: significado e rastreabilidade (o quê/por quê) vs execução delimitada (o como). A alta decide e registra; a baixa executa dentro de limites.
- Separar as altitudes mantém um produto em crescimento **auditável, seguro de mudar e livre de drift invisível** — em vez de um nó impossível de desatar.

> Em uma frase: as meta-camadas transformam o seu software de "o código é a única verdade" para "a intenção é a verdade, o código é a realização, e a Ponte garante que os dois nunca se separem sem você saber."
