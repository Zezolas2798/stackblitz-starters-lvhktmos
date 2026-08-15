---
tags: [incamp, pesquisa, robot-talks, evidencia, edital]
node_type: research-record
layer: market
nature: reference
status: complete
version: 0.1.0
last_updated: 2026-08-11
---

# Registro de pesquisa — candidatura INCAMP V0

## Contrato do dispatch

- Dispatch: `2026-08-11-incamp-v0-framing`
- Schema: `0.8.0`
- Sheet admitido: `dispatch-sheet.json`
- SHA-256 confirmado: `51b17f08cf80008b929f5accb3770a381be64b311f545f7a22bded8f6ef8c021`
- Tension gate: dois pareceres independentes `PASS`
- Confirmação humana: “Pode executar.”
- Objetivo: construir a base crítica e evidencial da V0 sem inflar maturidade nem diluir a visão futura.

## Fontes primárias do trabalho

- `C:/Users/julia/Downloads/EDITAL-INCAMP-2025.pdf`
- `C:/Users/julia/Downloads/ANEXO-I-Formulario-de-Apresentacao-de-Propostas.docx`
- `C:/Users/julia/Downloads/entre_sistemas_e_categorias.pdf`
- `C:/Users/julia/Downloads/Reunião iniciada às 2026_08_03 14_31 GMT-03_00 - Anotações do Gemini.md`
- `docs/PROJECT-OVERVIEW.md`
- `docs/INITIAL-DEFINITIONS.md`
- `docs/PROJECT-DECISIONS.md`
- `docs/HYPOTHESES.md`
- `docs/EXPERIMENT-CANDIDATES.md`
- `docs/discovery/01-analise-transcricao-entrevista.md`
- `docs/discovery/02-tipos-de-negocio.md`
- `_legacy/docs/shared/discovery/visao-do-produto.md`
- `_legacy/docs/shared/discovery/project-overview.md`
- `_legacy/docs/governanca/plano-diretor.md`
- `_legacy/docs/shared/spec-architecture.md`
- Código, migrations e funções legadas usados somente para verificar alegações técnicas.

## Exploração 1 — lógica da banca

### Resultado

O edital opera em quatro filtros: admissibilidade documental; triagem eliminatória de clareza/base tecnológica/legalidade; apresentação presencial com fundador; e avaliação ponderada em 100 pontos.

| Critério | Pontos |
|---|---:|
| Perfil empreendedor | 10 |
| Qualificação da equipe | 15 |
| Grau de inovação | 15 |
| Potencial de mercado | 10 |
| Aspecto financeiro | 15 |
| Impacto socioambiental | 10 |
| Aderência à INCAMP | 10 |
| Qualidade da proposta/apresentação | 15 |

Apto não significa aprovado: nota de 51 a 100 ainda depende de classificação, adequação ao programa e capacidade de atendimento.

### Tensão registrada

- **Claim:** Audit/CAPA pode ser apresentado como recorte tecnológico demonstrável.
- **Challenge:** equipe, mercado, finanças, impacto e tração estão materialmente subdocumentados.
- **Concession:** o legado ajuda a demonstrar experimentação, não maturidade atual.
- **Residual:** limites do formulário e alguns detalhes oficiais têm ambiguidades; adotar leitura conservadora.
- **Probe:** montar índice `claim → evidência → lacuna` e confirmar dúvidas formais antes da submissão real.

## Exploração 2 — evidência e maturidade

### Resultado

A V2 está em descoberta estruturada e design, sem nova implementação. O legado contém protótipos substanciais e pesquisa de domínio, mas não comprova produto atual pronto, integração global, segurança, aderência regulatória, tração ou impacto.

| Área | Grau seguro | Leitura |
|---|---|---|
| Regras e fluxo V2 Audit/CAPA | G1 | Design documentado. |
| Organizações, vínculos e acesso V2 | G1 | Modelo decidido; mecanismo ainda não implementado. |
| Checklist, fotos, NC, PDF e GED legados | G2 | Protótipos e componentes, não produto V2. |
| Relatório versionado e ciência bilateral | G0–G1 | Requisito futuro; não demonstrado. |
| CAPA completa com evidência de resolução e validação | G1–G2 parcial | Partes legadas não fecham o ciclo proposto. |
| IA, CSP/NSGA-II e módulos operacionais | G2 periférico | P&D legado com lacunas; fora do wedge. |
| Tração, receita, retenção e impacto | G0 | Dados desconhecidos. |

Riscos encontrados no legado: políticas de acesso permissivas, Storage público/amplo, poucos testes, registros mutáveis, assinatura representada por imagem/URL, hard deletes e ausência de validação formal. Esses achados impedem alegações de multi-tenancy segura, imutabilidade, assinatura digital, compliance ou rastreabilidade total.

### Tensão registrada

- **Claim:** o legado prova capacidade de prototipação e profundidade de domínio.
- **Challenge:** volume de código não prova segurança, integração, uso ou valor.
- **Concession:** artefatos específicos podem compor um anexo probatório quando rotulados.
- **Residual:** falta testemunho V2 ponta a ponta e validação externa.
- **Probe:** demo segura de auditoria até ciência, mais testes negativos de autorização e arquivos.

## Exploração 3 — frame sistêmico

### Resultado

O documento *Entre Sistemas e Categorias* foi usado como disciplina de composição, não como vocabulário público. A narrativa útil conecta:

`fenômeno → problema observável → mecanismo → evidência → lacuna → probe`

O sistema relevante não é uma coleção de módulos. É a cadeia:

`visita → constatação → evidência → NC → plano/ação → nova evidência → validação → relatório → ciência`

As fronteiras críticas são consultoria–empresa, empresa–unidade, privado–compartilhado e fonte regulatória–regra aplicável. Funcionamento local de telas ou módulos não prova valor global; o testemunho exigido é uma jornada bilateral reconstruível.

### Invariantes propostos

- Consultoria e empresa permanecem organizações soberanas.
- Compartilhamento é explícito.
- Licença e permissão são decisões diferentes.
- Evidência de detecção e de resolução não são intercambiáveis.
- Conclusão de uma ação não equivale à sua validação.
- Relatório emitido preserva versão; correção não ocorre silenciosamente.
- Ciência identifica pessoa, instante e versão; não significa concordância.
- Legado fornece aprendizado e casos; decisões atuais fornecem autoridade.

## Robot-Talk dos exploradores

O desacordo foi resolvido com a seguinte formulação máxima:

> O Nutridev é um projeto SaaS de base tecnológica em descoberta que propõe coordenar Audit/CAPA entre consultorias de alimentos e empresas; modelos de domínio e protótipos legados indicam plausibilidade técnica, não um produto V2 pronto.

O legado deve aparecer como antecedente experimental relacionado a hipóteses e limitações. A demo mínima separa claramente `demonstrado`, `legado`, `não implementado` e `próximo teste`.

## Ataques adversariais

### Vacuidade

“Rastreável”, “governado”, “validado” e “multi-organização” são vazios sem vínculos obrigatórios, máquina de estados, autoridades aplicadas, versões e reconstrução do caso. O witness deve incluir contestação, rejeição, reenvio, reabertura, bloqueio de acesso e ciclo sem planilha como fonte de verdade.

### Definição

A menor categoria defensável é:

> SaaS vertical de QMS/CAPA multi-organização para operações de qualidade mediadas por consultorias de alimentos.

Não há evidência para alegar nova categoria. Audit/CAPA, evidência, RBAC e relatórios são capacidades conhecidas; a diferenciação potencial está na composição bilateral consultoria–cliente–unidade, continuidade entre visitas e custódia após mudança de vínculo.

### Portfólio

Audit/CAPA só é core se incluir o ciclo bilateral completo. Document Control e Temperatura permanecem challengers do wedge porque podem apresentar maior frequência e especificidade. A decisão precisa ser empírica.

Para ASO/RH, a fronteira do recorte atual foi posteriormente endurecida pela auditoria e depois esclarecida pelo fundador:

- não existe módulo ASO, PCMSO ou RH na V0;
- a V0 não copia ASO nem dados de saúde;
- um item auditado pode registrar apenas a existência de pendência documental genérica;
- esses domínios não foram excluídos da visão futura: podem formar módulos condicionais para tipos de negócio em que sejam relevantes;
- qualquer tratamento futuro exige necessidade validada, análise jurídica, minimização e controle específico.

## Robot-Talk dos céticos

Convergências:

1. categoria QMS/CAPA vertical, não nova categoria;
2. inovação de processo/composição ainda a provar;
3. um único witness bilateral testa vacuidade, categoria e portfólio;
4. comparar Audit/CAPA com eQMS/CAPA existentes e com Document Control/Temperatura;
5. abandonar ou reformular o wedge se os pilotos não repetirem o ciclo ou se outro problema produzir valor superior.

## Resultado da pesquisa

A candidatura deve ser ambiciosa no horizonte, precisa no recorte e conservadora na maturidade. `_legacy` representa a formulação funcional mais avançada e inacabada da visão; a V2 representa sua reconstrução com melhores definições e práticas; a V0 da INCAMP é apenas o recorte demonstrável. O frame sistêmico melhora a coerência porque obriga a mostrar fronteiras, aplicabilidade, contratos e testemunho global; ele não deve aparecer como teoria das categorias no texto da banca.

### Revisão após a transcrição do fundador

A transcrição elevou o problema central de “fragmentação do trabalho de qualidade” para “fragmentação dos dados e processos entre os setores do negócio alimentar”. Audit/CAPA permanece como entrada e primeiro witness. A ficha técnica governada foi adicionada como contrato futuro de composição, e temperatura → CAPA como thin slice alternativo capaz de provar integração entre contextos.
