# Projeto Bigtech — Task Tenant CRUD Completo

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

Esta task específica (TASK-TENANT) visa completar a implementação do fluxo CRUD completo para tenants, removendo mocks, implementando backend real e permitindo criação de tenants via frontend-app (login/register). Baseado na análise integrada dos documentos 1.Project.md a 7.Tasks.md, com foco em isolamento multi-tenant, auditoria e extensibilidade.

O objetivo é substituir a implementação mockada (frontend-admin/src/pages/tenants.tsx) por lógica real integrada com Appwrite, adicionar controlador backend para CRUD, permitir auto-onboarding de tenants via frontend-app, e criar testes property-based reais.

Nota importante: todos os testes property-based e de integração descritos neste documento devem ser executados contra a stack Docker do projeto (Appwrite + backend + funções + banco de dados e demais serviços relevantes). Esses testes são testes de integração reais que não usam mocks para as integrações principais — eles dependem de containers (via docker-compose ou testcontainers) para validar comportamento em cenários próximos ao ambiente de produção.

O Appwrite já está incluído no repositório e configurado em `appwrite/docker-compose.yml`. A stack Docker fornecida deve ser utilizada pelos testes de integração para garantir que os cenários sejam validados contra o sistema real.

## 2. Tasks

- [x] TASK-TENANT-001. Remover Mock do Frontend-Admin Tenants
- Remover dados mockados de tenants.tsx, integrar com API backend real (/api/admin/tenants).
- User Story Relacionada: US-009
- Entidades: Tenant, Audit
- Páginas: /tenants (frontend-admin)
- Funcionalidades: CRUD real via API, remoção de useState mockado
- Endereço Físico: frontend-admin/src/pages/tenants.tsx
- _Requisitos: 5.3.7, 4.1

- [x] TASK-TENANT-001.1 Escrever testes property-based para TASK-TENANT-001
  - **Propriedade 1: UI reflete dados reais do Appwrite (sem mocks)**
  - **Valida: Requisito 4.1**

- [x] TASK-TENANT-002. Implementar Controlador Backend Admin Tenants
- Criar controlador admin/tenants.ts com endpoints CRUD: GET /api/admin/tenants (listar), POST /api/admin/tenants (criar), PUT /api/admin/tenants/:id (atualizar), DELETE /api/admin/tenants/:id (deletar).
- Integração com Appwrite collection 'tenants', validação de unicidade (Tenant.name), isolamento global (admin vê todos), auditoria automática.
- User Story Relacionada: US-009
- Entidades: Tenant, Audit
- Páginas: N/A
- Funcionalidades: CRUD backend real, validação, auditoria
- Endereço Físico: backend/src/controllers/admin/tenants.ts
- _Requisitos: 4.1, 4.6

- [x] TASK-TENANT-002.1 Escrever testes property-based de integração para TASK-TENANT-002
  - **Descrição:** Testes property-based de integração executados contra a stack Docker (Appwrite + backend). Não usar mocks para validar unicidade global e geração de auditId; executar contra coleções reais do Appwrite em containers.
  - **Propriedade 1: Unicidade de Tenant.name validada globalmente**
  - **Propriedade 2: Operações geram auditId único em Audit**
  - **Valida: Requisito 4.1, 4.6**

- [x] TASK-TENANT-003. Permitir Criação de Tenant via Frontend-App Login/Register
- Modificar fluxo de autenticação em frontend-app para detectar tenant inexistente e permitir criação automática (auto-onboarding) se usuário for admin ou primeiro usuário.
- Adicionar modal/register para criar tenant durante login, com campos básicos (name derivado de domínio/subdomain).
- Backend: Extender AuthService para criar tenant se não existir, com status 'pending' para aprovação admin.
- User Story Relacionada: US-001 (extendida)
- Entidades: Tenant, User
- Páginas: / (login, frontend-app)
- Funcionalidades: Auto-onboarding, criação via login
- Endereço Físico: frontend-app/src/pages/_app.tsx, backend/src/core/auth.ts
- _Requisitos: 2.1, 4.1

- [x] TASK-TENANT-003.1 Escrever testes property-based de integração para TASK-TENANT-003
  - **Descrição:** Testes de integração que simulam fluxo de login/register contra a stack Docker (Appwrite + funções + backend). Validar que tenant é criado automaticamente quando inexistente e que o fluxo de autenticação funciona com a stack real.
  - **Propriedade 1: Tenant criado automaticamente se inexistente durante login**
  - **Valida: Requisito 2.1**

- [ ] TASK-TENANT-004. Criar Testes CRUD Reais para Tenants
- Implementar testes de integração end-to-end (E2E) com Appwrite real, executados contra uma stack Docker completa (Appwrite + banco + funções + backend + auth). Esses testes não usam mocks: devem criar tenant via API, verificar isolamento, atualizar, deletar e validar auditoria em coleções reais do Appwrite rodando em containers.
- Usar Jest + Supertest para backend, Playwright para frontend E2E. Preferir `docker-compose` para levantar a stack em CI, ou `testcontainers` para testes programáticos que exigem isolamento dinâmico.
- User Story Relacionada: US-009
- Entidades: Tenant, Audit
- Páginas: /tenants (frontend-admin)
- Funcionalidades: Testes reais CRUD
- Endereço Físico: backend/tests/tenants.test.ts, frontend-admin/__tests__/tenants.test.tsx
- _Requisitos: 8.Tests.md

- [ ] TASK-TENANT-004.1 Escrever testes property-based para TASK-TENANT-004
  - **Propriedade 1: CRUD completo persiste e isola dados no Appwrite**
  - **Propriedade 2: Auditoria imutável e rastreável**
  - **Valida: Requisito 4.6**

## 3. Cobertura do Projeto

As tasks acima completam o CRUD tenant:
- **Remoção Mock**: TASK-TENANT-001
- **Backend Real**: TASK-TENANT-002
- **Criação via App**: TASK-TENANT-003
- **Testes Reais**: TASK-TENANT-004

## 4. Histórico de Versões
- **Versão 1.2** (22 de dezembro de 2025): Implementação completa de TASK-TENANT-002 e TASK-TENANT-002.1. Criado controlador backend admin/tenants.ts com CRUD completo, validação de unicidade, auditoria automática, e testes property-based estruturados (são testes de integração que exigem a stack Appwrite rodando via Docker; podem falhar se a stack não estiver disponível).
- **Versão 1.1** (22 de dezembro de 2025): Implementação completa de TASK-TENANT-001 e TASK-TENANT-001.1. Removidos mocks do frontend-admin tenants.tsx, integrada API real, testes property-based validados.
- **Versão 1.0** (22 de dezembro de 2025): Criação inicial baseada em análise do fluxo tenant CRUD.</content>
<parameter name="filePath">/home/mau/projeto/consulta/Docs/task_tenant.md