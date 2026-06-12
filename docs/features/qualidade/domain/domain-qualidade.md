---
id: domain-qualidade
title: "Domain Model: Qualidade GxP"
type: domain
status: brownfield-translated
layer: domain
---

# Domain Model: Qualidade GxP

## Entidades Principais

### `qualidade.ChecklistModelo`
O molde estrutural para auditorias e formulários de controle tradicionais (ex: BPF Mensal, Limpeza Diária). Contém metadados como título, descrição, categoria e frequência sugerida. É versionável e serve de template imutável para as execuções de auditorias completas.

### `qualidade.ChecklistSecao`
Agrupador lógico de itens dentro de um modelo de checklist. Permite dividir a auditoria em grandes blocos (ex: "Instalações Físicas", "Higiene Pessoal").

### `qualidade.ChecklistExecucao`
A instância viva de uma auditoria ocorrendo no tempo. Possui um status (`EM_ANDAMENTO`, `CONCLUIDO`), está vinculada a uma unidade e a um usuário (auditor), e acumula as respostas dadas. 

### `qualidade.AcaoCorretiva`
Representa um plano de ação criado para sanar uma Não-Conformidade (NC). Pode ser gerada automaticamente a partir de um item respondido como "Não Conforme" ou avulsa.

### `qualidade.ControleTemperatura`
Log diário e imutável de medição de temperatura de um equipamento ou ambiente. O preenchimento é feito através de uma UI dedicada em formato de matriz cruzando Equipamentos e Horários do dia.

### `qualidade.PlanilhaModelo`
Motor dinâmico (Entity) para criar e gerenciar planilhas de controle diário/semanal em massa (ex: Controle de Água, Limpeza). Substitui a necessidade de criar tabelas individuais rígidas. Classificado por Categoria, agrupa formulários visíveis no Hub de Produção.

### `qualidade.PlanilhaColuna`
Definição estrutural de um campo dentro de um `PlanilhaModelo` (ex: Texto, Número, Assinatura, Calculado, Múltipla Seleção), incluindo a obrigatoriedade e opções JSON.

### `qualidade.PlanilhaResposta` (Tabela `qual_planilha_respostas`)
Um preenchimento ou registro isolado inserido em uma planilha genérica (`PlanilhaModelo`). Contém o payload estruturado (no formato JSON) representando a entrada de linha com os valores correspondentes de cada coluna.

## Value Objects

### `qualidade.ChecklistItem`
Questão específica ou parâmetro de verificação dentro de uma seção de auditoria. Possui um tipo de resposta esperado e um peso para cálculo de score.

### `qualidade.ChecklistResposta`
A resposta dada a um item de auditoria durante uma execução (`ChecklistExecucao`).

### `qualidade.PlanilhaConfiguracao`
Configuração relacional que estabelece frequência de preenchimento (ex: Diária, Mensal) ou vínculo obrigatório entre um Modelo de Planilha e uma Unidade Específica.
