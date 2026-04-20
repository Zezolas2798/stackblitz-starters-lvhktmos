# Base de Conhecimento UAN: Arquitetura Algorítmica e Logística (Estoque e Fornecedores)

Documentação arquitetural traduzindo a gestão da cadeia de suprimentos (Supply Chain) da UAN em lógica matemática e regras de parametrização para o Módulo ERP/SaaS.

---

## 1. Segmentação do Banco de Dados: Matriz ABC-XYZ Multicritério

O processamento mecânico de itens gera imobilização de capital. A base de dados do SaaS deve parametrizar cada SKU com duas variáveis de classificação que se cruzarão numa matriz de decisão 3x3.

### 1.1 Curva ABC (Métrica Financeira / Valor de Consumo)
Baseado no Princípio de Pareto financeiro do consumo projetado.
*   **A (Alto Valor):** ~10% a 20% dos itens, respondendo por 75% a 80% do capital financeiro da cozinha.
    *   *Regra de Sistema:* Revisão contínua, auditoria estrita, estoques enxutos, compras em múltiplos lotes pequenos para girar capital.
*   **B (Valor Médio):** ~20% a 30% dos itens, correspondendo a ~15% a 20% do capital.
*   **C (Baixo Valor):** Base da pirâmide. Maioria esmagadora dos Skus, mas apenas ~5% a 10% do dinheiro investido.
    *   *Regra de Sistema:* Compras de grande escala com grandes estoques para otimização de barganha.

### 1.2 Curva XYZ (Métrica de Sobrevivência / Criticidade Operacional)
*   **Z (Vital):** Impacto Crítico. Impossível substituir sem romper contrato ou quebrar o serviço. (ex: Ingrediente único de dieta clínica, insumo assinatura). *Tolerância de Falha = 0.*
*   **Y (Média):** Impacto Moderado. A falta gera retrabalho, necessitando substituição ou compra via Fundo Fixo emergencial (ex: Faltou frango, usa-se bovino na Matriz de Substituição).
*   **X (Baixa):** Impacto Baixo/Nulo. Ampla concorrência local, compras imediatas na prateleira de varejo.

### 1.3 A Matriz Neural de Decisão (Algoritmo do SaaS)
O código deve rodar o cruzamento cartesiano das variáveis para automatizar atitudes de compra:
*   **A-Z (Capital Alto + Risco Máximo):** Estoque de segurança rígido. Gatilho instantâneo de reposição com homologação secundária de fornecedor acionada. Cobre 100%.
*   **A-X (Capital Alto + Risco Nulo):** Sistema paramétrico JIT (Just-in-Time). Custo 0 de Safety Stock. Se faltar, substitui, o sistema foca 100% no giro de caixa.
*   **C-Z (Capital Ínfimo + Risco Máximo):** Estoques de volume massivo limitados única e exclusivamente pelo teto dinâmico de validade sistêmica do SKU.

---

## 2. Equacionamento Matemático do Ressuprimento

Os gatilhos logísticos programados na plataforma se opõem ao amadorismo visual e dependem das seguintes deduções algéblicas adaptadas aos perecíveis operando sobre FEFO (First-Expired, First-Out):

### 2.1 Ponto de Pedido (PP / Gatilho Eletrônico)
O algoritmo aciona a "Ordem de Compra" predativa ANTES de acabar. É o limite exato computado pelas equações:
```math
PP = (C_{md} \times TR) + ES
```
*   **$(C_{md} \times TR)$ - Demanda no Lead Time:** O que eu vou consumir ininterruptamente ENQUANTO lido com a transportadora.
*   **$C_{md}$ (Consumo Médio Diário):** Abstraído por estatística ponderada no ERP da UAN. Unidade nativa do item.
*   **$TR$ (Tempo de Reposição):** Lead-Time contabilizado do momento 0 do sistema até a liberação qualitativa do item para a área suja de pré-preparo da cozinha.

### 2.2 Estoque de Segurança e Nível de Confiança Probabilística
**Modelo Probabilístico Teorema de Limite Central:**
Se a cozinha possui variação de comensal e variação de tempo de entrega, o algoritmo aplica Desvio Padrão:
```math
ES = Z \times \sqrt{ \overline{TR} \times \sigma_c^2 + \overline{C_{md}}^2 \times \sigma_{tr}^2 }
```
*   **$Z$ (Nível de Serviço):** Multiplicador de Confiança Gaussiana. Um item Z (vital) terá um *Z-Factor* de `99.87% = 3.0` forçando reserva massiva.
*   **$\overline{TR}$ e $\overline{C_{md}}$ :** As médias matemáticas da unidade.
*   **$\sigma_c$ (Desvio Padrão do Consumo):** Penaliza a volatilidade e bagunça diária da produção.
*   **$\sigma_{tr}$ (Desvio Padrão do Tempo Reposição):** Penaliza (matematicamente forçando mais ES) o fornecedor que não entrega no horário exato combinado. A "imprevisibilidade logística".

O grande salto tecnológico do motor em tempo real na Edge Function do SaaS é processar o recálculo dos sigmas $\sigma$ sempre que a balança de IoT da entrada der entrada de nova NF (atualizando o tempo real) ou na finalização do turno de produção (atualizando consumo real).
