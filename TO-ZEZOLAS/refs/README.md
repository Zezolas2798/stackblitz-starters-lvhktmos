# refs/ — documentos de referência

Materiais curtos e práticos destilados do Arcanum e do DomainSpec, adaptados ao seu
domínio (rótulo ANVISA, cardápio de UAN, FEFO, ficha técnica, auditoria). Servem de apoio
aos memorandos `TO-ZEZOLAS.md` e `TO-ZEZOLAS2.md`. Cada um cabe numa leitura; nenhum tem
matemática.

| Documento | Para quê | Liga-se a |
|-----------|----------|-----------|
| [concreto-abstrato.md](concreto-abstrato.md) | O modelo mental de pensar do caso concreto para a regra e voltar; a regra do subconjunto (afirmação ≤ prova). Como usar em reunião, doc e com a IA. | base de tudo |
| [meta-camadas.md](meta-camadas.md) | As camadas acima do código (intenção → regra → código) e a "ponte" que detecta drift. As duas altitudes (significado vs execução). | TO-ZEZOLAS2 achado 1 (drift da RLS) |
| [regra-para-teste.md](regra-para-teste.md) | Como transformar uma regra ANVISA/de negócio num teste com nome. O documento É o plano de teste. | TO-ZEZOLAS2 achado 3 (solver sem teste) |
| [pass-flag-block-e-gate.md](pass-flag-block-e-gate.md) | Os três veredictos e o portão antes de mutar: travar publicação/venda/assinatura quando uma regra dura falha. | TO-ZEZOLAS2 achados 1, 2 e 3 |
| [glossario-do-dominio.md](glossario-do-dominio.md) | Um significado por termo. Mata o drift de "ficha técnica" e "comensais vs porções". | TO-ZEZOLAS2 achado sutil (±5%) |
| [estressores-e-residuo.md](estressores-e-residuo.md) | Projetar para o dia ruim: nomear o choque, o que sobrevive, a degradação aceitável, e o atrator (falhar em silêncio). | TO-ZEZOLAS2 edição 6 (falhar alto) |

**Ordem sugerida de leitura:** `concreto-abstrato` → `meta-camadas` → depois os quatro
práticos conforme o achado que você for atacar.
