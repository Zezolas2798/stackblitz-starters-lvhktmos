# Relatórios GxP e Visualizações Avançadas

Os relatórios de auditoria foram projetados para oferecer uma experiência "Premium" e profissional, atendendo aos padrões de conformidade GxP (Good X Practices).

## 1. Visualizações 3D Isométricas (Charts)

Para destacar o sistema de dashboards genéricos, implementamos um motor de renderização customizado para o Recharts.

### Características Técnicas:
*   **Filtros de Profundidade SVG**: Uso de `<filter id="shadowDepth">` para criar sombras projetadas.
*   **PremiumBar Component**: Uma forma SVG customizada que renderiza três faces (Frontal, Superior e Lateral) com sombreamento diferencial (lighten/darken) para simular volume real.
*   **Gradientes Dinâmicos**: As barras utilizam gradientes lineares vinculados ao status de conformidade (Sucesso = Verde, Erro = Vermelho).

## 2. Lógica de Identidade do Auditor

O relatório automatiza a coleta de dados de responsabilidade técnica para garantir a validade jurídica do documento.
*   **Busca por ID**: O sistema mapeia o `responsavel_id` da auditoria para o `full_name` na tabela `profiles`.
*   **Assinatura Digital**: Integração com URLs de assinaturas coletadas no ato da finalização da auditoria.

## 3. Modos de Vista
O sistema oferece três perspectivas intercambiáveis:
1.  **PADRÃO**: Cards detalhados com fotos e comentários.
2.  **EXECUTIVO**: Tabela enxuta para impressão formal.
3.  **ANALÍTICO (Painel GxP)**: Visão estatística com gráficos de conformidade por categoria.

## 4. Faixas de Performance (Benchmarks)
As visualizações cruzam os dados com limites regulatórios:
*   **90%+**: Excelência GxP.
*   **75% - 90%**: Conformidade Adequada.
*   **60% - 75%**: Risco Moderado (Alerta).
*   **< 60%**: Crítico (Necessita Intervenção).
