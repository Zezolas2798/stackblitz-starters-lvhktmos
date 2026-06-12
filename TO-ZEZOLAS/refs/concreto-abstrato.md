---
title: "Concreto → Abstrato: o modelo mental para pensar e decidir no nutridev-manager"
audience: "Dono de SaaS de food-service / compliance ANVISA (nutridev-manager): rótulo nutricional, cardápio de UAN, estoque por lote/FEFO, ficha técnica, auditoria sanitária. Pessoa de negócio que entrega software, sem matemática nem teoria."
source:
  - "Arcanum / TO-VLAD/README.md — a 'regra do subconjunto' (claim ≤ proof / afirmação ≤ prova) e a ideia de 'altitude' (uma camada de abstração acima da outra)."
  - "Arcanum / framework/CYBERALCHEMY-METHOD.md — anti-padrões: 'tratar o contexto disponível como o mundo inteiro' e 'adicionar abstrações porque soam elegantes'."
  - "Arcanum / arcana/distill/SKILL.md — destilar: achar a menor unidade que ainda cabe no seu contexto e provar que ela recompõe o todo."
  - "DomainSpec / README.md, TAXONOMY.md — subir do exemplo concreto para a categoria/tipo e voltar, sem perder a ligação com a evidência."
---

# Concreto → Abstrato

Um modelo mental prático para pensar melhor, escrever docs mais claros e conversar com a IA sem se enrolar. Sem matemática. Só o que te serve no nutridev-manager.

---

## A única regra que importa

> **Comece sempre por uma coisa concreta do seu negócio — UM rótulo, UM lote, UM cardápio — antes de falar da regra geral. A regra só vale se você consegue mostrar o exemplo que ela explica.**

Abstração boa nasce de um caso real e volta para um caso real. Abstração ruim começa "no ar" e nunca aterrissa. Se alguém (ou você, ou a IA) fala só em conceito e não consegue te dar o exemplo concreto, o conceito provavelmente está oco.

---

## A escada: concreto → abstrato → concreto de novo

Pense numa escada de 3 degraus. Você **sobe** para enxergar o padrão e **desce** para conferir se o padrão aguenta a realidade.

| Degrau | O que é | Pergunta que você faz |
| --- | --- | --- |
| 1. Concreto (sobe daqui) | Uma coisa específica, que existe | "Mostra UM exemplo real." |
| 2. Abstrato (o padrão) | A regra, a categoria, o tipo que vale para vários | "Qual é a regra geral por trás disso?" |
| 3. Concreto de novo (desce e confere) | Um SEGUNDO exemplo, diferente do primeiro | "A regra também explica ESTE outro caso?" |

A jogada inteira é: **nunca pare no degrau 2.** Subir até o padrão é fácil e perigoso — soa inteligente. Só o degrau 3 (um segundo exemplo concreto) prova que o padrão é real e não uma frase bonita.

### Exemplo 1 — Rótulo nutricional

1. **Concreto:** o rótulo da "Granola Premium 300g" estourou o limite de sódio na conferência.
2. **Abstrato (subo):** "Todo produto que leva ingrediente industrializado pré-pronto precisa de revisão de sódio antes de fechar o rótulo."
3. **Concreto de novo (desço e confiro):** e o "Mix de Castanhas com Shoyu"? Tem industrializado salgado → a regra explica ele também. ✅ A regra vale.

### Exemplo 2 — Estoque por lote / FEFO

1. **Concreto:** o lote L-2024-0312 de iogurte venceu na prateleira sem ser usado, porque saiu um lote mais novo primeiro.
2. **Abstrato (subo):** "Item perecível tem que sair pela ordem de vencimento (FEFO), não pela ordem de chegada."
3. **Concreto de novo (desço e confiro):** e a polpa de fruta congelada do lote L-0119? Mesma lógica de validade → a regra explica. ✅

### Exemplo 3 — Ficha técnica / cardápio de UAN

1. **Concreto:** a ficha técnica do "Estrogonofe de frango" não bate com o que o estoque deu baixa.
2. **Abstrato (subo):** "Toda receita do cardápio precisa de ficha técnica com rendimento e per capita que case com a baixa de estoque."
3. **Concreto de novo (desço e confiro):** e a "Salada de grão-de-bico"? Também é item de cardápio com per capita → cabe na regra. ✅

> **Regra prática:** uma ideia abstrata só "passa" quando você tem **pelo menos dois exemplos concretos diferentes** do seu domínio que ela explica. Um exemplo é sorte. Dois é padrão.

---

## A regra do subconjunto: nunca afirme mais do que consegue mostrar

Essa é a irmã da regra principal, e é a que mais te protege numa auditoria, numa reunião ou num contrato.

> **Afirmação ≤ Prova.** O que você diz não pode ser maior do que o que você consegue mostrar. Se a evidência cobre só uma fatia, fale só dessa fatia.

Em português direto: **não venda o que você não consegue provar na hora.**

| O que você quer dizer | O que a prova realmente cobre | O que você deve dizer |
| --- | --- | --- |
| "Nosso sistema garante 100% de conformidade ANVISA." | Você valida rótulo e FEFO, mas não fiscaliza a higiene da cozinha do cliente. | "Garantimos a conformidade do **rótulo e do controle de lote/validade**." |
| "Rastreamos todos os ingredientes." | Você rastreia por lote os itens cadastrados com lote. | "Rastreamos por lote **os ingredientes cadastrados com número de lote**." |
| "A auditoria está 100% pronta." | 3 dos 5 checklists sanitários foram preenchidos. | "3 de 5 checklists prontos; faltam 2." |

**Exemplo de comida:** você não pode escrever no rótulo "fonte de fibras" se a porção não atinge o mínimo que a norma exige. A afirmação ("fonte de fibras") tem que ser **menor ou igual** à prova (os gramas reais por porção). É exatamente a mesma disciplina — só que aplicada às suas palavras em vez do rótulo.

Quando a afirmação for maior que a prova, você tem duas saídas honestas:
1. **Encolher a afirmação** até caber na prova (o mais comum e mais rápido).
2. **Aumentar a prova** — ir buscar a evidência que falta — e só então afirmar mais.

---

## Sinais de que alguém pulou direto pro abstrato (e está blefando)

- Fala em "a plataforma", "o fluxo", "a conformidade" e **não consegue te dar um exemplo de um produto / lote / cardápio específico**.
- Usa palavra grande ("escalável", "robusto", "garantido") sem um caso real atrás.
- A regra geral explica o caso que ele escolheu, mas **desmorona no segundo exemplo** que você pede.
- Mistura tudo num conceito só ("é tudo questão de compliance") em vez de separar rótulo, lote, ficha técnica e auditoria.

Resposta padrão a qualquer um desses: **"Me mostra um exemplo concreto."** Se não vier, o abstrato está oco.

---

## Como usar isto numa reunião / num doc / com a IA

### Numa reunião
- Comece pelo caso concreto: "Semana passada o lote X venceu na prateleira." Isso prende a sala na realidade antes de qualquer teoria.
- Quando alguém subir pro abstrato ("precisamos de um processo de validade"), peça o **segundo exemplo**: "isso resolve também o caso Y?"
- Antes de fechar qualquer decisão, aplique o subconjunto: "a gente consegue **provar** o que está afirmando aqui?"

### Num documento (spec, proposta, contrato, página de venda)
- **Abra com um exemplo concreto**, não com a definição. O leitor entende a regra mais rápido vendo um caso.
- Depois enuncie a regra/categoria geral.
- Feche com um **segundo exemplo** que mostra a regra funcionando em outra situação.
- Releia cada frase de venda/garantia com a régua do subconjunto: *eu consigo mostrar isso?* Se não, encolha a frase.

### Com a IA (ChatGPT, Claude, etc.)
- **Dê o exemplo concreto primeiro.** "Tenho o rótulo da Granola 300g, sódio 480mg/porção, limite X" rende uma resposta muito melhor do que "me ajuda com rótulos".
- Peça à IA para **subir e descer a escada por você:** "qual a regra geral aqui? agora me dá um segundo exemplo do meu negócio onde ela vale."
- Cobre o subconjunto da IA: "não afirme nada que você não consiga justificar com o que eu te dei." Isso corta invenção.
- Desconfie de resposta que fica só no abstrato. Devolva: **"me dá um exemplo concreto de cardápio/lote/rótulo."**

---

## Resumo de bolso

| Faça | Evite |
| --- | --- |
| Começar por UM caso real do seu negócio | Começar pela teoria ou pela definição |
| Subir até a regra geral | Parar no abstrato achando que terminou |
| Conferir com um SEGUNDO exemplo concreto | Confiar num exemplo só |
| Afirmar só o que consegue mostrar (afirmação ≤ prova) | Vender mais do que a evidência cobre |
| Pedir "me mostra um exemplo" quando algo soa vago | Aceitar palavra grande sem caso atrás |

**Em uma frase:** suba do concreto para a regra, mas só acredite na regra quando ela aterrissar de novo num segundo caso concreto — e nunca diga mais do que consegue provar na hora.
