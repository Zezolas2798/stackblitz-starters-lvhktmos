# Padrões de Banco de Dados e Compliance

Este documento define regras obrigatórias para qualquer criação ou alteração no esquema de banco de dados para garantir conformidade legal com regras CSV (Computer System Validation).

## 1. Soft Deletes (Obrigatório)
- **Nenhum registro pode ser removido fisicamente (HARD DELETE)** no banco de dados, exceto tabelas temporárias voláteis se justificável.
- Utilize a coluna `deleted_at` para indicar a desativação ou exclusão lógica do registro.
- Nas rotas de listagem (`GET`), você deve sempre retornar os resultados filtrando por `deleted_at IS NULL` ou campo equivalente como `is_active = true`.

## 2. Trilha de Auditoria (Audit Trail)
- Todas as tabelas que contêm modelos de negócio ou dados transacionais fundamentais devem conter as seguintes propriedades de auditoria:
  - `created_at` (Data de criação do registro)
  - `updated_at` (Data da última modificação, acionada autmoticamente)
  - `created_by` (ID ou referência do usuário responsável pela criação)
  - `updated_by` (ID ou referência do usuário que efetuou a ultima edição)
- Ao interagir com o módulo `src/db` usando ORM ou Query Builder, preserve sempre as referências do usuário no request logado.
