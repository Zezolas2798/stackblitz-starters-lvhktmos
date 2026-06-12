---
title: "Glossário do domínio — um significado por termo"
audience: "Dono do nutridev-manager; pessoa de negócio que entrega software, sem teoria"
source: "Adaptado de DomainSpec templates/glossary.md (linguagem ubíqua) e Arcanum definitions/DEFINITIONS.md (definição canônica + intuição em linguagem simples)"
---

# Glossário do domínio

> A regra única: **cada termo importante tem UM significado, definido em UM lugar.**
> Quando a palavra aparece num doc, no código, numa conversa ou numa tela, ela
> significa exatamente o que está aqui. Quem quiser usar a palavra com outro sentido
> precisa cunhar um termo novo — não redefinir o antigo.

Por que isto importa para você: o TO-ZEZOLAS2 mostrou que "ficha técnica" significa
três coisas no seu sistema, e que "comensais/porções/per capita" são quatro
vocabulários para a mesma ideia. Cada sinônimo é um lugar onde um humano (ou a IA que
você usa pra programar) pega o conceito errado — e a conversão "comensais ↔ porções" é
justo onde a precisão da sua lista de compras (a H-007, de ±5%) vive ou morre.

---

## Como cada verbete é escrito

| Campo | Para que serve |
|-------|----------------|
| **Termo** | A palavra canônica (escolha UMA quando houver sinônimos hoje) |
| **Significa** | Uma frase, sem ambiguidade, que um nutricionista entende |
| **Não confundir com** | Os termos vizinhos que parecem iguais e não são |
| **Onde é aplicado** | A tela / função / regra que usa esse sentido (a "ponte" — veja meta-camadas) |

---

## Verbetes iniciais (os que estão fazendo drift hoje)

### Ficha Técnica (industrial) — canônico: `Receita`
- **Significa:** a formulação de um produto industrializado, com ingredientes e
  composição, que gera o **rótulo nutricional**.
- **Não confundir com:** *Ficha Técnica de UAN* (abaixo), que é operação de refeitório,
  não rotulagem.
- **Onde é aplicado:** módulo industrial / `calcular-nutrientes` / rótulo.

### Ficha Técnica de UAN — canônico: `FichaTecnicaUAN`
- **Significa:** a receita operacional de uma refeição servida num refeitório, com
  rendimento em porções e atributos sensoriais (cor, textura, família proteica).
- **Não confundir com:** *Receita* (industrial). São entidades diferentes; "ficha
  técnica" sozinho é ambíguo — sempre diga qual das duas.
- **Onde é aplicado:** módulo UAN / cardápio / `uan-validator`.

### Porções — canônico: `porcoes`
- **Significa:** quantas porções uma **ficha** rende (atributo da receita).
- **Não confundir com:** *comensais* (atributo do cardápio/dia, abaixo).
- **Onde é aplicado:** `rendimento_porcoes`, `peso_porcao_g`.

### Comensais — canônico: `comensais`
- **Significa:** quantas **pessoas** serão servidas num dia/refeição (atributo do
  cardápio, não da ficha).
- **Não confundir com:** *porções*. A lista de compras precisa **converter** porções
  (da ficha) em comensais (do cardápio) — é uma conversão de unidade, e é onde um erro
  vira "comprou para 100, serviu 250". Escreva a conversão como uma *Operação* nomeada
  e teste-a (veja `regra-para-teste.md`).
- **Onde é aplicado:** `comensais_estimados_dia`, `comensais_modelo`.

### Per capita — canônico: `per_capita`
- **Significa:** a quantidade (ou custo) de um insumo **por comensal**.
- **Não confundir com:** *porção* (unidade servida) nem *rendimento* (total da ficha).
- **Onde é aplicado:** cálculo de custo e de necessidade de compra.

### UAN (lugar) vs UAN (módulo)
- **UAN-lugar:** "Unidade de Alimentação e Nutrição" — o **cliente/refeitório** que você
  atende.
- **UAN-módulo:** o **prefixo** do seu domínio de refeitório (`FichaTecnicaUAN`,
  `CardapioUAN`, `uan-validator`), em oposição ao módulo industrial/rotulagem.
- **Regra:** quando escrever "UAN", deixe claro se fala do cliente ou do módulo. São
  coisas diferentes que hoje compartilham a sigla.

---

## Como usar

1. **Não renomeie o código agora** (quebraria o app). O glossário vive no papel/doc
   primeiro; ele decide o que cada palavra significa, e o código vai sendo alinhado aos
   poucos.
2. **Toda tela e todo doc novo** usa o termo canônico. Sinônimo só com um "(= termo
   canônico)" ao lado, até sumir.
3. **Promoção deliberada:** se a equipe quiser um termo novo ("validade promocional"),
   ele é *local* até ser formalmente adicionado aqui — não pode redefinir um termo de
   compliance em silêncio.
4. **Cada verbete aponta onde é aplicado** — isso é a "ponte" do `meta-camadas.md`: o
   link entre a palavra e o código que a realiza, que é o que deixa o drift visível.

> Em uma frase: um termo, um significado, um lugar — e a conversão "porções ↔ comensais"
> vira uma operação nomeada e testada, porque é ali que os seus ±5% se decidem.
