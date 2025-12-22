# Projeto Bigtech — Validação Plugin InfoSimples

## Índice dos Documentos

- [1.Project.md](1.Project.md) - Visão geral do projeto
- [2.Architecture.md](2.Architecture.md) - Arquitetura técnica
- [3.Structure.md](3.Structure.md) - Estrutura do projeto
- [4.Entities.md](4.Entities.md) - Modelos de dados (entidades)
- [5.Pages.md](5.Pages.md) - Páginas e interfaces
- [6.UserStories.md](6.UserStories.md) - User Stories
- [7.Tasks.md](7.Tasks.md) - Tasks de implementação
- [8.DesignSystem.md](8.DesignSystem.md) - Design System
- [task_plugin.md](task_plugin.md) - Validação Plugin CRUD

## 1. Introdução

Esta task específica (TASK-INFOSIMPLES) visa validar completamente o funcionamento do plugin InfoSimples após sua implementação e ativação. Seguindo o mesmo fluxo do task_plugin.md, focamos em testes reais de integração contra a stack Docker completa (Appwrite + backend + frontend), removendo qualquer mock e validando o comportamento end-to-end.

O plugin InfoSimples fornece consultas de crédito, cadastral e veicular. A validação inclui verificação de UI (cards nas páginas corretas), funcionalidades de consulta, precificação, débito de créditos, isolamento por tenant e auditoria. Todos os testes devem ser executados contra containers reais para garantir validação próxima ao ambiente de produção.

## 2. Tasks

- [x] TASK-INFOSIMPLES-001. Criar Testes para Verificar Cards de Consulta Aparecem Após Ativação do Plugin
- **Primeiro**: Escrever testes E2E com Playwright para validar que, após ativação do plugin InfoSimples, os cards de consulta aparecem nas páginas corretas do frontend-app (crédito, cadastral, veicular).
- **Depois**: Caso os testes falhem, ajustar a integração do plugin com o frontend-app para exibir os cards dinamicamente baseados nos plugins ativos do tenant.
- User Story Relacionada: US-011
- Entidades: Plugin, Consulta
- Páginas: /credito, /cadastral, /veicular (frontend-app)
- Funcionalidades: Testes E2E primeiro, depois exibição condicional de cards baseada em plugins ativos
- Endereço Físico: frontend-app/src/pages/credito.tsx, frontend-app/src/pages/cadastral.tsx, frontend-app/src/pages/veicular.tsx, backend/src/core/pluginLoader.ts
- _Requisitos: 2.1, 5.3

- [ ] TASK-INFOSIMPLES-001.1 Escrever testes E2E para TASK-INFOSIMPLES-001
  - **Descrição:** Testes executados contra stack Docker real. Validar que cards aparecem apenas após ativação do plugin para o tenant correto.
  - **Propriedade 1: Cards de consulta aparecem nas páginas corretas após ativação**
  - **Valida: Requisito 5.3**

- [x] TASK-INFOSIMPLES-002. Criar Testes para Validar Funcionalidade de Consulta (API Interna e Externa)
- **Primeiro**: Escrever testes de integração para validar que consultas funcionam corretamente, chamando API interna (backend) e externa (InfoSimples).
- **Depois**: Caso os testes falhem, refinar a implementação do plugin para garantir comunicação correta entre frontend, backend e API externa.
- User Story Relacionada: US-011
- Entidades: Consulta, Plugin
- Páginas: N/A
- Funcionalidades: Testes de integração primeiro, depois refinamento de chamadas API
- Endereço Físico: backend/src/plugins/consulta/infosimples/index.ts, backend/tests/plugins.test.ts
- _Requisitos: 4.1

- [x] TASK-INFOSIMPLES-002.1 Escrever testes de integração para TASK-INFOSIMPLES-002
  - **Descrição:** Testes contra stack Docker. Validar que consultas retornam dados corretos da API externa via backend.
  - **Propriedade 1: Consultas funcionam com API interna e externa**
  - **Valida: Requisito 4.1**

- [x] TASK-INFOSIMPLES-003. Criar Testes para Verificar Preço da Consulta nos Cards
- **Primeiro**: Escrever testes E2E para validar que os cards exibem o preço correto da consulta.
- **Depois**: Caso os testes falhem, ajustar a configuração do plugin para incluir precificação correta.
- User Story Relacionada: US-011
- Entidades: Consulta
- Páginas: /credito, /cadastral, /veicular
- Funcionalidades: Testes E2E primeiro, depois configuração de preços
- Endereço Físico: backend/src/plugins/consulta/infosimples/index.ts, frontend-app/src/components/ConsultaCard.tsx
- _Requisitos: 4.2

- [x] TASK-INFOSIMPLES-003.1 Escrever testes E2E para TASK-INFOSIMPLES-003
  - **Descrição:** Testes contra stack real. Validar que preços são exibidos corretamente nos cards.
  - **Propriedade 1: Preço da consulta exibido corretamente no card**
  - **Valida: Requisito 4.2**

- [x] TASK-INFOSIMPLES-004. Criar Testes para Verificar Descrição nos Cards
- **Primeiro**: Escrever testes E2E para validar que os cards têm descrição adequada.
- **Depois**: Caso os testes falhem, adicionar descrições no plugin.
- User Story Relacionada: US-011
- Entidades: Consulta
- Páginas: /credito, /cadastral, /veicular
- Funcionalidades: Testes E2E primeiro, depois adição de descrições
- Endereço Físico: backend/src/plugins/consulta/infosimples/index.ts, frontend-app/src/components/ConsultaCard.tsx
- _Requisitos: 5.3

- [x] TASK-INFOSIMPLES-004.1 Escrever testes E2E para TASK-INFOSIMPLES-004
  - **Descrição:** Testes contra stack real. Validar que descrições são exibidas nos cards.
  - **Propriedade 1: Descrição presente e adequada no card**
  - **Valida: Requisito 5.3**

- [x] TASK-INFOSIMPLES-005. Criar Testes para Verificar Categoria dos Cards
- **Primeiro**: Escrever testes E2E para validar que os cards estão na categoria certa (crédito, cadastral, veicular).
- **Depois**: Caso os testes falhem, ajustar categorização no plugin.
- User Story Relacionada: US-011
- Entidades: Consulta
- Páginas: /credito, /cadastral, /veicular
- Funcionalidades: Testes E2E primeiro, depois categorização correta
- Endereço Físico: backend/src/plugins/consulta/infosimples/index.ts, frontend-app/src/pages/credito.tsx, etc.
- _Requisitos: 5.3

- [x] TASK-INFOSIMPLES-005.1 Escrever testes E2E para TASK-INFOSIMPLES-005
  - **Descrição:** Testes contra stack real. Validar que cards estão nas categorias corretas.
  - **Propriedade 1: Cards na categoria certa (crédito, cadastral, veicular)**
  - **Valida: Requisito 5.3**

- [x] TASK-INFOSIMPLES-006. Criar Testes para Verificar Título dos Cards
- **Primeiro**: Escrever testes E2E para validar que o título do card corresponde à consulta/API correta.
- **Depois**: Caso os testes falhem, ajustar títulos no plugin.
- User Story Relacionada: US-011
- Entidades: Consulta
- Páginas: /credito, /cadastral, /veicular
- Funcionalidades: Testes E2E primeiro, depois ajuste de títulos
- Endereço Físico: backend/src/plugins/consulta/infosimples/index.ts, frontend-app/src/components/ConsultaCard.tsx
- _Requisitos: 5.3

- [x] TASK-INFOSIMPLES-006.1 Escrever testes E2E para TASK-INFOSIMPLES-006
  - **Descrição:** Testes contra stack real. Validar que títulos correspondem às consultas corretas.
  - **Propriedade 1: Título do card corresponde à consulta/API correta**
  - **Valida: Requisito 5.3**

- [x] TASK-INFOSIMPLES-007. Criar Testes para Verificar Exibição de Dados Após Consulta
- **Primeiro**: Escrever testes E2E para validar que após a consulta, os dados são exibidos na UI.
- **Depois**: Caso os testes falhem, ajustar a exibição de resultados.
- User Story Relacionada: US-011
- Entidades: Consulta
- Páginas: /credito, /cadastral, /veicular
- Funcionalidades: Testes E2E primeiro, depois exibição de resultados
- Endereço Físico: frontend-app/src/pages/credito.tsx, etc., backend/src/plugins/consulta/infosimples/index.ts
- _Requisitos: 5.3

- [x] TASK-INFOSIMPLES-007.1 Escrever testes E2E para TASK-INFOSIMPLES-007
  - **Descrição:** Testes contra stack real. Validar que modal abre e dados aparecem após consulta completa (digitar CPF/CNPJ e confirmar).
  - **Propriedade 1: Dados da consulta são exibidos na UI após execução completa**
  - **Valida: Requisito 5.3**

- [ ] TASK-INFOSIMPLES-008. Criar Testes para Verificar Débito de Créditos
- **Primeiro**: Escrever testes de integração para validar que créditos são debitados do usuário após consulta.
- **Depois**: Caso os testes falhem, ajustar a lógica de débito de créditos.
- User Story Relacionada: US-011
- Entidades: Consulta, Billing
- Páginas: N/A
- Funcionalidades: Testes de integração primeiro, depois débito de créditos
- Endereço Físico: backend/src/core/billingEngine.ts, backend/tests/billing.test.ts
- _Requisitos: 4.2

- [ ] TASK-INFOSIMPLES-008.1 Escrever testes de integração para TASK-INFOSIMPLES-008
  - **Descrição:** Testes contra stack Docker. Validar que créditos são debitados corretamente.
  - **Propriedade 1: Créditos debitados do usuário após consulta**
  - **Valida: Requisito 4.2**

- [ ] TASK-INFOSIMPLES-009. Criar Testes para Verificar Valor do Crédito em R$
- **Primeiro**: Escrever testes de integração para validar que o valor do crédito corresponde ao valor em Real brasileiro.
- **Depois**: Caso os testes falhem, ajustar precificação.
- User Story Relacionada: US-011
- Entidades: Billing
- Páginas: N/A
- Funcionalidades: Testes de integração primeiro, depois validação de valores
- Endereço Físico: backend/src/core/billingEngine.ts, backend/tests/billing.test.ts
- _Requisitos: 4.2

- [ ] TASK-INFOSIMPLES-009.1 Escrever testes de integração para TASK-INFOSIMPLES-009
  - **Descrição:** Testes contra stack Docker. Validar que valores estão em R$.
  - **Propriedade 1: Valor do crédito em Real brasileiro (R$)**
  - **Valida: Requisito 4.2**

- [x] TASK-INFOSIMPLES-010. Criar Testes para Verificar Ativação com API Key
- **Primeiro**: Escrever testes E2E para validar que após colocar a API key, o plugin é ativado e funciona.
- **Depois**: Caso os testes falhem, ajustar configuração e ativação do plugin.
- User Story Relacionada: US-011
- Entidades: Plugin
- Páginas: /plugins (frontend-admin)
- Funcionalidades: Testes E2E primeiro, depois configuração com API key
- Endereço Físico: frontend-admin/src/components/PluginManager.tsx, backend/src/controllers/admin/plugins.ts
- _Requisitos: 4.1

- [x] TASK-INFOSIMPLES-010.1 Escrever testes E2E para TASK-INFOSIMPLES-010
  - **Descrição:** Testes contra stack real. Validar que plugin ativa com API key válida.
  - **Propriedade 1: Plugin ativado e funcionando após configuração de API key**
  - **Valida: Requisito 4.1**

## 3. Cobertura do Projeto

As tasks acima completam a validação completa do plugin InfoSimples:
- **UI e Exibição**: TASK-INFOSIMPLES-001 a 007
- **Funcionalidade e API**: TASK-INFOSIMPLES-002
- **Precificação e Créditos**: TASK-INFOSIMPLES-003, 008, 009
- **Configuração**: TASK-INFOSIMPLES-010

## 4. Histórico de Versões
- **Versão 1.0** (22 de dezembro de 2025): Criação inicial baseada na solicitação de validação do plugin InfoSimples, seguindo o padrão do task_plugin.md.</content>
<parameter name="filePath">/home/mau/projeto/consulta/Docs/task_infoSimples.md