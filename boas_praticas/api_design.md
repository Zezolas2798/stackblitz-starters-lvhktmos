# Diretrizes de Design de API

Este arquivo serve como contexto de IA para a criação de rotas (arquivos em `src/api/**/*`).

- **Isolamento de Erros:** Exceções não tratadas jamais devem vazar rastros de pilha (Stack Trace) ou senhas do banco para o frontend. Retorne mensagens padronizadas.
- **Validação Antecipada:** Nunca processe dados recebidos sem passar por validações de esquema rigídas (como Zod, Joi ou Yup).
- **Trilha Auditiva nas Requisições:** Interagindo com rotas protegidas (POST/PUT/DELETE/PATCH), certifique-se de vincular a ação ao identificador de sessão do usuário logado (passando os campos `created_by`/`updated_by` às queries).
