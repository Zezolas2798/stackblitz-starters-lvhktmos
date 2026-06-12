---
title: "BROWNFIELD GAPS: Qualidade GxP"
status: pending-alignment
---

# Relatório de Gaps de Governança e Ontologia

Após o mapeamento Brownfield do módulo de **Qualidade GxP**, identificamos a integração bem-sucedida do novo **Motor de Planilhas Genéricas**, juntamente com as implementações legadas de Auditorias e Temperaturas. 

Abaixo estão listados os Gaps identificados entre o planejado/documentado versus a implementação técnica real na base (As-Is).

## 1. Gaps de Ontologia (Vocabulário e Estrutura)

| Gap | Gravidade | Descrição | Impacto |
| --- | --- | --- | --- |
| **Colisão de "Checklist" vs "Planilha"** | Média | Há uma ambiguidade conceitual. Historicamente, `ChecklistModelo` definia auditorias densas (ex: BPF Mensal). O novo `PlanilhaModelo` serve o mesmo propósito genérico mas é otimizado para preenchimentos curtos em massa (ex: diários). Ambos existem no módulo de Qualidade de forma isolada no banco de dados. | Confusão potencial no futuro ao decidir se um novo controle deve ser criado via `Checklist` (auditoria) ou via `Planilha` (controle diário genérico). |

## 2. Gaps de Governança e Implementação

| Gap | Gravidade | Descrição | Ação Recomendada (Backlog) |
| --- | --- | --- | --- |
| **Coleta de Amostras (Modal de Etiquetas)** | Alta | O Hub de Produção lista a planilha genérica de "Coleta de Amostras", porém a especificação do usuário (Stated) exige um comportamento muito específico: preenchimento em massa e geração de **etiquetas via carrossel e modal**, o que o motor genérico não atende nativamente hoje. | Desenvolver uma tela customizada `app/qualidade/planilhas/amostras/page.tsx` para substituir o fluxo genérico para este caso específico, a exemplo do que foi feito em Temperaturas. |
| **Controle de Óleo (Interface Dedicada)** | Média | A documentação informal levanta a necessidade de uma interface dedicada para "Controle de Óleo", mas ela está no momento suportada apenas via motor de planilha genérica. | Definir junto aos Product Owners se a tela atual atende MVP ou se será desmembrada para uma UX específica. |
| **Automatização de Descarte (Coleta de Amostras)** | Baixa | Foi solicitado no discovery que o sistema automatize a "data de descarte" baseado em tempo. Como a planilha atualmente usa apenas o DB estrutural padrão JSON, não há triggers atreladas ativando esse countdown. | Implementar na futura UI de amostras uma regra de domínio (Domain Rule) explícita de descarte. |

---

## 🚀 Próximos Passos (Alignment Backlog)

1. Priorizar o desenvolvimento do layout de preenchimento múltiplo e gerador de etiquetas para **Coleta de Amostras**.
2. Documentar diretrizes claras (Decison Record) de *quando* os usuários devem cadastrar via `Configuração de Planilha Genérica` vs *quando* devemos criar uma tela customizada Next.js (como Temperaturas).
