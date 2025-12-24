# Projeto Bigtech — Refatoração para Cadastro de Usuários e Auto-Onboarding de Tenants

## Índice dos Documentos

- [1.Project.md](1.Project.md) - Visão geral do projeto
- [2.Architecture.md](2.Architecture.md) - Arquitetura técnica
- [3.Structure.md](3.Structure.md) - Estrutura do projeto
- [4.Entities.md](4.Entities.md) - Modelos de dados (entidades)
- [5.Pages.md](5.Pages.md) - Páginas e interfaces
- [6.UserStories.md](6.UserStories.md) - User Stories
- [7.Tasks.md](7.Tasks.md) - Tasks de implementação
- [8.DesignSystem.md](8.DesignSystem.md) - Design System

## 1. Introdução

Esta refatoração visa transformar o sistema de autenticação do Projeto Bigtech de um modelo fechado (apenas login) para um modelo aberto de auto-onboarding, permitindo que usuários comuns se cadastrem diretamente via frontend-app. Baseado na análise integrada dos documentos 1.Project.md a 6.UserStories.md, com foco no modelo multi-usuário lógico (isolamento por autenticação/autorização, sem infraestrutura dedicada por tenant).

O objetivo é adicionar uma página de registro (register) no frontend-app, integrar criação de usuários no Appwrite Cloud, implementar auto-onboarding automático de tenants (criação de tenant se inexistente durante o cadastro), e garantir que tenants criados apareçam na página de gestão de tenants do frontend-admin. Toda lógica deve ser validada com testes property-based e E2E contra a stack Docker real.

Nota importante: O sistema permanece **single-tenant em nível de infraestrutura** e **multi-usuário/multi-organização em nível de aplicação**. Não há criação de containers, instâncias ou bancos separados; isolamento é exclusivamente lógico via `tenantId`.

## 2. Tasks

- [x] TASK-USER-001. Adicionar Página de Registro no Frontend-App
  - Criar página `/register` no frontend-app com formulário para cadastro: nome, email, senha, confirmação de senha, e opcionalmente domínio/empresa para derivar nome do tenant.
  - Incluir validação de formato (email, senha forte), termos de uso/LGPD, e botão para alternar para login.
  - User Story Relacionada: US-001 (extendida para registro)
  - Entidades: User, Tenant
  - Páginas: /register (frontend-app)
  - Funcionalidades: Formulário de registro, validação client-side
  - Endereço Físico: frontend-app/src/pages/register.tsx
  - Requisitos: 5.3.7, 4.1

- [x] TASK-USER-001.1 Escrever testes property-based para TASK-USER-001
  - **Propriedade 1: Formulário valida campos obrigatórios e formatos**
  - **Valida: Requisito 5.3.7**

- [x] TASK-USER-002. Modificar Fluxo de Login para Incluir Opção de Registro
  - Atualizar página de login (`/`) no frontend-app para exibir opções "Login" e "Registrar-se", com links/tabs para alternar entre formulários.
  - Manter redirecionamento automático se já logado.
  - User Story Relacionada: US-001
  - Entidades: User
  - Páginas: / (login, frontend-app)
  - Funcionalidades: Navegação entre login e registro
  - Endereço Físico: frontend-app/src/pages/index.tsx
  - Requisitos: 5.3.7

- [x] TASK-USER-002.1 Escrever testes property-based para TASK-USER-002
  - **Propriedade 1: Alternância entre login e registro funciona corretamente**
  - **Valida: Requisito 5.3.7**

- [x] TASK-USER-003. Implementar Auto-Onboarding de Usuários e Tenants
  - Integrar criação de usuário no Appwrite Cloud durante registro: criar conta com email/senha, gerar `userId`.
  - Implementar auto-onboarding: durante registro, detectar se tenant existe (por domínio/email); se não, criar tenant automaticamente com status 'active' (ou 'pending' para aprovação admin, conforme política).
  - Associar usuário ao tenant criado/existente, definir role 'user' por padrão.
  - Backend: Extender AuthService para criação de tenant se inexistente, com auditoria automática.
  - User Story Relacionada: US-001, US-009 (extendida)
  - Entidades: User, Tenant, Audit
  - Páginas: /register (frontend-app)
  - Funcionalidades: Criação de usuário no Appwrite, auto-onboarding de tenant, auditoria
  - Endereço Físico: backend/src/core/auth.ts, frontend-app/src/pages/register.tsx
  - Requisitos: 2.1, 4.1, 4.6

- [x] TASK-USER-003.1 Escrever testes property-based de integração para TASK-USER-003
  - **Descrição:** Testes de integração executados contra a stack Docker (Appwrite + backend). Não usar mocks para validar criação de usuário e tenant.
  - **Propriedade 1: Usuário criado no Appwrite com conta válida**
  - **Propriedade 2: Tenant criado automaticamente se inexistente durante registro**
  - **Propriedade 3: Operações geram auditId em Audit**
  - **Valida: Requisito 2.1, 4.1, 4.6**

- [x] TASK-USER-004. Garantir Visibilidade de Tenants Criados na Página Admin
  - Atualizar página `/tenants` no frontend-admin para listar todos tenants, incluindo aqueles criados via auto-onboarding.
  - Adicionar filtros/status para distinguir tenants criados por admin vs. auto-onboarding (ex.: coluna "Origem").
  - Garantir que tenants apareçam imediatamente após criação, com isolamento visual (admin vê todos).
  - User Story Relacionada: US-009
  - Entidades: Tenant
  - Páginas: /tenants (frontend-admin)
  - Funcionalidades: Listagem completa de tenants
  - Endereço Físico: frontend-admin/src/pages/tenants.tsx
  - Requisitos: 4.1

- [x] TASK-USER-004.1 Escrever testes property-based para TASK-USER-004
  - **Propriedade 1: Tenants criados via auto-onboarding aparecem na lista admin**
  - **Valida: Requisito 4.1**

- [x] TASK-USER-005. Criar Testes E2E e Integração para Fluxo Completo de Cadastro
  - Implementar testes E2E com Playwright para simular registro completo: navegar para /register, preencher formulário, submeter, verificar criação de usuário/tenant, login subsequente.
  - Testes de integração com Jest/Supertest para backend, executados contra stack Docker (Appwrite + backend).
  - Usar testcontainers ou docker-compose para stack real; não mocks.
  - User Story Relacionada: US-001
  - Entidades: User, Tenant, Audit
  - Páginas: /register, / (frontend-app); /tenants (frontend-admin)
  - Funcionalidades: Fluxo E2E de registro e onboarding
  - Endereço Físico: frontend-app/__tests__/register.test.tsx, backend/tests/user-onboarding.test.ts
  - Requisitos: 8.Tests.md

- [x] TASK-USER-005.1 Escrever testes property-based para TASK-USER-005
  - **Propriedade 1: Fluxo completo de registro persiste usuário e tenant no Appwrite**
  - **Propriedade 2: Auditoria rastreável para operações de onboarding**
  - **Valida: Requisito 4.6**

## 3. Cobertura da Refatoração

As tasks acima completam a refatoração:
- **Página de Registro**: TASK-USER-001
- **Fluxo de Login/Registro**: TASK-USER-002
- **Auto-Onboarding Backend**: TASK-USER-003
- **Visibilidade Admin**: TASK-USER-004
- **Testes Completos**: TASK-USER-005

## 4. Considerações de Segurança e Compliance

- **Validação**: Senhas fortes, confirmação de email opcional via Appwrite.
- **Auditoria**: Todas operações de criação geram Audit com `auditId`.
- **Isolamento**: Usuários associados a tenant lógico; admins globais veem tudo.
- **LGPD**: Consentimento obrigatório no registro.
- **Rate Limit**: Aplicar limites no registro para prevenir abuso.

## 5. Histórico de Versões

- **Versão 1.0** (24 de dezembro de 2025): Criação inicial baseada em análise de documentos e solicitação de refatoração para cadastro de usuários e auto-onboarding.</content>
<parameter name="filePath">/home/mau/projeto/consulta/Docs/refatore_user.md