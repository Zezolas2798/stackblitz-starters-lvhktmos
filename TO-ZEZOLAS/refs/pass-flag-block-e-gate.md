---
title: "PASS / FLAG / BLOCK e o portão antes de mutar"
audience: "Dono de produto que escreve software (nutridev-manager); quer prática, não teoria"
source: "Adaptado de Arcanum — arcana/decision-gate (regra de autoridade PASS/BLOCK) e arcana/task-session (modelo de 3 veredictos, FLAG = entregou com resíduo, 'nenhuma mutação consequente prossegue com BLOCK')"
---

# PASS / FLAG / BLOCK e o portão antes de mutar

> Duas ideias que cabem numa folha:
> 1. Toda ação consequente passa por um **portão** *antes* de acontecer.
> 2. O portão devolve **um de três veredictos**, não "deu certo / deu erro".

Isso ataca direto três das suas dores: publicar cardápio sem checar, vender lote
sem checar, e a "assinatura eletrônica de mentira" que hoje deixa passar qualquer
coisa. O portão é o lugar onde uma regra dura *trava* a operação.

---

## 1. Os três veredictos

A maioria dos sistemas só tem dois estados: **funcionou** ou **quebrou**. Isso é
pobre demais para compliance. Use três:

| Veredicto | Significado | O que acontece a seguir |
|-----------|-------------|--------------------------|
| **PASS**  | Tudo que **precisava** ser verdade é verdade. | A ação prossegue. |
| **FLAG**  | A ação **aconteceu**, mas carregou um resíduo: algo ficou pendente, degradado ou com aviso. | Prossegue, **mas registra a pendência** e cobra acompanhamento. |
| **BLOCK** | Uma regra **dura** falhou, ou falta evidência pra decidir. | A ação **não acontece**. Para antes de mutar. |

O pulo do gato é o **FLAG**. Sem ele, você é forçado a escolher entre mentir
("PASS" quando não está perfeito) ou travar tudo ("BLOCK" por qualquer coisinha).
FLAG é "entregou, mas com ressalva anotada" — o estado honesto do mundo real.

Exemplos no seu domínio:

- Publicar cardápio onde toda refeição tem proteína e nenhum alérgeno não-declarado
  → **PASS**.
- Publicar cardápio válido, mas uma foto de prato está faltando → **FLAG**
  (publica, registra "foto pendente", não trava o serviço).
- Publicar cardápio sem-lactose que contém manteiga → **BLOCK** (não publica).
- Vender lote vencido, ou vender estoque de **outro tenant** → **BLOCK**.
- Tentar "assinar" um documento sanitário sem identidade verificada → **BLOCK**
  (é exatamente o caso da assinatura falsa: hoje devolve PASS; deveria devolver BLOCK).

---

## 2. A regra de autoridade

> **Nenhuma mutação consequente prossegue enquanto o portão estiver em BLOCK.**

"Mutação consequente" = qualquer coisa difícil ou caro de desfazer:
publicar cardápio, dar baixa em estoque, emitir rótulo oficial, assinar laudo,
mudar dados de outro tenant.

O portão é **antes**, não depois. Validar depois de já ter vendido o lote vencido
é tarde. O ponto inteiro é: a checagem roda **antes da escrita**, e se trava,
a escrita não chega a existir.

Quando travar (BLOCK), devolva sempre **a ação exata de desbloqueio**, não só "erro":
- ❌ "Falha ao publicar."
- ✅ "BLOCK: cardápio sem-lactose R2 — item 'Purê' usa ingrediente com leite.
   Troque o ingrediente ou remova a marcação sem-lactose."

---

## 3. Onde colocar o portão (os seus 4 pontos quentes)

| Ação consequente | Regra dura que, se falhar, vira BLOCK |
|------------------|----------------------------------------|
| Publicar cardápio | Restrições dietéticas + mínimos nutricionais respeitados |
| Dar baixa / vender estoque | Lote não vencido **e** lote pertence ao tenant atual (FEFO) |
| Emitir rótulo nutricional | Todos os alérgenos presentes estão declarados |
| Assinar documento | Identidade verificada **e** assinatura criptográfica real, não placeholder |

A coluna da direita não sai do nada — são as **regras Rn** do seu doc
`regra-para-teste.md`. O portão é onde essas regras param de ser teste e viram
**guarda em produção**: a mesma condição que o teste verifica, o portão aplica
ao vivo, antes de mutar.

---

## 4. O caso da isolação de tenant (por que isso é um BLOCK, não um bug menor)

Vazamento entre tenants não é "comportamento degradado" — é **BLOCK**. A regra é:
*toda operação consequente carrega o `cliente_id` do ator, e qualquer dado tocado
que não seja desse cliente trava a operação.* Não existe "FLAG, mas deixa passar"
para dado de outro cliente. Isso é fronteira dura: PASS ou BLOCK, nunca FLAG.

Modelo mental: o portão pergunta **duas** coisas antes de mutar —
"a regra de negócio passou?" **e** "o ator tem autoridade sobre **este** dado?".
Falhou qualquer uma → BLOCK.

> É o achado 1 do TO-ZEZOLAS2 em forma de regra: hoje, esse segundo portão não
> existe nas tabelas `*_uan`. Fechar isso é colocar o BLOCK onde já deveria estar.

---

## 5. Não trave o que é trivial e reversível

O portão é caro em atrito. Reserve BLOCK para o que é consequente:
irreversível, regulatório, ou que toca outro tenant. Para o resto — um campo
opcional faltando, uma foto ausente — use **FLAG**: registra a pendência e segue.
Travar tudo treina o usuário a ignorar o portão; aí ele perde o valor justo nos
casos que importam.

---

## Checklist (antes de cada ação consequente)

- [ ] Esta ação é difícil/caro de desfazer? Se sim, tem portão **antes** dela.
- [ ] O portão devolve um de **três** veredictos, não "ok/erro".
- [ ] Regra dura falhou **ou** falta evidência → **BLOCK**, e nada é escrito.
- [ ] Ator tocando dado de outro cliente → **BLOCK** sempre (nunca FLAG).
- [ ] Entregou com pendência → **FLAG**, e a pendência fica registrada.
- [ ] Todo BLOCK devolve a **ação exata** de desbloqueio, não só uma mensagem de erro.
- [ ] Assinar / emitir documento oficial exige identidade real → caso contrário BLOCK.
