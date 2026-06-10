---
to: Zezolas
from: Victor (auditoria multi-agente, sintetizada)
re: NutriDev / SaaS Food Service — onde eu apertaria, com exemplos do seu domínio
date: 2026-06-10
status: rascunho para conversa
---

# Para o Zezolas — o seu sistema de food service, onde as ideias do Arcanum e do DomainSpec pagam a conta

Isto saiu de uma conversa em que mandei agentes lerem três coisas em paralelo: o seu
repositório (`stackblitz-starters-lvhktmos`, que por dentro se chama `nutridev-manager`),
o Arcanum e o DomainSpec. A ideia não era achar defeito — era pegar as **ideias
fundamentais** desses dois frameworks e mostrar, no seu próprio código, onde elas viram
dinheiro, confiança do cliente e noite de sono.

Cada achado abaixo está ancorado num arquivo seu de verdade. Onde eu não consegui apontar
o arquivo, eu cortei. Nada de teoria pela teoria, nada de matemática — só "isto aqui, no
seu sistema, te protege ou te custa".

## A frase única (tudo abaixo é um pedaço dela)

**O seu produto é "a legislação embutida no software, provável numa auditoria". Então as
suas regras de negócio mais valiosas — as da ANVISA — merecem ser tratadas como o ativo
número um: escritas primeiro, em um lugar só, testáveis, e honestas sobre o que ainda não
fazem.** Hoje elas estão certas, mas estão *escondidas dentro do código*, e o que o
sistema ainda *não* faz está escondido dentro de `// TODO`. Os três achados abaixo são
sobre tirar essas duas coisas do esconderijo.

---

## Os três achados que sustentam o resto

### 1. A sua joia da coroa — as regras da ANVISA — vive dentro do código, não como um contrato que você possa ler e testar

A coisa que diferencia o seu SaaS de uma planilha é que ele **sabe a lei**: arredonda o
rótulo conforme a RDC 429 / IN 75, decide quando declarar "não significativo", aplica as
lupas frontais ("ALTO EM AÇÚCAR ADICIONADO"), monta as declarações obrigatórias de
alergênicos. Isso é o produto.

Mas hoje essa inteligência mora em três lugares de código, espalhada:

- **`supabase/functions/calcular-nutrientes/index.ts`** — 914 linhas. Os limites das
  lupas, as regras de arredondamento e o que conta como "não significativo" estão como
  números e `if`s no meio da função.
- **`lib/uan-validator.ts`** — 494 linhas. As 20 regras de variedade de cardápio
  ("não repetir família proteica", "no máximo carne vermelha 2x/semana") vivem aqui como
  lógica.
- **`lib/types.ts`** — 805 linhas. O modelo inteiro do domínio, onde os conceitos existem
  mas as *regras sobre* eles não estão declaradas num lugar legível por um nutricionista.

**Por que isto é o achado que sustenta os outros:** pense no dia em que a ANVISA mexer no
limite de açúcar da lupa frontal. Hoje, para responder "o que muda no meu sistema?", você
ou alguém tem que ler 914 linhas de uma Edge Function e torcer para não esquecer um canto.
Esse é exatamente o problema que o DomainSpec existe para matar. O lema dele é literal:
*"pense primeiro, programe depois"*, e a ideia central é **escrever a regra primeiro, num
formato simples, e derivar o teste dela**.

No seu domínio isso fica assim — uma tabela que um nutricionista lê e aprova, e da qual
cada linha vira um teste automático:

| # | Regra (em português) | Forma precisa |
|---|---|---|
| L1 | Açúcar adicionado acima do limite → estampa a lupa | `acucar_add_por_100g >= LIMITE_ACUCAR → lupa = "ALTO EM AÇÚCAR ADICIONADO"` |
| L2 | Sódio abaixo do piso → não declara lupa de sódio | `sodio_por_100g < LIMITE_SODIO → sem lupa de sódio` |
| A1 | Tem leite na ficha → declaração "Contém lactose" obrigatória | `ingredientes ∋ leite → declarar lactose` |

Você **já faz isto** em parte — a pasta `docs/` segue DomainSpec, e `docs/edge.calcularCardapioUAN.md`
tem o `node_type`/`edges` certinho. O salto é levar esse mesmo rigor para a **rotulagem**:
uma `SPEC.md` de "Rótulo ANVISA" onde os limites e arredondamentos são uma tabela, e o
código de `calcular-nutrientes` passa a ser *a realização* daquela tabela, não a fonte da
verdade.

*Ganho concreto para o negócio:* quando a norma mudar, você muda **uma linha da tabela**, e
o teste te diz, em segundos, exatamente quais rótulos e quais clientes são afetados — em
vez de ser uma caça ao tesouro de 914 linhas com risco de multa se errar.

### 2. O que o sistema ainda NÃO faz está escondido em `// TODO` — e isso é um risco de confiança, não um detalhe técnico

O Arcanum tem uma ideia que é a mais valiosa dele para você, e o nome é feio mas o conceito
é simples: **resíduo**. Resíduo é *aquilo que um trabalho honestamente admite que ainda não
resolveu*. A regra é: você **declara** a limitação, de propósito, em vez de varrer para
baixo do tapete.

No seu sistema o resíduo existe — mas está escondido onde o cliente nunca vê:

- **`supabase/functions/calcular-cardapio-uan`** está marcado como `draft`, e na Fase 1 o
  estoque está fixo em zero: `estoqueAtualKg = 0`, com um `// TODO` para integrar
  `estoque_lotes` na Fase 2.
- Traduzindo para o negócio: **a lista de compras que o sistema gera hoje ignora o que o
  cliente já tem no estoque.** Ela manda comprar tudo do zero.

Isso não é um bug — é uma limitação legítima de uma fase. O problema é que ela está
declarada para o *programador* (`// TODO`), não para o *nutricionista que confia na lista
e vai ao mercado*. Se um cliente comprar em cima dessa lista achando que ela desconta o
estoque, ele compra demais, perde validade, joga comida fora — e a culpa, na cabeça dele,
é do seu sistema.

**Por que isto importa para o negócio:** o seu produto se vende como "controle e
rastreabilidade". Uma limitação não-declarada num produto de controle corrói exatamente a
coisa que você está vendendo. A correção do Arcanum não é "termine a Fase 2 já" — é
**declarar o resíduo onde ele aparece**:

> *"Esta lista de compras ainda **não** desconta o que você já tem em estoque. Ela calcula
> a necessidade bruta do cardápio. (Previsto para a Fase 2.)"*

Uma frase na tela. Isso transforma uma falha-surpresa numa expectativa gerenciada — e dá ao
cliente um motivo para querer a Fase 2, em vez de um motivo para desconfiar.

*Outros resíduos seus que merecem a mesma frase honesta:* o `supabase/full_schema.sql` está
**vazio** (quem clonar o projeto não consegue subir o banco — só as migrations incrementais
existem), e não há `.env.example`. Para o seu negócio isso é o resíduo "um novo dev ou um
sócio técnico não consegue ligar o projeto sozinho" — barato de resolver, caro de descobrir
no pior momento.

### 3. O seu painel mostra "98.5%" chumbado no código — números sem rastreio, num produto cuja venda é a rastreabilidade

Abra `app/page.tsx`. O dashboard principal — a **primeira tela que o dono do negócio vê** —
usa dados inventados: `financeiroData`, `qualidadeData` e os cards ("98.5%", "12 Lotes")
são números fixos, escritos à mão. Os módulos por trás têm dados reais; o painel que os
resume, não.

O Arcanum chama isto de **"artefato em vez de vibe"**, e o DomainSpec chama de **cadeia de
custódia**: todo número que você mostra deve poder ser rastreado de volta até o dado real
que o produziu. A versão concreta no seu caso:

- O card "98.5% de conformidade" deveria vir de uma `query` real sobre as `ChecklistExecucao`
  e os `AcaoCorretiva` — não de uma constante.
- Enquanto não vier, o número deveria estar **marcado como exemplo** na tela ("dados
  ilustrativos"), não apresentado como verdade.

**Por que isto importa para o negócio, e muito:** você vende um produto de *compliance*. O
cliente compra de você justamente porque não quer números inventados numa planilha. Se a
sua própria tela de abertura mostra um índice de conformidade fictício, e um cliente
descobre isso, ele questiona *todos* os outros números — inclusive os que são reais. Num
produto de confiança, um número falso visível contamina os verdadeiros. É o achado mais
barato de corrigir e o de maior dano se ficar.

---

## Um achado mais sutil que vale guardar

Você tem máquinas de estado boas — a ficha técnica vai `RASCUNHO → EM_ANÁLISE → APROVADA →
OBSOLETO`, e você até congela versões (`ReceitaVersao`). Isso é maduro.

O DomainSpec acrescenta uma coisa que falta: **escrever também os movimentos PROIBIDOS, não
só os permitidos.** No exemplo de pagamento dele, a tabela mais importante não é a dos
estados válidos — é a dos *inválidos* ("de Falhado para qualquer estado: proibido,
terminal"). É escrever no contrato o que **nunca** pode acontecer.

No seu domínio, os movimentos proibidos são exatamente onde mora o risco sanitário e legal:

- Uma ficha técnica **APROVADA** pode ser editada silenciosamente, sem gerar nova versão?
  (Se puder, a sua trilha de auditoria mente.)
- Um **lote vencido** pode ser consumido por uma ordem de produção? O FEFO impede isso de
  fato, ou só ordena a fila?
- Um cardápio já publicado para a semana pode ter um prato trocado sem registro?

**Não estou recomendando a correção óbvia** (sair adicionando trava em tudo). Estou
recomendando o passo anterior, que é barato: **fazer a lista dos movimentos proibidos**, no
papel, por entidade (Ficha, Lote, Cardápio). Essa lista é exatamente o que um fiscal da
Vigilância Sanitária vai tentar fazer o seu sistema cometer. Escrevê-la primeiro vira, de
graça, o seu roteiro de testes de auditoria.

---

## O que eu deixo em aberto para você decidir

Estas são decisões de negócio, não técnicas — e só você tem o contexto para tomá-las:

1. **Quão fundo ir no "especificar primeiro" agora.** Você está com um produto rodando e
   53 commits. Não dá para parar tudo e especificar o sistema inteiro. A pergunta é *qual
   fatia* merece o tratamento DomainSpec completo primeiro — meu palpite é **Rotulagem
   ANVISA**, porque é a de maior valor e a de maior risco de multa.
2. **Adotar a ontologia inteira do DomainSpec ou só as duas tabelas que rendem mais.** Você
   não precisa dos 25 tipos e 29 relações para colher 80% do ganho. As tabelas de **regras**
   e de **estados (com os proibidos)** sozinhas já pagam. O resto é opcional.
3. **A ordem dos módulos.** Financeiro está "parcial", o dashboard está mockado, a Fase 2
   do cardápio está pendente. Qual é o próximo que move a agulha de *venda*? Isso é seu.

---

## Edições concretas, em ordem de alavancagem

Da que dá mais retorno pelo menor esforço, para a menor:

1. **`app/page.tsx`** — trocar os dados mockados do dashboard por `query`s reais, **ou**
   marcar visivelmente os cards como "ilustrativos" enquanto não houver dado.
   *Efeito:* tira o número falso da cara do dono. Barato, alto impacto de confiança.
2. **`supabase/functions/calcular-cardapio-uan`** (e a tela da lista de compras) — uma
   frase declarando que a lista ainda não desconta o estoque.
   *Efeito:* transforma uma falha-surpresa em expectativa gerenciada; vira argumento de
   venda da Fase 2.
3. **`docs/` — nova `SPEC.md` de "Rótulo ANVISA"** com os limites das lupas, as regras de
   arredondamento e as declarações obrigatórias **como tabela**.
   *Efeito:* a regulação passa a ter uma fonte única e legível; mudança de norma vira
   mudança de uma linha. (Gancho com o achado 1.)
4. **`full_schema.sql` + `.env.example`** — popular o schema base e adicionar o exemplo de
   variáveis de ambiente.
   *Efeito:* fecha o resíduo "ninguém liga o projeto do zero". Importante no dia em que
   entrar um sócio técnico ou você trocar de máquina.
5. **`docs/` — uma tabela de "transições proibidas"** por entidade (Ficha, Lote, Cardápio).
   *Efeito:* vira o roteiro de testes de auditoria sanitária, de graça.

---

## Um caminho concreto que você pode usar amanhã (as etapas)

Pegue **uma** fatia — sugiro a **lista de compras do cardápio**, porque ela toca cardápio,
estoque e o resíduo do achado 2 ao mesmo tempo. Faça assim, na ordem (é o ciclo do
DomainSpec, traduzido para o seu dia):

1. **Entender (sem código).** Escreva, em português, as perguntas de negócio: "o que
   dispara a lista? ela desconta estoque? como trata sobra de validade? arredonda para a
   embalagem do fornecedor?" Classifique cada coisa: `ListaCompra` é uma *entidade*,
   "gerar lista" é uma *operação*, "desconta estoque" é uma *regra*.
2. **Especificar.** Vire as respostas numa tabela de regras (como a L1/L2/A1 do achado 1) e
   numa tabela de estados, **incluindo os proibidos** ("não gerar lista para cardápio não
   aprovado"). Quem aprova essa tabela é o nutricionista, não o programador.
3. **Derivar os testes.** Cada linha da tabela vira um teste. A regra de ouro do DomainSpec:
   *se você não consegue escrever o teste a partir da tabela, é a tabela que está
   incompleta* — e aí você achou um buraco no entendimento **antes** de programar, quando
   ainda é barato.
4. **Implementar.** Aí sim mexe no código (`calcular-cardapio-uan`), agora contra um
   contrato claro. Quando aparecer ambiguidade ("free-text ou enum?"), a regra é **perguntar,
   não chutar** — é o que impede a IA de errar em velocidade de máquina.
5. **Declarar o resíduo.** O que essa fatia ainda não faz, escreva na tela e na `SPEC.md`.

Esse ciclo cabe numa fatia por vez. Você não reescreve o sistema; você endireita uma fatia
e ela fica "à prova de auditoria". Na próxima, repete.

---

## Uma observação que está além da auditoria

O seu fosso competitivo não é o cálculo de nutriente nem o solver de cardápio — qualquer
concorrente bem financiado copia isso em alguns meses. O seu fosso é a **combinação**:
legislação embutida **+** trilha de auditoria imutável (soft delete + snapshot antes/depois
em `audit_logs_gxp`) **+** assinatura eletrônica. Ou seja, você não vende "um cardápio
bonito" — você vende *"compliance que se explica sozinho na frente de um fiscal"*.

Tudo neste memorando empurra na mesma direção: tornar as regras **legíveis e testáveis**
(achado 1), as limitações **honestas** (achado 2) e os números **rastreáveis** (achado 3).
Isso não é higiene de engenharia — é o próprio produto ficando mais vendável. Quanto mais o
seu sistema consegue *provar* o que afirma, mais caro ele pode ser cobrado. As ideias do
Arcanum e do DomainSpec, no seu caso, não são sofisticação acadêmica: são a forma de
transformar "confie em mim" em "olhe a prova".

---

## As três perguntas mais afiadas, em ordem

1. **Se a ANVISA mudar um limite de lupa amanhã, em quanto tempo você responde "quais
   clientes e quais rótulos mudam"?** (Determina se o achado 1 é urgente ou pode esperar.)
2. **Algum cliente já comprou em cima de uma lista de compras que ignora o estoque dele?**
   (Determina se o resíduo do achado 2 já está custando confiança agora.)
3. **Se um cliente perguntar "esse 98.5% do painel é real?", qual é a resposta honesta
   hoje?** (Determina a urgência do achado 3.)

— V.
