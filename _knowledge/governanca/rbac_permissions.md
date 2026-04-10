# Gestão de Acesso: RBAC & Permissões Granulares

O sistema utiliza um modelo de controle de acesso híbrido para equilibrar a simplicidade de papéis (Roles) com a flexibilidade de permissões granulares.

## 1. Arquitetura de Duas Camadas

### Camada 1: Roles Legadas (Nível Diretor)
Utilizadas para decisões de "curto-circuito" em toda a aplicação.
*   **super_admin**: Acesso total a todas as empresas e configurações do sistema.
*   **company_owner**: Acesso total dentro de sua própria empresa (Tenant).
*   **manager / employee**: Papéis base que requerem verificação na Camada 2.

### Camada 2: Permissões Granulares (RBAC Baseado em RPC)
Para usuários que não são Admin/Dono, o sistema consulta a tabela de junção entre usuários e permissões.
*   **Lógica**: As permissões são armazenadas no banco de dados e recuperadas via RPC `get_user_permissions`.
*   **Slug de Permissão**: Strings únicas como `checklists:create`, `pedidos:approve`, etc.

## 2. Implementação Técnica

### Hook `usePermission`
Centraliza a lógica de verificação. Ele expõe a função `can(permission)`.
```typescript
const { can } = usePermission();

if (can('checklists:edit')) {
  // Renderiza botão de edição
}
```

### Regras de Ouro
1. Se `profile.role` for `super_admin` ou `company_owner`, a função `can()` sempre retorna `true`.
2. Para outros papéis, a permissão deve estar explicitamente vinculada ao usuário no banco.

## 3. Manutenção
Para adicionar novas permissões:
1. Cadastre o novo slug na tabela `permissions`.
2. Vincule ao usuário ou role template desejado.
3. Utilize o novo slug no frontend via `usePermission`.
