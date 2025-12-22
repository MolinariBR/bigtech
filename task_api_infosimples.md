# TASK-API-INFOSIMPLES: Implementação Dinâmica de Consultas InfoSimples via OpenAPI

## Descrição Geral

Implementar a geração dinâmica de consultas InfoSimples baseada na proposta em `proposta.md`, utilizando o arquivo `infosimples.yaml` (OpenAPI v2.2.33) como fonte de verdade. O objetivo é substituir o código hardcoded no plugin Infosimples por um sistema automatizado que gera cards, formulários e validações dinamicamente, permitindo adicionar novas consultas sem modificar código.

**Precedência**: 1.Project.md → 2.Architecture.md → 4.Entities.md → 6.UserStories.md → proposta.md.

**Páginas Afetadas**: consulta/credito.tsx, consulta/cadastral.tsx, consulta/veicular.tsx (frontend-app); InfosimplesPlugin (backend).

---

## TASK-API-INFOSIMPLES-001: Criar Parser OpenAPI e Tipos de Campos ✅ COMPLETA

**Descrição**: Desenvolver o parser OpenAPI em `backend/src/utils/openapiParser.ts` para analisar `infosimples.yaml` e gerar schemas de consulta dinâmicos com tipos de campos padronizados.

**Subtasks**:
- [x] Criar interfaces `ConsultaSchema` e `Field` em `backend/src/plugins/consulta/infosimples/types2.ts`.
- [x] Implementar classe `OpenApiParser` com método `parse()` que carrega YAML e extrai paths de consultas.
- [x] Implementar `buildSchema()` para converter path em `ConsultaSchema` com título, endpoint e campos.
- [x] Implementar `extractFields()` para filtrar parâmetros (remover `token`, `timeout`) e mapear para `Field[]`.
- [x] Implementar `inferType()` para classificar campos (ex.: cpf → 'document.cpf', birthdate → 'date.iso').
- [x] Adicionar validação de tipos básicos (CPF: ^\d{11}$, data: ^\d{4}-\d{2}-\d{2}$).

**Critérios de Aceitação**:
- Parser gera schemas corretos para receita_federal_cpf e cenprot_sp_protestos.
- Tipos inferidos corretamente para campos conhecidos.

---

## TASK-API-INFOSIMPLES-002: Modificar InfosimplesPlugin para Geração Dinâmica de Serviços ✅ COMPLETA

**Descrição**: Atualizar `InfosimplesPlugin` para usar o parser e gerar `getAvailableServices()` dinamicamente, substituindo hardcoded por mapeamento do OpenAPI.

**Subtasks**:
- [x] Importar `OpenApiParser` em `index.ts`.
- [x] Modificar `getAvailableServices()` para chamar parser e mapear schemas para serviços (id, name, description, price, category).
- [x] Implementar `inferCategory()` para classificar por path (ex.: receita-federal → cadastral).
- [x] Implementar `getPriceForCategory()` com preços padrão por categoria.
- [x] Implementar `loadOpenApiYaml()` para carregar `infosimples.yaml` do filesystem.
- [x] Implementar `getDescriptionFromSummary()` para gerar descrições baseadas no título do OpenAPI.

**Critérios de Aceitação**:
- `getAvailableServices()` retorna lista dinâmica baseada no YAML.
- Categorias e preços corretos para consultas conhecidas.

**Status**: ✅ COMPLETA - Plugin gera 837 serviços dinamicamente, receita_federal_cpf e cenprot_sp_protestos encontrados com categorias e preços corretos. Método funcionando perfeitamente.

---

## TASK-API-INFOSIMPLES-003: Atualizar Chamada API para Uso Dinâmico de Schemas ✅ COMPLETA

**Descrição**: Modificar `callInfosimplesAPI()` e `getConsultaCode()` para usar schemas dinâmicos em vez de config hardcoded.

**Subtasks**:
- [x] Atualizar `getConsultaCode()` para buscar endpoint diretamente do schema (não do config.ts).
- [x] Modificar `callInfosimplesAPI()` para preparar `queryParams` baseado nos campos do schema.
- [x] Implementar limpeza de máscaras (CPF/CNPJ) baseada no tipo de campo.
- [x] Garantir que campos infra (`token`, `timeout`) sejam adicionados automaticamente.
- [x] Remover query string da URL (POST puro).
- [x] Implementar `getSchemaForEndpoint()` para recuperar schema por endpoint.

**Critérios de Aceitação**:
- Chamada API funciona para receita_federal_cpf com parâmetros corretos (CPF sem máscara, birthdate ISO).
- Compatibilidade com consultas existentes.

**Status**: ✅ COMPLETA - callInfosimplesAPI() agora usa schema dinâmico para preparar parâmetros, com limpeza automática de máscaras (CPF/CNPJ), formatação de datas ISO, e adição automática de token/timeout. Método getConsultaCode() busca endpoint do schema. Fallback hardcoded mantido para compatibilidade.

---

## TASK-API-INFOSIMPLES-004: Atualizar Frontend para Cards Dinâmicos ✅ COMPLETA

**Descrição**: Modificar páginas de consulta (credito.tsx, cadastral.tsx, veicular.tsx) para buscar serviços dinamicamente via API e renderizar cards automaticamente.

**Subtasks**:
- [x] Atualizar fetch para `/api/plugins/infosimples/services` em vez de hardcoded.
- [x] Modificar renderização de cards para usar dados dinâmicos (name, description, price, category).
- [x] Adicionar Badge para categoria em cada card.
- [x] Manter compatibilidade com modal existente.
- [x] Testar carregamento em todas as páginas de consulta.

**Critérios de Aceitação**:
- Cards aparecem dinamicamente baseados no backend.
- Categorias e preços exibidos corretamente.

**Status**: ✅ COMPLETA - Todas as páginas (credito, cadastral, veicular) agora fazem fetch dinâmico da API, renderizam cards com dados dinâmicos, exibem badges de categoria, e executam consultas reais via API InfoSimples em vez de mock data. API testada e funcionando com 837 serviços dinâmicos, categorização corrigida (15 serviços de crédito, 72 cadastral, 141 veicular).

## TASK-API-INFOSIMPLES-005: Implementar Modal com Resultados Reais ✅ COMPLETA

**Descrição**: Atualizar modal de consulta para exibir dados reais da resposta (ex.: nome, endereço) em vez de apenas status.

**Subtasks**:
- [x] Modificar estado do modal para incluir `data` (objeto com campos da resposta).
- [x] Atualizar renderização do modal para iterar sobre `data` e exibir chave-valor.
- [x] Adicionar tratamento para respostas vazias ou erros específicos.
- [x] Melhorar UX com formatação (ex.: datas, CPFs).
- [x] Testar com consulta real (receita_federal_cpf) para verificar dados exibidos.

**Critérios de Aceitação**:
- Modal mostra dados detalhados da consulta bem-sucedida.
- Erros específicos são exibidos claramente.

**Status**: ✅ COMPLETA - Modal atualizado para exibir dados reais da API InfoSimples com formatação adequada (CPF/CNPJ, datas, telefones, CEPs). Componente ModalResult criado para renderização estruturada dos dados. Tratamento de erros aprimorado com detalhes técnicos expansíveis. Todas as páginas de consulta (credito, cadastral, veicular, outros) atualizadas para usar o novo sistema.

---

## TASK-API-INFOSIMPLES-006: Implementar Validação Local Dinâmica

**Descrição**: Adicionar validação local baseada nos tipos de campos antes da chamada API, bloqueando envios inválidos.

**Subtasks**:
- [ ] Criar função `validateField(type, value)` para cada tipo (ex.: CPF regex, data ISO).
- [ ] Integrar validação no frontend antes do submit.
- [ ] Exibir erros de validação no modal/form.
- [ ] Testar validação para campos obrigatórios e formatos incorretos.

**Critérios de Aceitação**:
- Formulários inválidos são bloqueados.
- Mensagens de erro claras para usuário.

---

## TASK-API-INFOSIMPLES-007: Testes e Validação de Escalabilidade

**Descrição**: Criar testes para validar a implementação e garantir que novas consultas sejam adicionadas automaticamente.

**Subtasks**:
- [ ] Testes unitários para `OpenApiParser` (inferência de tipos, geração de schemas).
- [ ] Testes unitários para `InfosimplesPlugin` (geração de services, chamada API).
- [ ] Testes E2E: Carregar cards dinâmicos, executar consulta e verificar modal.
- [ ] Teste de escalabilidade: Adicionar nova consulta no YAML e verificar se aparece sem código novo.
- [ ] Testes de regressão para consultas existentes.

**Critérios de Aceitação**:
- Todos os testes passando.
- Nova consulta adicionada automaticamente.

---

## Referências

- `proposta.md`: Arquitetura proposta.
- `infosimples.yaml`: OpenAPI fonte.
- `backend/src/plugins/consulta/infosimples/index.ts`: Plugin atual.
- `frontend-app/src/pages/consulta/credito.tsx`: Frontend atual.
- `7.Tasks.md`: Padrão de tasks do projeto.