---
id: ops-qualidade
title: "Operations Model: Qualidade GxP"
type: operations
status: brownfield-translated
layer: application
---

# Operations Model: Qualidade GxP

## Operações Principais

### Fluxo de Auditoria e Checklist

#### `IniciarAuditoria`
- **Ator:** Usuário logado
- **Ação:** Instancia uma `ChecklistExecucao` a partir de um `ChecklistModelo` ativo.

#### `ResponderItem`
- **Ator:** Usuário (Auditor)
- **Ação:** Registra a `ChecklistResposta` para um item específico.

#### `FinalizarAuditoria`
- **Ator:** Usuário (Auditor)
- **Ação:** Submete a auditoria para fechamento validando obrigatórios e fotos.

### Fluxo de Planilhas de Controle de Produção (Genéricas)

#### `RenderizarHubCategorias`
- **Ator:** Sistema
- **Ação:** Consulta todos os `qual_planilha_modelos` vinculados à unidade, agrupa-os no campo `categoria` e os exibe dentro de Abas de navegação (Tabs).
- **Side-effects:** Se o modelo tiver roteamento específico (ex: Temperaturas), injeta a URL hardcoded no botão, caso contrário, aponta para o motor genérico `[id]/page.tsx`.

#### `SemearModelosPlanilhas` (Seed Scripts)
- **Ator:** Desenvolvedor / Pipeline CI
- **Ação:** Scripts Node.js (ex: `seed-testes-analises.js`, `seed-planilhas-limpeza.js`) executam `INSERT` em massa para recriar as categorias, planilhas e definir a estrutura de tipos de suas colunas.
- **Side-effects:** Evita o uso excessivo da tela de configuração manual, versionando as regras estruturais de Food Safety no código fonte.

#### `AdicionarRespostaPlanilha`
- **Ator:** Usuário Operacional
- **Ação:** Preenche dinamicamente uma instância de formulário genérico.
- **Side-effects:** Submete um payload JSON para `qual_planilha_respostas`.

### Fluxo de Controle de Produção Customizado

#### `RegistrarTemperaturaMatriz`
- **Ator:** Usuário Operacional
- **Ação:** Aponta a temperatura de um equipamento em um cruzamento de eixo X (Período/Hora) e eixo Y (Equipamento).
- **Apresentação:** O sistema faz a validação `FaixaIdeal` na UI (comparando com `temp_ideal_min` e `temp_ideal_max` do equipamento) e aplica styling de alerta se o valor estiver fora da margem tolerada.
