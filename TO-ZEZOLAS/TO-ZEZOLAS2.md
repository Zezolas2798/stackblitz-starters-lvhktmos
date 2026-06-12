---
to: Zezolas
from: Victor (auditoria multi-agente, segundo passe, sintetizada)
re: NutriDev — o segundo olhar, mais fundo e menos otimista que o primeiro
date: 2026-06-10
status: rascunho para conversa
---

# Para o Zezolas — segundo passe: onde o primeiro foi generoso demais

Este é o segundo memorando. Mandei agentes novos cavarem três áreas que o primeiro
passe não tocou — os motores que montam o cardápio, a resiliência (o que acontece
quando algo quebra) e a integridade da trilha de auditoria/segurança — e re-li o
primeiro memorando para ser honesto sobre o que ele errou.

Aviso de tom: o primeiro passe foi sobre **arrumação** (tirar as regras do esconderijo).
Este aqui é sobre **risco**. Ele é mais duro, e de propósito. Cada achado continua
ancorado em arquivo e linha — se eu não consigo apontar, eu cortei.

## A frase única (tudo abaixo é um pedaço dela)

**O seu produto vende três promessas — "o cardápio é otimizado e correto", "os dados de
um cliente são dele" e "a auditoria é à prova de fiscal". O segundo olhar mostra que, hoje,
no código, as três têm furo:** o motor de cardápio nunca foi provado e pode entregar um
cardápio inválido em silêncio; as fichas técnicas e o financeiro de um cliente podem vazar
para outro; e a "assinatura eletrônica" é uma figura, não uma prova. Nenhum desses é
"melhoria" — é a diferença entre o que você anuncia e o que o sistema faz hoje.

## Onde o primeiro passe foi generoso demais (sendo honesto)

Duas coisas que eu escrevi no primeiro memorando, e que o segundo olhar derrubou:

- **Eu disse: "as suas regras estão certas, só estão escondidas no código."** Generoso
  demais. O problema não é só visibilidade — é **verificação**. Há regras declaradas que
  ninguém aplica (`MAP_SUBGRUPO_ENXOFRE` e `LIMIAR_PREVALENCIA_ENXOFRE` em
  `lib/types.ts:187-205` existem no tipo e não são tratadas em nenhum motor), e há **zero
  testes** provando que um cardápio gerado respeita qualquer regra. "Escondida" eu conserto
  tirando do esconderijo; "não verificada" e "fantasma" são problemas maiores.

- **Eu disse que o seu fosso era a trilha de auditoria imutável (soft delete + snapshot).**
  Generoso demais. O segundo olhar mostra que o soft delete **não** é consistente — a ficha
  técnica regulada é apagada de vez (`app/uan/fichas/page.tsx:41`, um `delete()` físico, sem
  trilha) — e a trilha de auditoria GxP nem cobre as tabelas UAN que o app realmente usa. O
  fosso que eu elogiei tem ralo no fundo.

O resto do primeiro passe continua de pé. Mas essas duas correções mudam a prioridade: não
dá para "deixar para depois" o que está abaixo.

---

## Os três achados que sustentam o resto

### 1. A trava entre clientes tem buraco: a ficha técnica e o financeiro de um cliente podem ser lidos por outro

A sua arquitetura é "BaaS-First": o navegador fala direto com o banco, e a segurança mora
nas regras do banco (RLS — a trava que diz "cada cliente só vê o que é dele"). O problema é
que essa trava **não foi aplicada nas tabelas mais novas e mais valiosas**:

- **`middleware.ts:17-19`** é um no-op — não checa nada (o próprio comentário admite que a
  proteção "continua no client"). Ou seja, a RLS no banco é a **única** barreira real.
- E várias tabelas-joia **não têm RLS**, com `cliente_id` na coluna: `fichas_tecnicas_uan`
  (as fichas técnicas), `cardapios_uan`, `listas_compras_uan`, `colaboradores`. Onde há RLS,
  algumas políticas são abertas: `clientes`, `cliente_unidades`, `audit_logs_sistema` usam
  `USING (true)` (qualquer logado lê todos), e o financeiro (`fin_vendas_mensais`,
  `fin_integracoes_delivery`) usa `authenticated` (qualquer logado vê o faturamento de todo
  mundo).

**O que isso significa, em português de negócio:** a chave pública do banco (`anon key`) vai
no pacote que o navegador baixa. Qualquer pessoa logada abre o console do navegador, roda
`supabase.from('fichas_tecnicas_uan').select('*')` **sem o filtro de cliente**, e lê as
fichas técnicas, os custos e os cardápios de **todos os concorrentes** que usam o seu SaaS.
Cliente A vê a margem e as receitas do Cliente B. Num produto cuja venda é "controle", isto
é vazamento de segredo comercial e, com `colaboradores`/`profiles` expostos, provável
incidente de LGPD.

**Por que isto é o achado número um:** é o único da lista que pode te custar um cliente (ou
um processo) **amanhã**, sem aviso, e o estrago é irreversível — uma vez que o Cliente B viu
a receita do Cliente A, não tem desfazer. Note também a causa-raiz, que é a ideia de **drift**
(desvio) do Arcanum: a RLS e a auditoria foram construídas para o modelo **antigo**
(`receitas`, `composicao_receitas`) e nunca acompanharam o modelo **novo** (`*_uan`) que o
app passou a usar. O código andou; a trava ficou para trás. É exatamente o tipo de desvio
silencioso que uma "ponte" entre intenção e código pegaria (veja `refs/meta-camadas.md`).

### 2. A "assinatura eletrônica" é uma figura, não uma prova — e a ficha técnica regulada some sem rastro

A promessa central do produto é "compliance que se explica na frente de um fiscal". Três
coisas no código quebram essa promessa exatamente onde ela mais importa:

- **A assinatura é cosmética.** Em `app/qualidade/execucao/[id]/page.tsx:367`, o campo
  `assinatura_eletronica_hash` é preenchido com a **URL de um PNG** — o desenho do dedo no
  canvas, subido como imagem. Não existe `sha256`/`createHash` em lugar nenhum do código. O
  "hash" não está atrelado ao conteúdo da auditoria: dá para **alterar as respostas depois de
  assinar** e a mesma imagem continua lá. A assinatura não detecta adulteração — ela só
  parece uma assinatura.
- **Auditoria fechada ainda é editável por admin.** Na linha 184,
  `isReadOnly = status === 'CONCLUIDO' && !isAdmin`. Ou seja, um admin **edita uma auditoria
  já concluída e assinada**. O auditor afirma "está fechada"; o registro era editável o tempo
  todo.
- **A ficha técnica é apagada de verdade.** `app/uan/fichas/page.tsx:41` faz `delete()`
  físico, e não há trigger de auditoria nessa tabela. A ficha some sem deixar rastro — numa
  disputa ou fiscalização, você não consegue provar o que ela continha.

**Por que importa:** este é o achado que **contradiz o que eu elogiei no primeiro passe**. A
trilha imutável que eu chamei de fosso, na prática, não cobre as entidades reguladas mais
importantes. Para um produto de compliance, uma assinatura que não prova nada é pior do que
nenhuma — porque dá uma falsa sensação de segurança ao cliente e a você. O conserto mínimo
não é "construa cadeia criptográfica" (isso é exagero agora); é **um hash de verdade do
conteúdo + travar edição de registro assinado + soft delete na ficha técnica**.

### 3. O cérebro que monta o cardápio nunca foi provado — e o motor "premium" entrega cardápio inválido em silêncio

O que você vende como "cardápio otimizado" são dois motores (`uan-csp-generator`,
`uan-nsga-solver`, ~930 linhas somadas) mais um "linter" (`lib/uan-validator.ts`). O segundo
olhar achou quatro coisas que, juntas, dizem "ninguém provou que isso funciona":

- **Zero testes.** O único teste do repositório inteiro é sobre **extintor de incêndio**
  (`app/api/produtos_bombeiros/__tests__/`). Os dois motores e o linter não têm nenhum teste.
  Você mesmo já admitiu no papel: `docs/HYPOTHESES.md` H-007 ("lista de compras com precisão
  de ±5%") está marcada `untested`.
- **O linter nunca confere a saída do motor automaticamente.** Em
  `app/uan/cardapios/[id]/grade/page.tsx`, a geração automática (linha 254) joga o resultado
  na tela (linha 315) **sem** chamar `validateMenuGrid`. O alerta ainda pede pro humano
  conferir: "Analise os Linter Alerts". O juiz existe, mas só roda se o cliente clicar.
- **Os dois motores discordam.** O CSP só respeita regras `HARD` e **não implementa
  `CUSTO_MAX_REFEICAO`**; o NSGA respeita HARD e SOFT e implementa. Mesmo cardápio, mesmas
  regras, dois botões → dois resultados, um podendo estourar um teto de custo que o outro
  respeita.
- **O motor "premium" falha em silêncio.** Quando nenhuma solução válida existe, o CSP
  recusa com erro honesto (HTTP 422, linhas 348-349) — ótimo. Mas o NSGA (o que você rotula
  de "🧬 Otimizado") **não dá erro**: pega "o de menos violações" e entrega assim mesmo
  (linhas 551-552), com um avisinho fácil de ignorar. O caminho mais vendável é o menos
  seguro.

**Por que importa:** "o cardápio depende de qual botão você apertou" e "o motor premium pode
te entregar um cardápio que fura uma regra dura sem avisar" são exatamente o tipo de coisa
que destrói a confiança numa auditoria — e a sua venda é confiança. A boa notícia é que o
conserto é barato e já está escrito no `refs/regra-para-teste.md`: liste as regras do
cardápio, dê um número a cada uma, e o linter passa a rodar **sobre a saída do motor** antes
de mostrar (o "portão" do `refs/pass-flag-block-e-gate.md` — o NSGA deveria devolver **BLOCK**
numa violação dura, não um ✅ disfarçado).

---

## Um achado mais sutil que vale guardar

A precisão da lista de compras — a sua hipótese H-007, de ±5% — vive ou morre numa
**conversão de palavra**. A ficha fala em `rendimento_porcoes` (porções); o cardápio fala em
`comensais` (`comensais_estimados_dia`); as definições falam em `per capita`; a receita
industrial fala em `rendimento_total_g`. São quatro vocabulários para "quanto rende / para
quantas pessoas", e o cálculo de compras precisa cruzar "porções" da ficha com "comensais" do
cardápio — uma conversão no meio do código onde um erro vira "comprou para 100, serviu 250".

Pior, "ficha técnica" significa três coisas no seu sistema (`Receita` industrial,
`FichaTecnicaUAN` operacional, e o registry chama uma de "Receita / Ficha Técnica" na mesma
célula). Um nutricionista lendo "ficha técnica" não sabe qual você quis dizer.

**Não estou recomendando a correção óbvia** (sair renomeando tudo no código agora, o que
quebraria o app). Estou recomendando o passo barato: **um glossário onde cada termo tem um
significado só** (está rascunhado em `refs/glossario-do-dominio.md`). Decidir, no papel, que
"comensais" e "porções" são coisas distintas e onde cada uma vale, é o que protege os ±5% da
H-007 — e é de graça.

---

## O que eu deixo em aberto para você decidir

1. **A ordem é inegociável só num ponto: o vazamento entre clientes (achado 1) vem antes de
   tudo.** Os outros você sequencia como o negócio mandar; esse não. A pergunta que sobra é
   *quão rápido* você consegue fechá-lo sem derrubar o app.
2. **Quanto de "à prova de fiscal" você promete hoje vs. quando consertar.** Enquanto a
   assinatura for uma figura (achado 2), o honesto é não vender "assinatura eletrônica com
   validade jurídica". Isso é decisão de marketing, e é sua.
3. **Os dois motores de cardápio: vale manter os dois?** Manter CSP e NSGA divergentes dobra
   a superfície de bug. Talvez um só, bem testado, valha mais que dois "inteligentes" e não
   provados. Decisão de produto.

---

## Edições concretas, em ordem de alavancagem

1. **RLS + `FORCE ROW LEVEL SECURITY` nas tabelas `*_uan`, `colaboradores`, financeiro**, e
   remover as políticas `USING (true)`/`authenticated` cross-tenant.
   *Efeito:* fecha o vazamento entre clientes. É a única edição que eu trataria como urgente.
2. **Assinatura = hash real do conteúdo** (não a URL do PNG) + **travar edição de registro
   `CONCLUIDO` mesmo para admin** + **soft delete na `fichas_tecnicas_uan`** (trocar o
   `delete()` físico de `app/uan/fichas/page.tsx:41`).
   *Efeito:* a promessa "à prova de fiscal" passa a se sustentar nas entidades reguladas.
3. **O linter roda sobre a saída do motor antes de mostrar; NSGA devolve BLOCK em violação
   dura** (em vez de entregar com aviso ignorável).
   *Efeito:* o cardápio gerado nunca chega na tela violando regra dura em silêncio.
4. **Tabela de regras → teste para o cardápio** (`refs/regra-para-teste.md`), começando pelos
   testes negativos ("tento o proibido → recusado").
   *Efeito:* tira o motor do "zero teste"; cobertura vira uma lista auditável, não um
   sentimento.
5. **Glossário de um significado por termo** (`refs/glossario-do-dominio.md`), começando por
   "comensais vs porções" e "ficha técnica".
   *Efeito:* protege os ±5% da lista de compras e acaba com a ambiguidade que faz o cliente
   aprovar a tela errada.
6. **Etiqueta e cálculo nutricional falham alto, não em silêncio** (a impressão "deu certo"
   sem sair papel em `EtiquetaPrinter.tsx:63`; o rótulo em branco sem mensagem em
   `app/receitas/[id]/page.tsx:330-352`).
   *Efeito:* fecha resíduos de resiliência que viram risco sanitário. Veja
   `refs/estressores-e-residuo.md`.

---

## Um caminho concreto que você pode usar amanhã (as etapas)

Comece pelo **achado 1**, porque é o único urgente. Use este ciclo:

1. **Liste as tabelas com `cliente_id`/`unidade_id` que NÃO têm RLS de tenant.** O dump já
   te dá isso (`fichas_tecnicas_uan`, `cardapios_uan`, `listas_compras_uan`, `colaboradores`,
   financeiro). Essa lista é o seu escopo fechado.
2. **Escreva a regra de isolamento como uma frase, uma vez:** "toda linha dessas tabelas só é
   visível/editável por quem pertence ao mesmo `cliente_id`." (É uma *Regra* que **bloqueia** —
   veja `refs/pass-flag-block-e-gate.md`: vazamento entre clientes é sempre BLOCK, nunca FLAG.)
3. **Aplique a política RLS + `FORCE ROW LEVEL SECURITY`** em cada tabela da lista, e remova as
   `USING (true)`.
4. **Derive o teste da regra** (`refs/regra-para-teste.md`): logado como Cliente A, tento ler
   `fichas_tecnicas_uan` do Cliente B → tem que voltar **vazio**. Esse é o teste que prova que
   o buraco fechou — e é exatamente a sua H-002 (`docs/HYPOTHESES.md`), que está `untested`.
5. **Amarre a hipótese ao teste.** A H-002 deixa de ser "aposta no papel" e vira "verificada
   por T-XX". Repita o ciclo no achado 2, depois no 3.

Você não reescreve o sistema. Você fecha um buraco, prova que fechou, e passa para o próximo.

---

## O que eu deliberadamente NÃO recomendei

- **Cadeia criptográfica de auditoria (cada log apontando o hash do anterior).** O
  diagnóstico (a trilha não é à prova de adulteração) está certo, mas a cadeia completa é
  exagero para o seu estágio. O mínimo que resolve 90% é hash real do conteúdo + RLS sem
  edição/deleção + `FORCE RLS`.
- **Reescrever os dois motores de cardápio agora.** Eles funcionam o suficiente para
  demonstrar valor. O risco não é o algoritmo — é a ausência de teste e de portão. Conserte
  isso primeiro; reescreva (ou unifique para um só) depois, se a evidência pedir.
- **Adotar a formalização inteira de residualidade / a ontologia completa.** Você colhe 80%
  do ganho com as duas tabelas (regras e estados) e o glossário. O resto é opcional e fica
  nas `refs/` para quando fizer sentido.
- **Modo offline / PWA.** É um buraco real (zero tratamento de conectividade), mas é
  investimento grande. Por enquanto, "falhar alto" (edição 6) já evita o pior: o usuário saber
  que não salvou, em vez de achar que salvou.

---

## Uma observação que está além da auditoria

No primeiro passe eu disse que o seu fosso era "compliance que se explica sozinho". Mantenho a
frase, mas com uma verdade incômoda do segundo olhar: **hoje o fosso vaza.** A assinatura não
prova, a ficha some, e um cliente pode ler o outro. A boa notícia — e ela é grande — é que
**você já tem a disciplina certa, ela só parou no papel.** O seu `docs/HYPOTHESES.md` tem
hipóteses falsificáveis de verdade (com "condição de refutação"), o `PROJECT-DECISIONS.md`
registra as escolhas, e você já usa DomainSpec. Isso é mais maturidade de processo do que 95%
dos projetos nesse estágio. O que falta não é método — é **fazer o método chegar até o banco e
até os testes.** As hipóteses estão escritas mas `untested`; os bets de negócio mais
importantes ("o nutricionista confia no cardápio a ponto de publicar sem revisar") nem viraram
hipótese. Fechar essa distância — do papel até o teste que roda — é o que transforma "confie em
mim" em "olhe a prova", que é o produto inteiro.

---

## As três perguntas mais afiadas, em ordem

1. **Hoje, logado como um cliente, eu consigo ler a ficha técnica de outro?** (Se a resposta
   honesta não for um "não" testado, o achado 1 é a sua única prioridade desta semana.)
2. **Se um cliente alterar uma resposta depois de "assinar" a auditoria, o sistema percebe?**
   (Determina se a assinatura do achado 2 é uma prova ou uma figura.)
3. **Você confia o suficiente no cardápio que o botão "Otimizado" gera para publicá-lo sem um
   nutricionista revisar?** (Se não, por que ele é entregue sem o linter conferir? — achado 3.)

— V.
