---
id: states-qualidade
title: "State Machines: Qualidade GxP"
type: states
status: brownfield-translated
layer: domain
---

# State Machines: Qualidade GxP

## `AuditoriaStatus`
Rege o ciclo de vida de uma `ChecklistExecucao`.

- **`EM_ANDAMENTO`**: A auditoria foi iniciada e está aberta para respostas. O auditor pode ir e voltar no formulário, tirar fotos e salvar rascunhos.
- **`CONCLUIDO`**: A auditoria foi submetida, assinada e o score foi gerado. Os dados se tornam *imutáveis*. Nenhuma resposta ou foto pode ser alterada.
- **`CANCELADO`**: A auditoria foi inativada via soft-delete antes ou após a conclusão (ação restrita a administradores).

## `AcaoStatus`
Rege o ciclo de vida de uma `AcaoCorretiva`.

- **`PENDENTE`**: O desvio foi identificado e registrado. O sistema notifica o painel de pendências aguardando que o responsável descreva o plano de ação ou o execute.
- **`CONCLUIDO`**: O responsável preencheu o que foi feito para corrigir a falha e fechou o plano. O desvio é considerado sanado.

## `StatusEquipamento` (Controle de Temperatura)
Rege a justificativa de não aferição durante os logs de temperatura.

- **`LIGADO`**: Estado normal, espera-se uma medição numérica válida.
- **`DESLIGADO`**: Equipamento inoperante no momento do turno (ex: fora de uso). Não há exigência de aferição.
- **`VAZIO`**: Equipamento operante porém sem produtos armazenados no momento da medição. Pode ou não requerer temperatura do ar dependendo da política de vigilância.

## `PlanilhaModeloStatus`
Rege a visibilidade de um formulário genérico de Controle de Produção no Hub.

- **`ATIVO`**: O modelo da planilha é visível na sua respectiva aba de categoria e os operadores podem acessá-lo para lançar novas respostas diárias.
- **`INATIVO`**: O modelo foi desativado. Respostas passadas são mantidas por questões de histórico e compliance GxP, mas novos apontamentos não podem ser feitos.
