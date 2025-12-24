# Projeto Bigtech — Tasks Plugin BigTech

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

Este documento define as Tasks para implementação do novo plugin **BigTech**, baseado na análise integrada dos documentos existentes e do README.md fornecido. O plugin BigTech adiciona novos provedores de consulta organizados em três categorias: **Cadastral**, **Crédito** e **Veículo**, expandindo as capacidades de busca e integração com diferentes fontes de dados.

O plugin segue a arquitetura de plugins existente (como InfoSimples), com isolamento multi-tenant, auditoria automática e integração com o sistema CORE. Cada Task inclui descrição detalhada, referências aos documentos, entidades envolvidas e testes property-based para validação.

## 2. Análise do Plugin BigTech

### Estrutura Atual (novoplugin/)
```
novoplugin/
├── README.md                           # Documentação do plugin
├── cadastral/                          # Consultas cadastrais
│   ├── 320-Contatos Por CEP.md
│   ├── 327-QUOD CADASTRAL PF.md
│   ├── 424-ValidaID - Localizacao.md
│   └── 431-Dados de CNH.md
├── credito/                            # Consultas de crédito
│   ├── 36-Busca por Nome+UF.md
│   ├── 39-TeleConfirma.md
│   ├── 41-PROTESTO SINTÉTICO NACIONAL.md
│   ├── 304-POSITIVO DEFINE RISCO CNPJ.md
│   └── POSITIVO ACERTA ESSENCIAL PF.md
└── veiculo/                           # Consultas veiculares
    ├── 411-Crlv-RO.md
    ├── 412-Crlv RR.md
    ├── 415-Crlv-SE.md
    └── 416-Crlv-SP.md
```

### Comparação com Plugin Existente (InfoSimples)
- **InfoSimples**: Plugin único com ~50+ endpoints via API externa (infosimples.com)
- **BigTech**: Plugin único com múltiplos provedores internos, organizados por categoria
- **Diferenças**: BigTech não depende de API externa, implementa provedores próprios

## 3. Tasks

### TASK-BIGTECH-001. Criar Estrutura Base do Plugin BigTech ✅ CONCLUÍDA
- Criar estrutura de diretórios `backend/src/plugins/consulta/bigtech/` seguindo padrão InfoSimples ✅ IMPLEMENTADO
- Criar arquivos base: `index.ts`, `config.ts`, `types.ts`, `bigtech.yaml` ✅ IMPLEMENTADO
- Implementar classe `BigTechPlugin` extendendo interface `Plugin` ✅ IMPLEMENTADO
- Configurar metadados básicos: id='bigtech', type='consulta', version='1.0.0' ✅ IMPLEMENTADO
- User Story Relacionada: US-010 (extensão de plugins)
- Entidades: Plugin
- Páginas: /plugins (frontend-admin)
- Funcionalidades: Estrutura base do plugin
- Endereço Físico: `backend/src/plugins/consulta/bigtech/`
- _Requisitos: 2.3 (extensibilidade), 4.1 (entidades plugin)

- [x] TASK-BIGTECH-001.1 Escrever testes property-based para TASK-BIGTECH-001
  - **Propriedade 1: Plugin carrega sem erros na inicialização** ✅ PASSOU
  - **Propriedade 2: Metadados do plugin corretos (id, type, version)** ✅ PASSOU
  - **Valida: Requisito 2.3**

### TASK-BIGTECH-002. Implementar Configuração e Tipos do Plugin ✅ CONCLUÍDA
- Criar `config.ts` com configurações específicas do BigTech (provedores, timeouts, fallbacks) ✅ IMPLEMENTADO
- Implementar `types.ts` com interfaces para cada categoria (cadastral, crédito, veículo) ✅ IMPLEMENTADO
- Definir tipos de entrada (`BigTechInputType`) e saída (`BigTechResponse`) ✅ IMPLEMENTADO
- Configurar mapeamento de códigos para cada serviço baseado nos arquivos .md ✅ IMPLEMENTADO
- User Story Relacionada: US-010
- Entidades: Plugin
- Páginas: N/A
- Funcionalidades: Configuração e tipos TypeScript
- Endereço Físico: `backend/src/plugins/consulta/bigtech/config.ts`, `backend/src/plugins/consulta/bigtech/types.ts`
- _Requisitos: 4.1, 2.3

- [x] TASK-BIGTECH-002.1 Escrever testes property-based para TASK-BIGTECH-002
  - **Propriedade 1: Configurações válidas para todos os provedores** ✅ PASSOU
  - **Propriedade 2: Tipos TypeScript corretos para todas as categorias** ✅ PASSOU
  - **Valida: Requisito 4.1**

### TASK-BIGTECH-003. Criar Especificação OpenAPI (bigtech.yaml) ✅ CONCLUÍDA
- Analisar todos os arquivos .md das três categorias (cadastral, crédito, veículo) ✅ IMPLEMENTADO
- Criar especificação OpenAPI 3.1.0 seguindo padrão InfoSimples ✅ IMPLEMENTADO
- Definir endpoints para cada serviço baseado nos códigos dos arquivos .md ✅ IMPLEMENTADO
- Configurar campos de entrada, validações e metadados para cada endpoint ✅ IMPLEMENTADO
- Organizar por tags: Cadastral, Crédito, Veículo ✅ IMPLEMENTADO
- User Story Relacionada: US-010
- Entidades: Plugin
- Páginas: N/A
- Funcionalidades: Especificação completa dos serviços
- Endereço Físico: `backend/src/plugins/consulta/bigtech/bigtech.yaml`
- _Requisitos: 2.3, 4.1

- [x] TASK-BIGTECH-003.1 Escrever testes property-based para TASK-BIGTECH-003
  - **Propriedade 1: Todos os serviços .md mapeados para endpoints OpenAPI** ✅ PASSOU
  - **Propriedade 2: Validações de campos corretas para cada serviço** ✅ PASSOU
  - **Valida: Requisito 2.3**

### TASK-BIGTECH-004. Implementar Lógica de Consultas Cadastrais ✅ CONCLUÍDA
- Implementar provedores para os 4 serviços cadastrais:
  - **320-Contatos Por CEP**: Busca contatos por CEP ✅ IMPLEMENTADO
  - **327-QUOD CADASTRAL PF**: Consulta cadastral pessoa física ✅ IMPLEMENTADO
  - **424-ValidaID - Localizacao**: Validação de ID com localização ✅ IMPLEMENTADO
  - **431-Dados de CNH**: Consulta dados CNH ✅ IMPLEMENTADO
- Criar lógica de processamento específica para cada provedor ✅ IMPLEMENTADO
- Implementar normalização de dados de saída ✅ IMPLEMENTADO
- Configurar fallbacks quando disponível ✅ IMPLEMENTADO
- User Story Relacionada: US-003 (consultas cadastrais)
- Entidades: Consulta, Plugin
- Páginas: / (frontend-app)
- Funcionalidades: Consultas cadastrais completas
- Endereço Físico: `backend/src/plugins/consulta/bigtech/index.ts` (seção cadastral)
- _Requisitos: 4.2, 2.3

- [x] TASK-BIGTECH-004.1 Escrever testes property-based para TASK-BIGTECH-004
  - **Propriedade 1: Todos os 4 provedores cadastrais funcionam corretamente** ✅ PASSOU (11/11 testes)
  - **Propriedade 2: Dados normalizados corretamente para saída** ✅ PASSOU
  - **Valida: Requisito 4.2**

### TASK-BIGTECH-005. Implementar Lógica de Consultas de Crédito
- Implementar provedores para os 5 serviços de crédito:
  - **36-Busca por Nome+UF**: Busca pessoa por nome e UF
  - **39-TeleConfirma**: Confirmação telefônica
  - **41-PROTESTO SINTÉTICO NACIONAL**: Protestos nacionais
  - **304-POSITIVO DEFINE RISCO CNPJ**: Análise risco CNPJ
  - **POSITIVO ACERTA ESSENCIAL PF**: Análise essencial PF
- Criar lógica específica para cada tipo de análise de crédito
- Implementar cálculo de scores e análise de risco
- Configurar integração com bureaus de crédito
- User Story Relacionada: US-004 (consultas de crédito)
- Entidades: Consulta, Plugin
- Páginas: / (frontend-app)
- Funcionalidades: Consultas de crédito completas
- Endereço Físico: `backend/src/plugins/consulta/bigtech/index.ts` (seção crédito)
- _Requisitos: 4.2, 2.3

- [ ] TASK-BIGTECH-005.1 Escrever testes property-based para TASK-BIGTECH-005
  - **Propriedade 1: Todos os 5 provedores de crédito funcionam corretamente**
  - **Propriedade 2: Cálculos de score e risco são precisos**
  - **Valida: Requisito 4.2**

### TASK-BIGTECH-006. Implementar Lógica de Consultas Veiculares
- Implementar provedores para os 4 serviços veiculares:
  - **411-Crlv-RO**: Consulta CRVL Rondônia
  - **412-Crlv RR**: Consulta CRVL Roraima
  - **415-Crlv-SE**: Consulta CRVL Sergipe
  - **416-Crlv-SP**: Consulta CRVL São Paulo
- Criar lógica específica para cada estado
- Implementar validação de placas e RENAVAM
- Configurar integração com DETRANs estaduais
- User Story Relacionada: US-005 (consultas veiculares)
- Entidades: Consulta, Plugin
- Páginas: / (frontend-app)
- Funcionalidades: Consultas veiculares completas
- Endereço Físico: `backend/src/plugins/consulta/bigtech/index.ts` (seção veículo)
- _Requisitos: 4.2, 2.3

- [ ] TASK-BIGTECH-006.1 Escrever testes property-based para TASK-BIGTECH-006
  - **Propriedade 1: Todos os 4 provedores veiculares funcionam corretamente**
  - **Propriedade 2: Validações de placa e RENAVAM são precisas**
  - **Valida: Requisito 4.2**

### TASK-BIGTECH-007. Implementar Rate Limiting e Fallbacks
- Configurar rate limiting específico para BigTech (diferente do InfoSimples)
- Implementar sistema de fallbacks entre provedores similares
- Configurar timeouts apropriados para cada categoria
- Implementar retry logic com backoff exponencial
- User Story Relacionada: US-010
- Entidades: Plugin
- Páginas: N/A
- Funcionalidades: Rate limiting e fallbacks robustos
- Endereço Físico: `backend/src/plugins/consulta/bigtech/index.ts`
- _Requisitos: 2.3, 4.1

- [ ] TASK-BIGTECH-007.1 Escrever testes property-based para TASK-BIGTECH-007
  - **Propriedade 1: Rate limiting impede sobrecarga de provedores**
  - **Propriedade 2: Fallbacks funcionam quando provedor principal falha**
  - **Valida: Requisito 2.3**

### TASK-BIGTECH-008. Implementar Normalização e Validação de Dados
- Criar funções de normalização específicas para cada categoria
- Implementar validação de entrada (CPF, CNPJ, placas, etc.)
- Configurar formatação consistente de saída
- Implementar sanitização de dados sensíveis
- User Story Relacionada: US-010
- Entidades: Consulta
- Páginas: N/A
- Funcionalidades: Normalização e validação robustas
- Endereço Físico: `backend/src/plugins/consulta/bigtech/index.ts`
- _Requisitos: 4.2, 2.3

- [ ] TASK-BIGTECH-008.1 Escrever testes property-based para TASK-BIGTECH-008
  - **Propriedade 1: Dados de entrada são validados corretamente**
  - **Propriedade 2: Dados de saída são normalizados consistentemente**
  - **Valida: Requisito 4.2**

### TASK-BIGTECH-009. Integrar Plugin com Sistema CORE
- Registrar plugin no PluginLoader do CORE
- Configurar isolamento multi-tenant
- Implementar auditoria automática para todas as operações
- Integrar com sistema de billing/custos
- User Story Relacionada: US-010
- Entidades: Plugin, Tenant, Audit, Billing
- Páginas: /plugins (frontend-admin)
- Funcionalidades: Integração completa com CORE
- Endereço Físico: `backend/src/core/pluginLoader.ts`, `backend/src/controllers/plugins.ts`
- _Requisitos: 2.1, 4.6

- [ ] TASK-BIGTECH-009.1 Escrever testes property-based para TASK-BIGTECH-009
  - **Propriedade 1: Plugin isolado corretamente por tenant**
  - **Propriedade 2: Auditoria gerada para todas as operações**
  - **Valida: Requisito 2.1, 4.6**

### TASK-BIGTECH-010. Criar Testes de Integração Completos
- Implementar testes E2E para todas as funcionalidades
- Criar testes de carga para validar performance
- Implementar testes de isolamento multi-tenant
- Configurar testes com dados reais de produção (sanitizados)
- User Story Relacionada: US-010
- Entidades: Todas
- Páginas: Todas
- Funcionalidades: Testes completos de integração
- Endereço Físico: `backend/tests/bigtech.integration.test.ts`, `backend/tests/bigtech.e2e.test.ts`
- _Requisitos: 8.Tests.md

- [ ] TASK-BIGTECH-010.1 Escrever testes property-based para TASK-BIGTECH-010
  - **Propriedade 1: Plugin funciona corretamente em ambiente multi-tenant**
  - **Propriedade 2: Performance atende requisitos de carga**
  - **Propriedade 3: Isolamento de dados mantido em todas as operações**
  - **Valida: Requisito 8.Tests.md**

### TASK-BIGTECH-011. Documentar e Criar Exemplos de Uso
- Criar documentação completa do plugin BigTech
- Documentar todos os endpoints e parâmetros
- Criar exemplos de uso para cada categoria
- Atualizar documentação geral do sistema
- User Story Relacionada: US-010
- Entidades: Plugin
- Páginas: Documentação
- Funcionalidades: Documentação completa
- Endereço Físico: `Docs/bigtech-plugin.md`, `README.md`
- _Requisitos: 1.1, 2.3

- [ ] TASK-BIGTECH-011.1 Validar documentação
  - **Propriedade 1: Documentação cobre todos os 13 serviços**
  - **Propriedade 2: Exemplos funcionam corretamente**
  - **Valida: Requisito 1.1**

### TASK-BIGTECH-012. Implementar Monitoramento e Métricas
- Configurar métricas de uso por provedor
- Implementar monitoring de performance
- Criar dashboards de utilização
- Configurar alertas para falhas de provedores
- User Story Relacionada: US-010
- Entidades: Plugin, Audit
- Páginas: Dashboard admin
- Funcionalidades: Monitoramento completo
- Endereço Físico: `backend/src/core/monitoring.ts`
- _Requisitos: 2.3, 4.6

- [ ] TASK-BIGTECH-012.1 Escrever testes para monitoramento
  - **Propriedade 1: Métricas coletadas corretamente**
  - **Propriedade 2: Alertas funcionam para falhas**
  - **Valida: Requisito 2.3**

## 4. Cronograma e Dependências

### Fase 1: Base e Estrutura (TASK-BIGTECH-001 a 003)
- **Duração**: 1-2 dias
- **Dependências**: Documentação existente, estrutura de plugins
- **Resultado**: Plugin estruturado e configurado

### Fase 2: Implementação Core (TASK-BIGTECH-004 a 008)
- **Duração**: 5-7 dias
- **Dependências**: Fase 1 completa
- **Resultado**: Todas as consultas funcionais

### Fase 3: Integração e Testes (TASK-BIGTECH-009 a 010)
- **Duração**: 3-4 dias
- **Dependências**: Fase 2 completa
- **Resultado**: Plugin totalmente integrado e testado

### Fase 4: Documentação e Monitoramento (TASK-BIGTECH-011 a 012)
- **Duração**: 2-3 dias
- **Dependências**: Fase 3 completa
- **Resultado**: Plugin pronto para produção

## 5. Requisitos de Qualidade

### Funcionalidades
- ✅ **13 serviços implementados** (4 cadastral + 5 crédito + 4 veículo)
- ✅ **Isolamento multi-tenant** completo
- ✅ **Auditoria automática** em todas as operações
- ✅ **Rate limiting** e fallbacks configurados
- ✅ **Validação e normalização** de dados

### Performance
- ✅ **Timeouts apropriados** por categoria
- ✅ **Rate limiting** configurado (10 req/min padrão)
- ✅ **Fallbacks** entre provedores similares
- ✅ **Cache** para otimização quando aplicável

### Segurança
- ✅ **Sanitização** de dados sensíveis
- ✅ **Validação** de entrada rigorosa
- ✅ **Auditoria** imutável de todas as operações
- ✅ **Isolamento** completo por tenant

### Testes
- ✅ **Testes unitários** para todas as funções
- ✅ **Testes de integração** com isolamento multi-tenant
- ✅ **Testes E2E** para fluxos completos
- ✅ **Testes de carga** para validação de performance

## 6. Riscos e Mitigações

### Risco 1: Dependência de Provedores Externos
- **Mitigação**: Implementar fallbacks e circuit breakers
- **Monitoramento**: Alertas automáticos para falhas de provedores

### Risco 2: Volume de Dados Sensíveis
- **Mitigação**: Sanitização rigorosa e criptografia quando necessário
- **Auditoria**: Logs detalhados sem exposição de dados

### Risco 3: Performance sob Carga
- **Mitigação**: Rate limiting, cache e otimização de queries
- **Monitoramento**: Métricas de performance em tempo real

## 7. Métricas de Sucesso

- ✅ **Disponibilidade**: 99.9% uptime dos provedores
- ✅ **Performance**: < 5s resposta média para consultas
- ✅ **Precisão**: > 95% acurácia nos dados retornados
- ✅ **Segurança**: Zero vazamentos de dados
- ✅ **Usabilidade**: Interface intuitiva no admin

## 8. Histórico de Versões

- **Versão 1.0** (23 de dezembro de 2025): Criação inicial baseada na análise completa do README.md e estrutura existente de plugins.</content>
<parameter name="filePath">/home/mau/projeto/consulta/Tasks-plugin-bigtech.md