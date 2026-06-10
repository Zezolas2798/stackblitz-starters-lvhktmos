---
title: "Regra → Teste: como transformar uma regra ANVISA ou de negócio em teste"
audience: "Dono de produto que escreve software (nutridev-manager); pensa por abstrações, não quer matemática"
source: "Adaptado de DomainSpec — TAXONOMY.md (bloco 'Rule'), templates/rules.md e templates/TEST-SPEC.md (IDs estáveis + rastreabilidade 'Checked by' / 'Validates')"
---

# Regra → Teste

> A ideia central: **toda regra dura vira um teste com nome.** O documento de regras
> É o plano de teste. Se uma regra não tem um teste apontando para ela, ela não existe
> de verdade — é só uma intenção.

Isso ataca direto o seu problema: o solver de cardápio hoje tem **zero teste**.
A maneira mais barata de sair desse buraco não é "escrever testes" no vácuo — é
**listar as regras que o cardápio precisa respeitar** e dar um número a cada uma.
Os testes saem quase de graça depois.

---

## 1. O que conta como "regra"

Uma **regra** é uma condição que, se violada, deve **impedir** uma ação de acontecer.
Ela responde: *"Sob quais condições esta ação é permitida?"*

- "Receita com leite **não pode** entrar em cardápio marcado como sem-lactose."
- "Não **pode** vender lote com validade vencida."
- "Cardápio de UAN **precisa** ter no mínimo 1 opção proteica por refeição."
- "Rótulo nutricional **precisa** declarar todos os 8 alérgenos obrigatórios presentes."

Regra **não** é:
- um cálculo (kcal por porção → isso é *cálculo*, testado por valor de saída);
- uma escolha de estratégia ("qual fornecedor usar" → isso é *política*);
- um passo de processo ("primeiro reserva, depois fatura" → isso é *fluxo*).

Regra **bloqueia**. Se a frase tem um "**não pode**", "**precisa**", "**no máximo**",
"**no mínimo**", "**só se**" — é regra, e é candidata a teste.

---

## 2. A receita em 4 colunas

Para cada regra, preencha uma linha:

| ID | Regra (linguagem de gente) | Condição exata | Verificada por |
|----|-----------------------------|----------------|----------------|
| R1 | Não vende lote vencido | `lote.validade >= hoje` no momento da venda | T1 |
| R2 | Cardápio sem-lactose não tem ingrediente com leite | nenhum item do cardápio referencia ingrediente com flag `contem_leite` | T2 |
| R3 | Rótulo declara todos os alérgenos presentes | conjunto de alérgenos declarados ⊇ alérgenos dos ingredientes | T3 |
| R4 | FEFO: sai primeiro o lote que vence antes | a baixa de estoque escolhe o menor `validade` disponível | T4 |

Regras de uso (o que faz o documento valer):

1. **ID estável.** Escolha um prefixo (R1, R2…) e **nunca renumere** ao inserir.
   Regra nova vai pro fim. O ID é o que liga regra ↔ teste pra sempre.
2. **"Condição exata" é não-ambígua.** Não escreva "validade ok". Escreva
   `lote.validade >= hoje`. Se duas pessoas leem e discordam do que passa, a
   coluna ainda está vaga — aperte até virar um sim/não.
3. **Toda regra aponta um teste** na coluna "Verificada por". Sem teste apontando,
   a regra está só no papel.

---

## 3. A outra metade: o plano de teste

O espelho da tabela de regras é a **matriz de teste**. Cada teste cita qual regra
ele protege (rastreabilidade nos dois sentidos):

| ID do teste | O que faz | Valida |
|-------------|-----------|--------|
| T1 | Tenta vender um lote com `validade = ontem` → operação é rejeitada | R1 |
| T2 | Monta cardápio sem-lactose com receita que usa manteiga → bloqueado | R2 |
| T3 | Gera rótulo de receita com amendoim sem declarar amendoim → bloqueado | R3 |
| T4 | Dois lotes do mesmo item (vence dia 10 e dia 20); baixa escolhe o do dia 10 | R4 |

Repare no padrão: **a maioria dos testes de regra é um teste negativo** —
"tento fazer a coisa proibida e espero que o sistema **recuse**". Esse é o teste
mais valioso e o que falta no seu solver. Um solver de cardápio sem testes
negativos é um solver que você *acha* que respeita as restrições.

---

## 4. Três formatos de regra (e o teste de cada um)

**a) Invariante incondicional** — vale sempre, pra todo elemento.
> R: "Todo item de um cardápio sem-lactose é livre de leite."
> Teste: pega qualquer cardápio sem-lactose gerado, varre os itens, nenhum tem leite.

**b) Regra condicional** — só vale em certo contexto.
> R: "*Se* o cliente é UAN hospitalar, *então* toda refeição tem opção sem-sal."
> Teste: gera cardápio para tenant hospitalar → toda refeição tem ≥1 item sem-sal.
> (Para tenant comum, a regra não se aplica — não teste a mesma coisa lá.)

**c) Política com limites** — comportamento ajustável, mas com fronteiras duras.
> R: "Sugestão de substituto tenta no máximo 3 ingredientes alternativos antes
>     de marcar 'sem substituto'."
> Teste: ingrediente sem nenhum substituto válido → para em 3 tentativas e
>     retorna estado determinístico "sem substituto", não fica em loop.

---

## 5. Por que isso resolve o seu buraco

- **Cobertura vira uma lista, não um sentimento.** Você não pergunta "será que
  testei o suficiente?". Você pergunta "toda regra Rn tem um Tn?". Linha sem par
  é trabalho a fazer; é auditável num relance.
- **O documento é o contrato.** Quando um auditor sanitário (ou um cliente)
  pergunta "como vocês garantem X?", a resposta é a linha Rn e o teste Tn que a
  prova. Isso é exatamente o que um produto de compliance precisa vender.
- **Regressão fica barata.** Mudou o solver? Roda T1..Tn. Se algum quebra, você
  sabe *qual regra de negócio* quebrou — pelo nome — não "um teste vermelho".

---

## Checklist (cole no início de cada feature)

- [ ] Listei as regras como frases com "não pode / precisa / no máximo / só se".
- [ ] Cada regra tem ID estável e condição exata (sim/não, sem ambiguidade).
- [ ] Cada regra tem ao menos um teste apontando pra ela.
- [ ] Existe teste **negativo** para cada proibição (tento o proibido → recusado).
- [ ] Nenhuma linha de regra está sem teste; nenhum teste sem regra citada.
