# Integridade de Dados: Gestão de Checklists

Trabalhar com checklists dinâmicos e repetitivos exige cuidados especiais para evitar redundância de dados e perda de performance.

## 1. Problema: Itens Duplicados (Redundância)
Em modelos complexos, era comum a ocorrência de itens com textos idênticos, mas IDs diferentes no banco de dados, o que causava a mensagem "não respondido" nos relatórios caso a resposta estivesse vinculada ao ID duplicado.

### Solução: Deduplicação via Frontend
Em vez de uma migração de banco de dados destrutiva, implementamos um motor de agrupamento no carregamento do relatório:
*   **Agrupamento por Texto**: O sistema agrupa itens que possuem o mesmo `texto_pergunta` dentro da mesma seção.
*   **Mapeamento de IDs**: Criamos a propriedade `ids_originais: []` que armazena todos os IDs de banco que representam aquela mesma pergunta lógica.
*   **Busca de Resposta Híbrida**: O sistema busca a resposta em qualquer um dos IDs vinculados, garantindo que o dado chegue ao relatório independente de qual "versão" do item foi respondida.

## 2. Otimização de Performance no Editor
O editor de modelos de checklist lida com centenas de campos simultâneos (Seções + Itens).

### Estratégias Utilizadas:
*   **React Transitions (`useTransition`)**: As operações de adição, remoção e ordenação de itens são marcadas como transições não-bloqueantes, mantendo a interface responsiva durante o processamento.
*   **Memoização (`memo`)**: Componentes de item (`ChecklistItemEditor`) são memoizados para evitar re-renderizações desnecessárias do formulário inteiro ao digitar em um único campo.
*   **Prevenção de Duplicação no Upsert**: Implementamos uma lógica de reconciliação para que as edições utilizem o `id` existente sempre que possível, evitando a criação de novos registros fantasmas.

## 3. Guia de Manutenção
Sempre que for carregar dados de checklist que podem conter redundâncias históricas, utilize a função de mapeamento de `ids_originais` para garantir a integridade da exibição.
