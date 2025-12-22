# Projeto Bigtech — Task Plugin CRUD Completo

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

Esta task específica (TASK-PLUGIN) visa completar a implementação do fluxo CRUD completo para plugins, removendo mocks, implementando lógica faltante no backend, validando a funcionalidade de "Instalar novo Plugin" no botão em http://localhost:3000/plugins, e criando testes CRUD reais não mockados. Baseado na análise integrada dos documentos 1.Project.md a 7.Tasks.md, com foco em isolamento multi-tenant, auditoria e extensibilidade.

O objetivo é substituir implementações mockadas (se existirem) por lógica real integrada com Appwrite, adicionar/refinar controladores backend para CRUD de plugins, validar a instalação via frontend-admin, permitir habilitação/desabilitação de plugins por tenant, e criar testes property-based reais. A integração real deve ocorrer entre backend, frontend-app e frontend-admin, com isolamento por tenant e auditoria automática.

Nota importante: todos os testes property-based e de integração descritos neste documento devem ser executados contra a stack Docker do projeto (Appwrite + backend + funções + banco de dados e demais serviços relevantes). Esses testes são testes de integração reais que não usam mocks para as integrações principais — eles dependem de containers (via docker-compose ou testcontainers) para validar comportamento em cenários próximos ao ambiente de produção.

O Appwrite já está incluído no repositório e configurado em `appwrite/docker-compose.yml`. A stack Docker fornecida deve ser utilizada pelos testes de integração para garantir que os cenários sejam validados contra o sistema real.

## 2. Tasks

- [x] TASK-PLUGIN-001. Criar Testes para Validar Estado Atual e Remover Mock do Frontend-Admin Plugins
- **Primeiro**: Escrever testes property-based para validar o estado atual da UI (se há mocks ou integração real).
- **Depois**: Caso os testes falhem (indicando presença de mocks), remover dados mockados de plugins.tsx/PluginManager.tsx e integrar com API backend real (/api/admin/plugins).
- User Story Relacionada: US-010
- Entidades: Plugin, Tenant, Audit
- Páginas: /plugins (frontend-admin)
- Funcionalidades: Testes primeiro, depois CRUD real via API, remoção de useState mockado, integração com seleção de tenant
- Endereço Físico: frontend-admin/src/pages/plugins.tsx, frontend-admin/src/components/PluginManager.tsx
- _Requisitos: 5.3.7, 4.1

- [x] TASK-PLUGIN-001.1 Escrever testes property-based para TASK-PLUGIN-001
  - **Descrição:** Testes de integração reais executados contra a stack Docker (Appwrite + backend + frontend). Não usar mocks para validar que UI reflete dados reais do Appwrite sem mocks; executar contra containers reais do Appwrite em containers usando Playwright para E2E testing.
  - **Propriedade 1: UI reflete dados reais do Appwrite (sem mocks)**
  - **Valida: Requisito 4.1**

- [x] TASK-PLUGIN-002. Criar Testes para Validar Estado Atual e Implementar/Refinar Controlador Backend Admin Plugins
- **Primeiro**: Escrever testes property-based de integração para validar o estado atual do controlador backend (se há lógica completa ou faltante).
- **Depois**: Caso os testes falhem (indicando lógica faltante), refinar controlador admin/plugins.ts com endpoints CRUD completos: GET /api/admin/plugins (listar por tenant), POST /api/admin/plugins (instalar), POST /api/admin/plugins/:pluginId/toggle (habilitar/desabilitar), PUT /api/admin/plugins/:pluginId/config (configurar), DELETE /api/admin/plugins/:pluginId (remover).
- Integração com Appwrite collection 'plugins', validação de unicidade (Plugin.pluginId por tenant), isolamento por tenant (admin vê plugins do tenant selecionado), auditoria automática.
- User Story Relacionada: US-010
- Entidades: Plugin, Tenant, Audit
- Páginas: N/A
- Funcionalidades: Testes primeiro, depois CRUD backend real, validação, auditoria, isolamento por tenant
- Endereço Físico: backend/src/controllers/admin/plugins.ts
- _Requisitos: 4.1, 4.6

- [x] TASK-PLUGIN-002.1 Escrever testes property-based de integração para TASK-PLUGIN-002
  - **Descrição:** Testes property-based de integração executados contra a stack Docker (Appwrite + backend). Não usar mocks para validar unicidade por tenant e geração de auditId; executar contra coleções reais do Appwrite em containers.
  - **Propriedade 1: Unicidade de Plugin.pluginId validada por tenant**
  - **Propriedade 2: Operações geram auditId único em Audit**
  - **Valida: Requisito 4.1, 4.6**

- [x] TASK-PLUGIN-003. Criar Testes para Validar Estado Atual e Funcionalidade de Instalação de Plugin via Frontend-Admin
- **Primeiro**: Escrever testes de integração para validar o estado atual do botão "Instalar Novo Plugin" (se funciona ou precisa refinamento).
- **Depois**: Caso os testes falhem (indicando funcionalidade faltante), validar e refinar o botão "Instalar Novo Plugin" em http://localhost:3000/plugins, permitindo instalação de plugins disponíveis (ex.: consulta/infosimples), com seleção de tenant, configuração inicial e status 'disabled' por padrão.
- Backend: Extender controlador para suportar instalação com validação de disponibilidade do plugin, criação de documento em 'plugins' com status 'disabled'.
- User Story Relacionada: US-010
- Entidades: Plugin, Tenant
- Páginas: /plugins (frontend-admin)
- Funcionalidades: Testes primeiro, depois instalação via UI, validação, configuração inicial
- Endereço Físico: frontend-admin/src/components/PluginManager.tsx, backend/src/controllers/admin/plugins.ts
- _Requisitos: 2.1, 4.1

- [x] TASK-PLUGIN-003.1 Escrever testes property-based de integração para TASK-PLUGIN-003
  - **Descrição:** Testes de integração que simulam instalação via UI contra a stack Docker (Appwrite + backend). Validar que plugin é instalado corretamente quando disponível e que o fluxo de instalação funciona com a stack real.
  - **Propriedade 1: Plugin instalado automaticamente quando disponível para o tenant**
  - **Valida: Requisito 2.1**

- [ ] TASK-PLUGIN-004. Criar Testes CRUD Reais para Plugins
- **Primeiro**: Implementar testes de integração end-to-end (E2E) com Appwrite real para validar o estado atual do CRUD completo.
- **Depois**: Caso os testes falhem (indicando lacunas), refinar implementações para suportar instalar plugin via API/UI, verificar isolamento por tenant, habilitar/desabilitar, configurar, remover e validar auditoria em coleções reais do Appwrite rodando em containers.
- Usar Jest + Supertest para backend, Playwright para frontend E2E. Preferir `docker-compose` para levantar a stack em CI, ou `testcontainers` para testes programáticos que exigem isolamento dinâmico.
- User Story Relacionada: US-010
- Entidades: Plugin, Tenant, Audit
- Páginas: /plugins (frontend-admin)
- Funcionalidades: Testes primeiro, depois refinamentos para CRUD reais, habilitação/desabilitação por tenant, identificação (nome, tipo, versão, status)
- Endereço Físico: backend/tests/plugins.test.ts, frontend-admin/__tests__/plugins.test.tsx, frontend-admin/__tests__/plugins.e2e.spec.ts
- _Requisitos: 8.Tests.md

- [ ] TASK-PLUGIN-004.1 Escrever testes property-based para TASK-PLUGIN-004
  - **Propriedade 1: CRUD completo persiste e isola dados por tenant no Appwrite**
  - **Propriedade 2: Auditoria imutável e rastreável para operações de plugin**
  - **Propriedade 3: Habilitação/desabilitação de plugin funciona corretamente por tenant**
  - **Propriedade 4: Identificação correta de nome, tipo, versão e status do plugin**
  - **Valida: Requisito 4.6**

## 3. Cobertura do Projeto

As tasks acima completam o CRUD plugin:
- **Remoção Mock**: TASK-PLUGIN-001
- **Backend Real**: TASK-PLUGIN-002
- **Instalação via Admin**: TASK-PLUGIN-003
- **Testes Reais**: TASK-PLUGIN-004

## 4. Histórico de Versões
- **Versão 1.5** (22 de dezembro de 2025): TASK-PLUGIN-003 concluída - testes E2E criados e passando, funcionalidade de instalação via UI implementada com modal de seleção de plugin, backend extendido para suportar instalação com validação de disponibilidade.
- **Versão 1.3** (22 de dezembro de 2025): TASK-PLUGIN-001 corrigida - testes convertidos de mocks para integração real usando testcontainers e Playwright contra stack Docker completa (Appwrite + backend + frontend).
- **Versão 1.2** (22 de dezembro de 2025): TASK-PLUGIN-001 concluída - testes property-based criados e passando, UI integrada com API real sem mocks, isolamento por tenant implementado.
- **Versão 1.1** (22 de dezembro de 2025): Ajustado para enfatizar criação de testes antes de qualquer refatoração/implementação, conforme solicitado.
- **Versão 1.0** (22 de dezembro de 2025): Criação inicial baseada em análise do fluxo plugin CRUD, seguindo abordagem de task_tenant.md.</content>
<parameter name="filePath">/home/mau/projeto/consulta/Docs/task_plugin.md