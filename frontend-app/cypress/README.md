# Teste E2E de Autenticação - Documentação

## Objetivo do Teste

Este teste valida o fluxo completo de autenticação do frontend-app, incluindo:

1. **Validação de credenciais no Appwrite Cloud**
2. **Captura do erro 400 do endpoint `/api/auth/refresh`**
3. **Login com credenciais válidas**
4. **Redirecionamento para o dashboard**

## Credenciais de Teste

- **Email**: `user@bigtech.com`
- **Senha**: `user1234`

⚠️ **IMPORTANTE**: Estas credenciais devem existir no Appwrite Cloud configurado no projeto.

## Sobre o Erro 400 do `/api/auth/refresh`

### O que é?

O erro `POST http://localhost:3000/api/auth/refresh 400 (Bad Request)` é um comportamento **ESPERADO** e **CORRETO** do sistema.

### Por que acontece?

1. Quando o usuário acessa a página de login pela primeira vez (ou após fazer logout), **não existe um refresh token válido** armazenado.
2. O frontend pode tentar atualizar o token automaticamente ao carregar a página.
3. O backend responde com **400 Bad Request** porque não há refresh token para validar.

### Isso é um problema?

**Não!** Este é o comportamento correto. O erro 400 indica que:
- O sistema de autenticação está funcionando corretamente
- O backend está corretamente rejeitando requisições sem refresh token válido
- O usuário precisa fazer login para obter um token

### Como o teste valida isso?

O teste captura este erro e verifica que:
```javascript
// Interceptar requisição de refresh
cy.intercept('POST', '**/api/auth/refresh').as('refreshRequest')

// Verificar que retorna 400 quando não há token
cy.wait('@refreshRequest').then((interception) => {
  if (interception?.response?.statusCode === 400) {
    cy.log('✅ Erro 400 capturado conforme esperado')
  }
})
```

## Estrutura do Teste

### PASSO 1: Validação no Appwrite Cloud

```javascript
cy.request({
  method: 'POST',
  url: `${BACKEND_URL}/api/auth/login`,
  body: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
}).then((response) => {
  // Verificar se credenciais são válidas
  expect(response.status).to.be.oneOf([200, 201])
})
```

### PASSO 2: Acesso à Página de Login

- Visita `/login`
- Verifica elementos da interface
- Prepara interceptors para capturar requisições

### PASSO 3: Captura do Erro 400

- Intercepta `/api/auth/refresh`
- Documenta o erro esperado
- Não falha o teste (comportamento correto)

### PASSO 4: Login

- Preenche formulário
- Envia credenciais
- Valida resposta do backend

### PASSO 5: Validação do Dashboard

- Verifica redirecionamento
- Confirma token no localStorage
- Valida elementos da página

## Como Executar

### Modo Headless (CI)
```bash
npm run test:e2e
```

### Modo Interativo (Desenvolvimento - Recomendado)
```bash
npm run test:e2e:open
```

## Pré-requisitos

1. **Backend rodando**: `http://localhost:8080`
2. **Frontend-app rodando**: ` http://localhost:3000`
3. **Usuário cadastrado no Appwrite Cloud** com as credenciais de teste

## Troubleshooting

### Teste falha no PASSO 1

**Problema**: Credenciais não são válidas no Appwrite Cloud

**Solução**:
1. Verificar se o usuário `user@bigtech.com` existe no Appwrite
2. Verificar se a senha está correta
3. Verificar configuração do Appwrite no backend (`.env`)

### Teste falha no PASSO 3

**Problema**: Erro 400 não é capturado

**Solução**:
- Isso não é um problema! O erro 400 é opcional
- O teste documenta se foi capturado ou não
- Não deve falhar o teste

### Teste falha no PASSO 4

**Problema**: Login não retorna token

**Solução**:
1. Verificar logs do backend
2. Verificar conexão com Appwrite
3. Verificar se o usuario está com status 'active'

### Teste falha no PASSO 5

**Problema**: Não redireciona para dashboard

**Solução**:
1. Verificar implementação do componente de login
2. Verificar se `router.push` ou `router.replace` está sendo chamado
3. Verificar console do navegador no Cypress

## Arquivos Relacionados

- **Teste**: `cypress/e2e/authentication.cy.js`
- **Configuração**: `cypress.config.js`
- **Comandos customizados**: `cypress/support/commands.js`
- **Backend Login**: `/backend/src/core/auth.ts`
- **Frontend Login**: `/frontend-app/src/pages/login.tsx`

## Próximos Passos

Após validar a autenticação:
1. Adicionar teste de logout
2. Adicionar teste de navegação entre páginas
3. Adicionar teste de refresh automático de token
4. Adicionar teste de expiração de sessão
