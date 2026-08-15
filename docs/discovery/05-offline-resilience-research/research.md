---
tags: [nutridev-v2, offline-resilience, subagents, architecture]
node_type: subagents-research
is_session: false
layer: architecture, domain, application
nature: reference, technical
status: exploratory
version: 0.1.0
last_updated: 2026-08-14
---

## Agent 0 — precedentes operacionais externos

Pesquisa concluída em **2026-08-14**. O skill `research` orientou o registro source-first, a separação entre prova e inferência e os collapse-tests. Todos os itens abaixo vieram de páginas oficiais abertas integralmente; snippets serviram apenas para localização.

## Source claims

**E0-C1 — Stripe Terminal**

- **Fonte/versionamento/seletor:** [Stripe Terminal — Collect card payments while offline](https://docs.stripe.com/terminal/features/operate-offline/collect-card-payments?reader-type=bluetooth&terminal-card-present-integration=terminal&terminal-sdk-platform=android), Android SDK ≥3.2.0; “Connect to a reader while offline”, “Managing risk”, “Wait for payments to forward”.
- **Evidência parafraseada:** o SDK mantém PaymentIntents localmente e os encaminha automaticamente ao recuperar conectividade. O terminal precisa ter conectado online, na mesma Location e tipo de leitor, nos últimos 30 dias. Há teto imposto de US$10.000 por transação offline. O ID definitivo nasce no backend; a aplicação deve usar identificador próprio para reconciliação. Reinstalar, limpar cache/disco ou desligar cedo pode perder pagamentos ainda não encaminhados. Autorização posterior pode falhar; risco de recusa e adulteração fica com o comerciante.
- **evidence_scope:** pagamento presencial Android/Bluetooth; WAN indisponível e perda do estado local. Backend indisponível isoladamente não é distinguido. **proof_status:** observed.
- **Inferência local:** continuidade financeira exige tratar fila local como valor em custódia, com inventário, limite e indicador de drenagem.
- **Implicação Nutridev:** qualquer ação offline irreversível precisa de ID local reconciliável e estado “pendente”, sem alegar sucesso de backend.
- **collapse-test:** cai se a integração autorizar/persistir definitivamente no servidor antes de concluir localmente ou se o estado sobreviver comprovadamente à limpeza do dispositivo.

**E0-C2 — Square POS API**

- **Fonte/versionamento/seletor:** [Square — Use the Point of Sale API in Offline Mode](https://developer.squareup.com/docs/pos-api/cookbook/offline-mode), aplica-se a POS API iOS/Android; “Requirements and limitations”, “Offline payment results”.
- **Evidência parafraseada:** leitor e app precisam ter estado online nas 24 horas anteriores; offline deve ser habilitado antes da queda e Bluetooth deve permanecer conectado. Transações são staged, sem `transaction_id` de backend, recebendo `client_transaction_id`; após reconexão são processadas automaticamente e podem ser recusadas se não processadas em 24 horas.
- **evidence_scope:** POS integrado; janela operacional, autenticação/pré-condicionamento e reconciliação. Perda do dispositivo não documentada. **proof_status:** observed.
- **Inferência local:** o precedente diferencia aceitação local de confirmação central e impõe validade temporal curta.
- **Implicação Nutridev:** “operação aceita offline” não pode equivaler a “compromisso confirmado”.
- **collapse-test:** cai se Square atribuir ID de backend e garantir liquidação ainda desconectado.

**E0-C3 — Shopify POS**

- **Fonte/versionamento/seletor:** [Offline payments](https://help.shopify.com/en/manual/sell-in-person/shopify-pos/selling-offline/offline-payments), POS ≥9.14; [offline features](https://help.shopify.com/en/manual/sell-in-person/shopify-pos/selling-offline/offline-features), “Caution” e tabela; consultadas em 2026-08-14.
- **Evidência parafraseada:** exige habilitação administrativa, permissão do funcionário e limites por transação e total diário do dispositivo. Pagamentos ficam pendentes no POS e sincronizam ao reconectar; recomenda reconectar idealmente em 24 horas, mas não declara prazo garantido. Login, devoluções, gift cards e várias funções exigem rede. Logout ou desligamento pode perder pedidos offline. No Terminal Reader, a LAN/Wi‑Fi local ainda precisa funcionar mesmo sem Internet.
- **evidence_scope:** POS app/hardware; WAN, autenticação, limitação funcional e perda do dispositivo. **proof_status:** observed.
- **Inferência local:** “offline” pode significar somente ausência de WAN, não perda da rede local nem indisponibilidade total do equipamento.
- **Implicação Nutridev:** cenários de falha devem separar WAN, LAN, backend e dispositivo.
- **collapse-test:** cai se o produto documentar operação equivalente durante perda total de LAN e preservação remota dos pedidos antes da sincronização.

**E0-C4 — Microsoft Power Apps/Dataverse**

- **Fonte/versionamento/seletor:** [How mobile offline works](https://learn.microsoft.com/en-us/power-apps/mobile/mobile-offline-works-overview), `ms.date` 2026-01-07, “Offline profile”, “Data synchronization”, “Local storage”; [Resolve sync conflicts](https://learn.microsoft.com/en-us/power-apps/mobile/resolve-sync-conflicts), `ms.date` 2024-06-13.
- **Evidência parafraseada:** perfil define tabelas, colunas, filtros e relacionamentos; download inicial cria cache SQLite, fonte primária inclusive online. Escritas entram em fila e sincronizam ao reconectar; down-sync é incremental. Não há expiração fixa: dados persistem enquanto app/perfil permanecerem, mas cache limpo, desinstalação ou logout antes da conclusão podem removê-los. Conflitos usam último valor por coluna; validações/plugins do servidor podem reverter mudanças locais e gerar Sync Error.
- **evidence_scope:** apps móveis offline-first sobre Dataverse; armazenamento, duração, reconciliação e conflito. **proof_status:** observed.
- **Inferência local:** longa autonomia aumenta a distância entre cache plausível e verdade validada.
- **Implicação Nutridev:** validações server-side precisam aparecer como resultado posterior auditável.
- **collapse-test:** cai se todas as regras relevantes puderem ser executadas e confirmadas localmente sem divergência do servidor.

**E0-C5 — Salesforce Mobile SDK**

- **Fonte/versionamento/seletor:** Mobile SDK **13.1** confirmado em [Supported Versions](https://developer.salesforce.com/docs/platform/mobile-sdk/guide/reference-current-versions.html); [SmartStore Soups](https://developer.salesforce.com/docs/platform/mobile-sdk/guide/offline-smartstore-soups.html), “SmartStore data is volatile”; [Mobile Sync Plugin Methods](https://developer.salesforce.com/docs/platform/mobile-sdk/guide/entity-framework-plugin-methods.html), `syncDown`/`syncUp`; [About Salesforce Mobile Apps](https://developer.salesforce.com/docs/platform/mobile-sdk/guide/preface-arch.html), “SmartStore Encrypted Database”.
- **Evidência parafraseada:** SmartStore usa banco local SQLite/SQLCipher com AES‑256. Mobile Sync envia mudanças ao retornar a conectividade e oferece políticas overwrite ou leave-if-changed. A duração do estado é vinculada ao usuário e ao OAuth: logout, revogação ou expiração do refresh token purgam os dados locais.
- **evidence_scope:** SDK para apps Salesforce customizados, não toda a aplicação Salesforce. **proof_status:** observed.
- **Inferência local:** política de autenticação também é política de retenção e recuperação offline.
- **Implicação Nutridev:** expiração/revogação deve especificar destino das mutações ainda pendentes.
- **collapse-test:** cai se a versão adotada preservar filas pendentes após logout/revogação com recuperação documentada.

**E0-C6 — Oracle Fusion Field Service**

- **Fonte/versionamento/seletor:** [Using Core Application — About Working Offline](https://docs.oracle.com/en/cloud/saas/field-service/faaca/c-workingoffline.html), guia PDF oficial publicado em maio de 2026; “About Working Offline”, “Synchronization Conflicts”.
- **Evidência parafraseada:** ações ficam na memória do navegador e sincronizam automaticamente; capacidade declarada é dependente do ambiente, com exemplos de 5 MB no iOS e 10 MB no Chrome/Android. Exceder o limite pode fazer ações não serem salvas. Não é possível login/logout offline; sessão pode ser retomada apenas antes de expirar. Alterações conflitantes podem ser rejeitadas e só são resolvidas no Core Application/integração externa. Durante a queda, o trabalhador não recebe mudanças de rota e deve contatar o despacho.
- **evidence_scope:** trabalho de campo em navegador móvel; WAN, armazenamento, autenticação, conflitos e responsabilidade humana. **proof_status:** observed.
- **Inferência local:** continuidade inclui canal operacional alternativo, não apenas sincronização técnica.
- **Implicação Nutridev:** limites de armazenamento e mudanças centrais invisíveis precisam ser explicitados ao operador.
- **collapse-test:** cai se toda alteração remota for entregue offline ou se armazenamento e sessão forem ilimitados.

**E0-C7 — SAP Mobile Services Offline OData**

- **Fonte/versionamento/seletor:** [Offline Overview](https://help.sap.com/doc/f53c64b93e5140918d676b927a3cd65b/Cloud/en-US/docs-en/guides/features/offline/overview.html), versão Cloud; “Feature Scope”, “Update Conflicts”; [Client Policy & Security](https://help.sap.com/doc/f53c64b93e5140918d676b927a3cd65b/Cloud/en-US/docs-en/guides/features/security/mdk/client-policy.html), “Locking/Wiping”.
- **Evidência parafraseada:** CRUD ocorre contra store local criptografado; requisições aguardam em fila e uploads/downloads reconciliam com backend. ETags detectam concorrência e pedidos rejeitados vão ao `ErrorArchive`; servidor permanece fonte de verdade. Em dispositivo perdido, lock preserva store e exige reconexão/reautenticação; wipe elimina também mudanças não enviadas, irreversivelmente.
- **evidence_scope:** SDK Offline OData/MDK Cloud; backend OData, conflitos e perda de dispositivo. Duração máxima não declarada. **proof_status:** observed.
- **Inferência local:** contenção de incidente e preservação de trabalho pendente entram em tensão explícita.
- **Implicação Nutridev:** procedimento de perda do dispositivo deve declarar se prioriza confidencialidade ou recuperação.
- **collapse-test:** cai se houver mecanismo documentado que apague remotamente sem perder mutações locais ainda não sincronizadas.

## Open residue

- Nenhum fornecedor consultado oferece garantia clara para **backend indisponível com WAN saudável**; quase todos documentam “sem Internet” e falha de sincronização, não continuidade sob pane lógica/control-plane.
- Square, Shopify e Stripe não prometem recuperação de estado após perda física do dispositivo; as evidências apontam o contrário ou permanecem silenciosas.
- Power Apps e Salesforce não especificam teto universal de tempo/volume para operação offline; esses limites migram para perfil, token, dispositivo e desenho do app.
- Não foram encontradas garantias de RPO/RTO offline nem prova de consistência global durante partições.

## Superfícies e exclusões

Pesquisadas: Stripe Terminal Docs, Square Developer Docs, Shopify Help/Developer API, Microsoft Learn e repositório MicrosoftDocs, Salesforce Developer Guide, Oracle Fusion Field Service Guide e SAP Help Cloud. Excluídos: snippets sem abertura, fóruns/comunidades, blogs, páginas de marketing, comparadores e relatos de terceiros. Não foi formulada arquitetura final.

## Agent 1 — garantias e limites técnicos

## Retorno do Explorer E1 — garantias e limites técnicos

Data de consulta: **2026-08-14**. `proof_status: observed` significa que a fonte foi aberta e o seletor conferido; não significa ensaio no hardware/browser do Nutridev.

### Registro de fontes primárias/oficiais

- **S1** — [W3C Service Workers 1](https://w3c.github.io/ServiceWorker/v1/), Editor’s Draft corrente; §§2.1.1, 4.5.3, 6.1.
- **S2** — [WHATWG Storage Standard](https://storage.spec.whatwg.org/), Living Standard; §§5–7.
- **S3** — [Indexed Database API 3.0](https://w3c.github.io/IndexedDB/), Editor’s Draft de 2025-08-13; §§2.7.1–2.7.2.
- **S4** — [WHATWG File System Standard](https://fs.spec.whatwg.org/), Living Standard; §§2.1, 2.3.3, 3.2.
- **S5** — [WICG Web Background Synchronization](https://wicg.github.io/background-sync/spec/), draft incubado; §§2, 5.1–5.2, 6.3.
- **S6** — Android oficial: [process lifecycle](https://developer.android.com/guide/components/activities/process-lifecycle), atualizado 2025-02-10; [Keystore](https://developer.android.com/privacy-and-security/keystore), documentação corrente.
- **S7** — Apple oficial: [Keychain](https://developer.apple.com/documentation/security/keychain-services), [Secure Enclave](https://developer.apple.com/documentation/Security/protecting-keys-with-the-secure-enclave), [background execution](https://developer.apple.com/documentation/Xcode/configuring-background-execution-modes), documentação corrente.
- **S8** — SQLite oficial: [SQLite Is Transactional](https://sqlite.org/transactional.html) e [Atomic Commit](https://sqlite.org/atomiccommit.html), documentação corrente, sem versão de engine fixada.
- **S9** — IETF [RFC 7009](https://www.rfc-editor.org/info/rfc7009), agosto/2013, §§2–3; [RFC 7662](https://www.rfc-editor.org/info/rfc7662), outubro/2015, §§2, 4.
- **S10** — Kleppmann et al., [Local-First Software](https://www.inkandswitch.com/essay/local-first/local-first.pdf), ACM Onward! 2019, DOI 10.1145/3359591.3359737, §§2–3.
- **S11** — Preguiça et al., [Conflict-free Replicated Data Types](https://arxiv.org/abs/1805.06358), 2018, Definition/Overview.
- **S12** — IETF [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html), junho/2022, §9.2.2.
- **S13** — Lamport, [Time, Clocks, and the Ordering of Events](https://pages.cs.wisc.edu/~ra/Classes/739-sp20/papers/lamport-clocks.pdf), CACM 1978; Gilbert/Lynch, [Brewer’s Conjecture](https://www.comp.nus.edu.sg/~gilbert/pubs/BrewersConjecture-SigAct.pdf), SIGACT 2002, Theorem 1.
- **S14** — WebKit, [Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/), Safari/WebKit 17, 2023.

### Source claims

- **E1-C1 — PWA offline é condicional.** Fonte S1, §§2.1.1/4.5.3/6.1. **Garantia:** em contexto seguro, um SW controlador pode responder a `fetch`; o UA **MAY** encerrá-lo sem evento ou por operação anormal. Isso garante mecanismo de interceptação, não que shell/dados estejam previamente cacheados nem execução contínua. `evidence_scope=normative-web-api`; `proof_status=observed`. **Nutridev:** uma PWA pode abrir/ler/escrever offline somente para recursos e dados materializados antes da falha. **Collapse-test:** instalação limpa, cortar rede antes do primeiro cache e tentar abrir.

- **E1-C2 — retenção web não é incondicional.** Fonte S2, §§5–7; S14, “Storage Quota/Eviction”. **Garantia:** quota é estimativa `implementation-defined`; bucket padrão é `best-effort` e deve ser candidato a eviction sob pressão. Persistência concedida impede limpeza automática sem participação da origem/usuário, mas o usuário ainda pode apagar; no WebKit 17 a quota declarada é “até” 60%/15% e explicitamente não garante gravar esse total. `scope=storage-model+WebKit17`; `proof=observed`. **Nutridev:** IndexedDB/Cache/OPFS não equivalem a arquivo corporativo irremovível. **Collapse-test:** manter bucket best-effort, induzir pressão/limpeza e verificar perda integral da origem.

- **E1-C3 — IndexedDB dá atomicidade local, não promessa absoluta contra blackout.** Fonte S3, §§2.7.1–2.7.2. **Garantia:** commit deve escrever todas ou nenhuma das mudanças da transação; ordem é garantida dentro da transação e para transações sobrepostas conforme scheduling. `durability:"strict"` é apenas **hint** e oferece “greater confidence” contra crash/power loss. `scope=single-browser-origin`; `proof=observed`. **Nutridev:** outbox+mudança de estado podem ser atômicas no mesmo banco/transação; não declarar RPO=0 sob falta total de energia. **Collapse-test:** cortar processo/energia entre gravação e `complete`, repetido por browser/SO.

- **E1-C4 — OPFS é local e bloqueável, não replicado nem fisicamente especificado.** Fonte S4, §§2.1/2.3.3/3.2. **Garantia:** `SyncAccessHandle` toma lock exclusivo e `flush()` pode refletir mudanças; localização física é `implementation-defined` e o OPFS pertence ao bucket da origem. `scope=web-file-api`; `proof=observed`. **Nutridev:** útil para arquivos/SQLite-WASM, mas herda quota/eviction e não fornece backup/sync. **Collapse-test:** provar recuperação após kill e eviction; se o arquivo sumir, a claim de durabilidade operacional cai.

- **E1-C5 — Background Sync é best-effort e não portátil como SLA.** Fonte S5, §§5.1–5.2/6.3. **Garantia:** UA **MAY** desabilitar; ao voltar online **SHOULD**, não MUST, disparar; falha **MAY** ser repetida quando o UA escolher; eventos podem sair em qualquer ordem. A própria página marca a interface principal disponível em um único engine. `scope=WICG-draft`; `proof=observed`. **Nutridev:** sincronização crítica precisa também ocorrer no foreground/abertura e ter fila persistente observável. **Collapse-test:** fechar app, negar permissão ou usar Safari/Firefox e aguardar sync sem reabertura.

- **E1-C6 — híbrido/nativo também sofre encerramento.** Fonte S6, “Processes and app lifecycle”; S7, “Background execution modes”. **Garantia:** Android pode matar processo e não garante `onDestroy()`; iOS normalmente suspende apps e oferece apenas modos/tempo limitados. `scope=mobile-process-lifecycle`; `proof=observed`. **Nutridev:** um shell híbrido não garante envio pós-fechamento; só muda as APIs disponíveis. **Collapse-test:** matar processo após capturar dado não commitado e antes do upload.

- **E1-C7 — secure storage protege chaves, não continuidade.** Fonte S6, “Extraction prevention”; S7, Keychain/Secure Enclave overview. **Garantia:** Android Keystore mantém material não exportável; vínculo a hardware é opcional e verificável; comprometimento do app ainda pode permitir usar a chave. Apple Keychain cifra pequenos segredos e Secure Enclave evita expor chave em claro. `scope=device-key-protection`; `proof=observed`. **Nutridev:** cifrar payload local com chave protegida reduz exposição por perda do tablet, mas não restaura dados nem informa revogação. **Collapse-test:** remover dispositivo/keystore e tentar recuperar a única cópia.

- **E1-C8 — SQLite pode oferecer atomicidade forte sob energia, condicional ao substrato.** Fonte S8, “SQLite is Transactional” e “Things That Can Go Wrong”. **Garantia documentada:** transações são ACID através de crash de processo/SO/energia; a própria fonte exclui configurações como `synchronous=OFF`, journal em memória e filesystem/VFS quebrado. `scope=SQLite-correctly-configured`; `proof=observed`. **Nutridev:** cliente nativo pode ter garantia local superior à promessa genérica do browser, mas só após fixar engine/configuração/filesystem e testar hardware. **Collapse-test:** power-cut repetido com configuração de produção e `integrity_check`.

- **E1-C9 — revogação imediata requer comunicação atual.** Fonte S9, RFC 7009 §3 e RFC 7662 §2. **Garantia:** revogação ocorre no servidor, admite atraso de propagação; tokens autocontidos exigem interação adicional para revogação imediata, ou validade curta limita a janela; introspecção consulta endpoint para saber `active`. `scope=OAuth-server/resource-server`; `proof=observed`. **Nutridev:** um cliente isolado não pode conhecer revogação posterior; autoridade offline deve expirar ou depender de estado de revogação pré-distribuído. **Collapse-test:** revogar vínculo durante isolamento e tentar operação local privilegiada.

- **E1-C10 — “local-first” é um modelo, não uma garantia de implementação.** Fonte S10, §§2/3.2. **Garantia:** o paper define cópia local como primária e sync secundário, e explicitamente diz que isso, por si só, não garante rapidez; também separa domínios centralizados como e-commerce/banking. `scope=design-principles/prototypes`; `proof=observed`. **Nutridev:** chamar uma fila de “local-first” não prova retenção, autorização ou convergência. **Collapse-test:** remover servidor e verificar se todo fluxo declarado continua com dados autoritativos locais.

- **E1-C11 — CRDT garante convergência somente sob precondições.** Fonte S11, Definition/Overview. **Garantia:** réplicas convergem deterministicamente quando receberam o mesmo conjunto de updates e obedecem às regras do tipo. Não garante entrega, invariantes de negócio nem resolução semanticamente correta. `scope=CRDT-model`; `proof=observed`. **Nutridev:** aplicável apenas a campos com semântica concorrente formalizada; estoque/reserva/assinatura não viram seguros por usar CRDT. **Collapse-test:** duas réplicas aplicarem o mesmo update-set e terminarem diferentes, ou convergirem violando invariante de domínio.

- **E1-C12 — idempotência HTTP não é exactly-once.** Fonte S12, §9.2.2. **Garantia:** múltiplas requisições idênticas têm o mesmo efeito pretendido para PUT/DELETE/métodos safe; logs e outros efeitos podem repetir; POST não é idempotente por definição. `scope=HTTP-semantics`; `proof=observed`. **Nutridev:** replay de outbox exige ID estável, deduplicação durável e resposta reapresentável no servidor. **Collapse-test:** perder a resposta após commit e reenviar a mesma operação.

- **E1-C13 — relógio de parede não prova causalidade.** Fonte S13/Lamport, pp. 558–564. **Garantia:** `happened-before` é ordem parcial; a extensão para ordem total é parcialmente arbitrária; relógios físicos têm erro/drift. `scope=distributed-ordering-model`; `proof=observed`. **Nutridev:** `updated_at`/“último vence” sozinho pode inverter fatos; preservar identidade, causalidade e regra de desempate. **Collapse-test:** alterar relógio de um tablet e produzir atualizações concorrentes.

- **E1-C14 — split-brain força escolha.** Fonte S13/Gilbert-Lynch, Theorem 1. **Garantia formal:** no modelo assíncrono com partição, é impossível garantir simultaneamente disponibilidade e consistência atômica. `scope=asynchronous-network-model`; `proof=observed`. **Nutridev:** cloud e edge aceitando o mesmo comando durante partição ou rejeitam/deferem uma classe de escrita, ou divergem e precisam reconciliar. **Collapse-test:** isolar edge/cloud, gravar conflito nos dois lados e exigir simultaneamente resposta sempre disponível e leitura linearizável.

### Local inferences — não testadas no Nutridev

`proof_status=unverified`, derivadas de E1-C1…C14:

| Falha | Continuidade tecnicamente possível | O que não fica garantido |
|---|---|---|
| WAN cai; LAN viva | cliente local; edge na LAN se previamente instalado/alimentado | cloud, introspecção/revogação, sync externo |
| LAN cai | apenas estado de cada dispositivo | edge, periféricos/rede e coordenação entre tablets |
| backend falha | captura/leitura local previamente preparada | autoridade exclusivamente servidor e confirmação |
| app encerra | apenas dados já commitados | memória, transação aberta, background upload |
| dispositivo perdido | réplica/backup já concluído; chaves podem resistir à extração | disponibilidade da única cópia; revogação offline imediata |
| energia da unidade cai, tablet vive | UI e DB do tablet | roteador, edge, impressora e outros dispositivos sem UPS |
| energia total cai | nenhum fluxo digital; somente procedimento manual | disponibilidade; recuperação posterior depende de registro manual legível e reconciliação |

### Open residue

- Matriz real de suporte por versões mínimas de Safari/Chrome/WebView e modo instalado versus aba.
- Ensaios de quota, eviction, kill e power-cut nos tablets-alvo.
- Configuração SQLite/OPFS real, política de backup e capacidade dos arquivos/fotos.
- Janela offline aceitável para identidade, vínculo e permissão revogados.
- Semântica por comando: rascunho, fato provisório, reserva, autoridade online ou merge.
- Fencing/eleição de autoridade para edge após partição; nenhuma fonte torna isso automático.
- RTO/RPO, UPS de LAN/edge/impressoras e procedimento de falta total de energia exigem decisão/ensaio operacional.

### Superfícies e exclusões

Pesquisados: W3C/WHATWG/WICG, RFC Editor/IETF, Android Developers, Apple Developer, SQLite, WebKit e papers abertos ACM/CRDT/CAP/Lamport; internamente, `dispatch-sheet.json`, handoff da sessão e `rg` por termos offline/sync/edge/idempotência. A varredura interna ampla ficou ruidosa e expirou, mas não revelou owner arquitetural offline dedicado fora do dispatch.

Excluídos como prova: snippets não abertos, MDN/Can I Use, blogs comerciais, promessas de fornecedores, memória do modelo, números genéricos de quota, benchmark não executado, comportamento de Supabase/Next.js não pesquisado e qualquer alegação de que “API disponível” equivale a SLA operacional.

## Agent 2 — continuidade do domínio Nutridev

## Retorno E2 — continuidade do domínio Nutridev

### Taxonomia operacional

| Processo | Classificação de continuidade |
|---|---|
| Auditoria/checklist | checklist e versão emitida: **leitura cacheável**; respostas, notas e fotos: **observação/fato provisório**; auditoria em andamento: **rascunho local**; concluir/assinar/emitir relatório: **autoridade exclusivamente online** |
| CAPA | redação de plano: **rascunho local**; execução e evidência: **observação/fato provisório**; submissão de conclusão: **comando reconciliável**; validar, fechar ou reabrir: **autoridade exclusivamente online** |
| Temperatura | equipamentos/faixas: **leitura cacheável**; aferição: **observação/fato provisório**; consolidação posterior: **comando reconciliável**; sem energia: **procedimento manual com captura posterior** |
| Etiquetas | modelo/dados já autorizados: **leitura cacheável**; composição: **rascunho local**; impressão que materializa lote/destino: **comando dependente de reserva prévia**; baixa associada: **autoridade online** ou captura manual posterior |
| Requisição/produção | instrução/OP já liberada: **leitura cacheável**; apontamentos de chão: **fato provisório**; gerar/recalcular requisição: **comando reconciliável**; separar/consumir lote: **dependente de reserva prévia**; fechar lote/OP: **autoridade exclusivamente online** |
| Estoque/transferência | consulta indicativa: **leitura cacheável**, nunca saldo autoritativo; contagem física: **fato provisório**; transferência/baixa: **dependente de reserva prévia**; saldo final e liberação de quarentena: **autoridade exclusivamente online** |
| Tarefas | lista/instruções: **leitura cacheável**; progresso/checklist: **fato provisório/comando reconciliável**; atribuição, revisão e aceite: **autoridade exclusivamente online** |
| Comunicação | leitura histórica cacheada; nova mensagem: **rascunho local/comando reconciliável** com identidade única; ciência formal e avisos que alteram autoridade: **exclusivamente online** |
| Documentos | versão aprovada vigente: **leitura cacheável** com validade conhecida; captura/upload: **rascunho local**; homologar, superseder ou declarar “atual”: **autoridade exclusivamente online** |

### Claims

**E2-C1 — A classificação offline deve preservar a fronteira de autoridade da V2, não reproduzir o legado.**  
**Evidência:** `docs/PROJECT-OVERVIEW.md`, seletores linhas 17, 42, 55; `docs/INITIAL-DEFINITIONS.md`, `R-GOV-01` (linha 171).  
**evidence_scope:** autoridade de produto e escopo atual; `_legacy` somente brownfield.  
**proof_status:** observed.  
**Implicação:** Audit/CAPA, relatórios e documentos têm semântica atual; estoque, produção, etiqueta e tarefas apenas revelam pressões futuras e formas observadas.  
**collapse-test:** colapsa se decisão posterior promover explicitamente um modelo legado ou redefinir o escopo da V2.

**E2-C2 — Auditoria pode continuar capturando fatos sem rede, mas conclusão e emissão não podem ser confundidas com essa captura.**  
**Evidência:** `docs/INITIAL-DEFINITIONS.md`, `R-AUD-01`, `R-AUD-02`, `R-REP-01`–`R-REP-02` (linhas 148–149, 161–162); legado `_legacy/app/qualidade/execucao/[id]/page.tsx`, `loadDadosAuditoria` (57–174) e salvamento/finalização (285–372).  
**evidence_scope:** identidade do executor, evidência de detecção, imutabilidade da versão emitida; implementação observada faz upsert, ações e conclusão em chamadas online separadas.  
**proof_status:** observed.  
**Implicação:** respostas/fotos offline são provisórias e exigem ator, unidade, versão do checklist e horário de captura; assinatura, conclusão e emissão exigem autoridade corrente. Há risco de perda de foto e auditoria parcialmente salva.  
**collapse-test:** colapsa se o domínio permitir relatório oficial sem validar ator, completude, checklist-version e conflitos.

**E2-C3 — CAPA exige separar “execução alegada” de “fechamento autorizado”.**  
**Evidência:** `docs/INITIAL-DEFINITIONS.md`, `R-CAPA-03`–`R-CAPA-10` (linhas 152–159); `docs/discovery/04-pre-specification-decisions-action-validation-acknowledgement.md`, “Context-Specific Validation Authority” (66–75).  
**evidence_scope:** regras selecionadas de evidência, atribuição, validação, origem e carry-forward.  
**proof_status:** observed.  
**Implicação:** execução/evidência pode sincronizar como fato provisório; validação, encerramento e reabertura permanecem online. Permissão revogada entre captura e sincronização não apaga autoria, mas pode impedir o ato novo.  
**collapse-test:** colapsa se fechamento puder ocorrer sem evidência, validador elegível ou referência imutável à origem.

**E2-C4 — Temperatura é o precedente local mais claro de rascunho efêmero, não de continuidade offline comprovada.**  
**Evidência:** `_legacy/app/qualidade/planilhas/temperatura/page.tsx`, `SESSION_KEY`, merge e save (57, 133–149, 246, 251–278); `docs/discovery/02.1-servico-comercial.md`, recebimento/controle/etiquetagem (42–46, 53, 114); `02.2-cozinha-institucional.md` (109–117).  
**evidence_scope:** rascunho em `sessionStorage`, upsert cloud e cadência físico-sanitária.  
**proof_status:** observed.  
**Implicação:** queda WAN/backend ainda permite aferição se referência já estiver disponível, mas fechar aba/dispositivo pode perder dados; concorrência no mesmo equipamento/data/período pode sobrescrever. Energia total exige planilha manual numerada e captura posterior, preservando horário físico e não o horário de digitação.  
**collapse-test:** colapsa se teste demonstrar armazenamento durável, sincronização idempotente e resolução explícita de medições concorrentes.

**E2-C5 — Etiquetar é um ato físico irreversível ligado a identidade de lote; não é mero “print offline”.**  
**Evidência:** `_legacy/app/etiquetas/page.tsx`, `dadosEtiqueta` (272–305) e `handleIntegrarEtiqueta` (307–331); `docs/discovery/02.4-industria-fabricacao.md`, “Metamorfose: Lote de Entrada ➔ Lote de Saída” e recall (34–37, 51–54).  
**evidence_scope:** geração observada inclui lote, responsável, validade, destino e baixa de estoque.  
**proof_status:** observed.  
**Implicação:** impressão offline só é segura com identidade/reserva prévia ou procedimento manual controlado; repetição após timeout pode duplicar etiquetas e baixas, ou criar embalagem física sem registro.  
**collapse-test:** colapsa se etiquetas não tiverem efeito sobre rastreabilidade, validade ou saldo.

**E2-C6 — Requisições, reservas, separação e consumo formam uma cadeia de autoridade, não comandos independentes.**  
**Evidência:** `_legacy/supabase/migrations/20260310210000_create_producao_mult_produtos.sql`, reserva física (44–56) e `gerar_requisicao_producao` (104–140); `_legacy/app/estoque/page.tsx`, saldo e reservas (149–186, 257–326).  
**evidence_scope:** modelo brownfield de OP → requisição → reserva → lote.  
**proof_status:** observed.  
**Implicação:** rascunhar OP é local; recalcular requisição é reconciliável; separar/consumir demanda reserva válida. Saldo cacheado nunca autoriza sozinho, sobretudo com dois dispositivos.  
**collapse-test:** colapsa se produção puder consumir sem competir por lote/saldo ou se o processo abandonar reservas.

**E2-C7 — Transferência/baixa exige atomicidade de domínio; o legado expõe risco concreto de perda e duplicidade.**  
**Evidência:** `_legacy/components/MovimentacaoEstoqueDialog.tsx`, validação contra reserva (135–163), atualização de destino/origem (195–295) e histórico posterior (300–329).  
**evidence_scope:** implementação brownfield multi-chamada, sem transação visível no cliente.  
**proof_status:** observed.  
**Implicação:** falha intermediária pode creditar destino sem debitar origem, debitar sem criar lote-filho ou alterar saldo sem histórico. Offline tardio amplia corrida de saldo; classificar como dependente de reserva prévia/autoridade online.  
**collapse-test:** colapsa se uma operação atômica autoritativa impedir estados parciais e duplicidade sob repetição.

**E2-C8 — Tarefas e comunicação toleram sincronização tardia apenas como fatos atribuíveis, não como aceite final.**  
**Evidência:** `_legacy/app/operacional/tarefas/page.tsx`, `handleMoveTask` otimista (70–83); `_legacy/components/operacional/TarefaDetalhesDialog.tsx`, checklist/status sequenciais e comentário (102–146, 149–180); foto obrigatória ainda simulada (151–155).  
**evidence_scope:** comportamento legado de tarefas, subtarefas e comentários.  
**proof_status:** observed.  
**Implicação:** progresso/comentário pode enfileirar com ID único; revisão, conclusão governada e reatribuição requerem estado e permissão atuais. Há risco de UI indicar concluído sem persistência/evidência.  
**collapse-test:** colapsa se tarefas forem apenas notas sem revisão, evidência, responsável ou efeito operacional.

**E2-C9 — Documento cacheado só pode ser apresentado como vigente mediante snapshot verificável; homologação é online.**  
**Evidência:** `docs/INITIAL-DEFINITIONS.md`, `R-DOC-01` e `DocumentLifecycle` (131–133, 166); `_legacy/app/documentos/page.tsx`, upload de blob seguido de metadata (425–471), validade (997–1028).  
**evidence_scope:** documento controlado atual e fluxo brownfield de armazenamento.  
**proof_status:** observed.  
**Implicação:** leitura cacheada deve expor versão/validade e possível desatualização; upload offline é rascunho. Falha entre blob e metadata pode produzir órfão; homologar/superseder offline cria duas versões “atuais”.  
**collapse-test:** colapsa se o artefato não for controlado ou não houver distinção entre rascunho e versão atual.

**E2-C10 — Revogação e término de vínculo criam uma barreira temporal comum a todos os módulos.**  
**Evidência:** `docs/INITIAL-DEFINITIONS.md`, `Membership`, `ModuleEntitlement`, `R-MOD-01` (107–108, 147); decisão de término em `04-pre-specification...md` (81–83); legado `_legacy/hooks/usePermission.ts`, `checkPermissions` (14–59).  
**evidence_scope:** autoridade multi-organização e acesso prospectivo.  
**proof_status:** observed.  
**Implicação:** cache pode apoiar leitura/captura, mas não provar permissão corrente. Atos sincronizados após revogação devem preservar autoria e conteúdo para análise, sem adquirir automaticamente autoridade.  
**collapse-test:** colapsa se permissão nunca puder mudar entre captura e reconciliação.

**E2-C11 — O perfil operacional altera criticidade e reservas necessárias.**  
**Evidência:** comercial `02.1-servico-comercial.md` (42–53); institucional `02.2-cozinha-institucional.md` (21, 39, 50, 109–117); catering `02.3-catering-eventos.md` (21–22, 36–39, 53–65); indústria `02.4-industria-fabricacao.md` (30–37, 51–64, 113–120); híbridos `02.5-perfis-hibridos.md` (16, 36, 55–60, 109–124, 157–163).  
**evidence_scope:** discovery atual de perfis; várias afirmações regulatórias profundas ainda requerem verificação oficial.  
**proof_status:** unverified.  
**Implicação:** comercial privilegia cadência; institucional, unidade/RT/contrato; catering, ruptura central-evento; indústria, genealogia/recall; híbrido, segregação de estoques, capacidades e jurisdições. Uma política offline única colapsa essas diferenças.  
**collapse-test:** colapsa se testes de campo demonstrarem os mesmos atos, autoridades e danos em todos os perfis.

### Matriz de falhas e riscos

| Falha | Continuidade admissível | Risco dominante |
|---|---|---|
| WAN | leituras cacheadas, rascunhos e fatos provisórios; LAN não oferece hoje autoridade observada | sincronização tardia e falsa impressão de conclusão |
| LAN | dispositivo isolado captura fatos; não presumir coordenação entre dispositivos | concorrência e duplicidade |
| Backend | mesmas capturas provisórias; nenhum comando autoritativo cloud observado | fila crescente e permissões envelhecidas |
| Dispositivo/app | recuperação depende do armazenamento local; temperatura usa apenas sessão | perda, vazamento e reenvio duplicado |
| Concorrência | fatos distintos coexistem; saldo/estado final requer arbitragem | overwrite e dupla alocação |
| Sincronização tardia | preservar hora/ator/origem; autoridade avaliada na reconciliação | relógio incorreto, ordem causal e revogação |
| Energia parcial | tablet pode registrar, mas roteador, impressora, câmara ou balança podem não operar | confundir disponibilidade digital com continuidade física |
| Energia total | procedimento manual e captura posterior para atos físicos possíveis | lacuna de timestamps, autoria e transcrição |

### Superfícies pesquisadas e exclusões

Pesquisados: `docs/PROJECT-OVERVIEW.md`, `docs/INITIAL-DEFINITIONS.md`, `docs/discovery/02.1`–`02.5`, `04-pre-specification...md`, handoff da sessão, dispatch e amostras legacy de auditoria/CAPA, temperatura, etiquetas, estoque/transferência, requisição/produção, tarefas/comentários, permissões e documentos.

Excluídos: varredura exaustiva de `_legacy`, validação jurídica das fontes dos relatórios de perfil, desenho de tecnologia final, RTO/RPO numéricos, financeiro/cardápio/nutrição fora das dependências observadas e testes executados de concorrência/offline. Nenhuma capacidade offline robusta foi comprovada nesta amostra; o único mecanismo explícito encontrado foi o rascunho de temperatura em `sessionStorage`.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `./findings.md` | `derives` | O findings sintetiza os retornos verbatim dos três explorers deste dispatch. |
