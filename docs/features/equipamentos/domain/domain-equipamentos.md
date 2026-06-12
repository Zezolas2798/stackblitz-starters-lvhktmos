---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-equipamentos]]

---

# Domain: Equipamentos

Responsável pelo mapeamento da infraestrutura produtiva, maquinário e controle de pontos críticos de controle (termometria).

## Concept Registry

| ID | Name | Type | Description |
| :--- | :--- | :--- | :--- |
| `equipamentos.Equipamento` | Equipamento | Entity | Maquinário físico (Câmara Fria, Forno, etc). |
| `equipamentos.Afericao` | Aferição de Temperatura | Value Object | Registro de graus celsius em um ponto do tempo. |
| `equipamentos.PontoCritico` | Ponto Crítico de Controle (PCC) | Rule | Regra de temperatura (min/max) para segurança alimentar. |
| `equipamentos.Manutencao` | Manutenção Preventiva | Operation | Ação técnica para garantir o funcionamento do maquinário. |

## Relationships

- `equipamentos.Equipamento` **monitors** `equipamentos.Afericao`
- `equipamentos.Equipamento` **located-at** `estoque.LocalFisico`
- `equipamentos.Afericao` **enforces** `equipamentos.PontoCritico`
- `equipamentos.Equipamento` **requires** `equipamentos.Manutencao`

## States: equipamentos.Equipamento

- `OPERACIONAL`: Funcionando dentro dos parâmetros de PCC.
- `FALHA`: Temperatura fora do limite ou quebra mecânica.
- `MANUTENCAO`: Em reparo técnico.
- `DESATIVADO`: Equipamento removido da linha de produção.
