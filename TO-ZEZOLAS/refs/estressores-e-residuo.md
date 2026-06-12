---
title: "Estressores e resíduo — projetar para o dia ruim, não só para o dia bom"
audience: "Dono do nutridev-manager; pessoa de negócio que entrega software, sem teoria"
source: "Adaptado de Arcanum arcana/residuality-spec (stressor → residue → degradation → attractor)"
---

# Estressores e resíduo

> "Seja resiliente" é um desejo, não uma especificação. Para virar algo concreto e
> testável, você nomeia quatro coisas:
> 1. **Estressor** — o que pode bater no sistema (o choque).
> 2. **Resíduo** — o que **tem que continuar verdadeiro** depois do choque.
> 3. **Degradação** — o "pior-porém-aceitável" enquanto o choque dura.
> 4. **Atrator** — o ponto fraco que reaparece em vários choques diferentes (vale
>    consertar uma vez só).

Por que isto importa para você: o TO-ZEZOLAS2 achou três casos em que o sistema falha
**em silêncio** — a etiqueta "imprime com sucesso" sem sair papel, o rótulo fica em
branco sem mensagem, e qualquer operação morre sem rede. Falhar em silêncio num produto
sanitário é o pior tipo de falha: o usuário acha que deu certo.

---

## A tabela (preencha uma linha por estressor)

| Estressor (o choque) | Resíduo (o que NÃO pode quebrar) | Degradação (o aceitável) |
|----------------------|----------------------------------|--------------------------|
| Impressora sem papel / cabeça aberta | Nenhum produto vai pra câmara sem etiqueta de validade *achando* que foi etiquetado | "Impressão não confirmada — reimprima ou etiquete à mão", e o registro fica pendente, não "concluído" |
| Navegador sem WebUSB (Safari/iPad) | O operador consegue etiquetar de algum jeito | Cai para um PDF/etiqueta imprimível pelo navegador, em vez de travar a operação |
| Edge Function (cálculo/solver) dá timeout | O usuário sabe que **falhou**, não vê resultado falso | Mensagem clara "cálculo falhou, tente de novo" — nunca um rótulo em branco silencioso |
| Sem internet na cozinha/almoxarifado | O usuário sabe que **não salvou** | Aviso "sem conexão — não salvo" em vez de parecer que salvou |
| Cliente A consulta dado do Cliente B | Dado de outro cliente nunca aparece | Não há degradação aceitável: isto é BLOCK duro (veja `pass-flag-block-e-gate.md`) |

---

## O atrator (o pulo do gato)

Olhe a coluna dos estressores acima. Quatro deles — impressora offline, navegador sem
WebUSB, edge function caída, sem internet — quebram **do mesmo jeito**: *"o sistema
afirma sucesso quando na verdade não fez."* Isso é o **atrator**: dez problemas
diferentes que são, no fundo, um ponto fraco só — **falhar em silêncio**.

A consequência prática é ótima: você não precisa de dez correções. Precisa de uma
regra geral — **"toda operação consequente confirma o resultado real antes de declarar
sucesso"** — aplicada nos quatro pontos. Resolver o atrator é mais barato e mais
poderoso do que remendar cada estressor isolado.

---

## Como usar

1. **Por feature nova, liste 3 estressores** (não precisa de mais): o que acontece se a
   rede cair, se o hardware falhar, se o serviço externo demorar?
2. **Para cada um, escreva o resíduo** — a frase do tipo "mesmo assim, X continua
   verdadeiro". Essa frase vira um teste (veja `regra-para-teste.md`).
3. **Procure o atrator:** dois ou mais estressores que quebram igual? Conserte a causa
   comum uma vez.
4. **Regra de ouro:** entre "falhar em silêncio" e "falhar alto", sempre falhe alto. Num
   produto sanitário, um erro visível é seguro; um sucesso falso é o que vira multa.

> Em uma frase: nomeie o choque, diga o que tem que sobreviver, aceite uma degradação
> honesta — e quando o mesmo ponto fraco aparecer em vários choques, conserte o atrator,
> não cada sintoma.
