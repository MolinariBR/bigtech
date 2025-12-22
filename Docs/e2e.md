# E2E Testes mapeados por PAC

Este documento descreve cenários de testes end-to-end (E2E) correspondentes a cada PAC listado em `function.md`. Cada cenário contém pré-condições, passos e critérios de aceitação. Use Cypress ou Playwright para automatizar estes cenários.

Formato do cenário:
- Objetivo: Resumo do teste
- Pré-condições: estado do sistema / dados necessários
- Passos: passos executáveis pelo test runner
- Critério de aceitação: o que valida sucesso

---

## PAC-001: Sistema de Plugins - Loader (OK)
- Objetivo: Validar que plugins são carregados na inicialização e expostos pela API pública.
- Pré-condições: container backend em execução; pasta `plugins/` com pelo menos 1 plugin de teste.
- Passos:
  1. Iniciar backend (modo dev) ou usar ambiente de teste.
  2. Chamar `GET /api/plugins`.
  3. Verificar que a lista inclui o plugin de teste.
- Critério de aceitação: resposta 200 com `plugins` contendo o id do plugin de teste.
 - Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

## PAC-002: Sistema de Plugins - Execução
- Objetivo: Executar um plugin com contexto isolado e receber resposta consistente.
- Pré-condições: tenant e usuário de teste com créditos suficientes.
- Passos:
  1. Autenticar e obter token válido.
  2. Fazer `POST /api/plugins/:pluginId/execute` com `tenantId` e `userId` no contexto.
  3. Verificar resposta `success: true` e payload esperado.
 - Critério de aceitação: 200 OK e `data` do plugin válida.
 - Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

## PAC-003: Plugin Asaas - Pagamento
- Objetivo: Simular fluxo de pagamento via plugin Asaas (modo sandbox).
- Pré-condições: chave de sandbox configurada no plugin; conta de teste.
- Passos:
  1. Criar pedido de pagamento via API do plugin.
  2. Simular callback de pagamento (webhook) se aplicável.
  3. Verificar atualização de status da transação no backend.
 - Critério de aceitação: transação criada com status esperado e registro persistido.
 - Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

## PAC-004.1: Limpeza de Cards Mock - Frontend-App
- Objetivo: Verificar páginas sem dados mock; solicitações ao backend retornam dados reais.
- Pré-condições: backend com endpoints de consulta prontos.
- Passos:
  1. Abrir página de consulta no frontend-app.
  2. Verificar chamadas de rede e ausência de dados mock locais.
 - Critério de aceitação: página mostra dados do backend, build sem erros.
 - Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

## PAC-005: Multi-tenancy - Middleware
- Objetivo: Validar isolamento por `X-Tenant-ID` e subdomínios.
- Pré-condições: dois tenants com dados distintos.
- Passos:
  1. Fazer requisição com `X-Tenant-ID` do tenant A e verificar dados A.
  2. Fazer requisição com `X-Tenant-ID` do tenant B e verificar dados B.
 - Critério de aceitação: cada request vê apenas os dados do tenant correspondente.
 - Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

## PAC-006: Autenticação - Core
- Objetivo: Fluxo completo de login, refresh e logout com cookies HttpOnly.
- Pré-condições: usuário de teste criado; variáveis de ambiente de secrets configuradas.
- Passos:
  1. Fazer login e receber access token e cookie de refresh.
  2. Invalidar access token (simular expiração) e chamar `POST /auth/refresh` com cookie.
  3. Verificar novo access token e acesso a rota autenticada.
  4. Fazer logout e verificar invalidação de refresh.
 - Critério de aceitação: refresh funciona e logout invalida refresh token.
 - Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

## PAC-007: Billing Engine
- Objetivo: Validar cálculo de cobrança, arredondamento e jobs de faturamento.
- Pré-condições: usuário/tenant com histórico de uso; job de faturamento configurado.
- Passos:
  1. Gerar eventos de uso para o tenant (simulados).
  2. Executar job de faturamento manualmente (ou aguardar scheduler).
  3. Verificar faturas geradas e valores arredondados corretamente.
 - Critério de aceitação: faturas geradas com soma batendo com cálculos esperados; idempotência do job.
 - Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

## PAC-008: Event Bus
- Objetivo: Validar publish/subscribe e entrega eventual em ambiente integrado.
- Pré-condições: serviço de mensageria (se aplicável) ou in-memory para E2E.
- Passos:
  1. Subscribir componente de teste a evento `X`.
  2. Publicar evento `X` e verificar recebimento pelo subscriber.
  3. Simular falha do subscriber e verificar dead-letter ou retry (se aplicável).
 - Critério de aceitação: evento entregue a todos subscribers e políticas de retry executadas.
 - Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

## PAC-009: Audit Logger
- Objetivo: Validar registro de ações, filtros e paginação via API de auditoria.
- Pré-condições: usuário autenticado e coleção `audits` disponível.
- Passos:
  1. Executar ações que geram audit logs (login, plugin install, consulta).
  2. Chamar API de logs com filtros (`userId`, `action`, range de datas) e `limit`/offset.
  3. Verificar ordem por `timestamp` (desc) e paginação correta.
 - Critério de aceitação: logs retornados correspondem às ações e filtros aplicados.
 - Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

## PAC-010: API Admin - Plugins
- Objetivo: Validar CRUD admin de plugins (list, install, toggle, config, delete).
- Pré-condições: usuário admin autenticado; tenant de teste.
- Passos:
  1. `GET /api/admin/plugins?tenantId=xxx` deve retornar lista.
  2. `POST /api/admin/plugins` instalar plugin; verificar 201 e documento criado.
  3. `POST /api/admin/plugins/:id/toggle` alterar status; verificar mudança.
  4. `PUT /api/admin/plugins/:id/config` atualizar configurações.
  5. `DELETE /api/admin/plugins/:id` remover e verificar ausência.
 - Critério de aceitação: operações CRUD retornam códigos HTTP corretos e estado persistido.
 - Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

## PAC-011: API Admin - Billing
- Objetivo: Validar endpoints de listagem e agregação financeira.
- Pré-condições: dados de billing existentes para o tenant.
- Passos:
  1. `GET /api/admin/billing?tenantId=xxx` retorna listagem paginada.
  2. Verificar agregações por período (week/month) correspondem aos dados.
 - Critério de aceitação: resultados consistentes com cálculos de backend.
 - Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

## PAC-012 até PAC-040 — Cenários detalhados
Para cada PAC abaixo há um cenário E2E objetivo, pré-condições, passos e critério de aceitação. Use estes como base para implementar testes automatizados (Playwright/Cypress).

### PAC-012: Frontend-Admin - Header
- Objetivo: Verificar navegação, exibição de usuário e indicadores (notificações, tenant selector).
- Pré-condições: usuário admin autenticado; front-end em execução.
- Passos:
  1. Abrir aplicação admin e validar carregamento do header.
  2. Verificar existência do seletor de tenant e do avatar/usuário.
  3. Clicar no seletor e alternar tenant, validar mudanças de contexto (recarregar widgets).
- Critério: header exibe dados corretos; troca de tenant atualiza contexto sem erros.

### PAC-013: Frontend-Admin - Sidebar
- Objetivo: Validar itens de menu, níveis e responsividade.
- Pré-condições: frontend-admin ativo.
- Passos:
  1. Abrir sidebar em desktop e mobile viewport.
  2. Navegar por cada seção (Plugins, Billing, Tenants, Audit).
  3. Verificar acessibilidade (tab navigation) e collapsing em mobile.
- Critério: navegação funciona, rotas carregam e sem erros JS.

### PAC-014: Frontend-Admin - Plugin Manager
- Objetivo: Testar fluxo visual de instalação, habilitação e configuração de plugin.
- Pré-condições: usuário admin autenticado; backend `/api/admin/plugins` disponível.
- Passos:
  1. Acessar Plugin Manager.
  2. Instalar plugin de teste via UI; confirmar 201 e registro na lista.
  3. Habilitar/Desabilitar plugin e editar configuração; validar persistência.
- Critério: UI mostra estados corretos e operações retornam sucesso.

### PAC-015: Frontend-Admin - Tema Dark/Light
- Objetivo: Validar toggle, persistência e preferência do usuário.
- Pré-condições: frontend-admin ativo.
- Passos:
  1. Alternar tema e recarregar página.
  2. Verificar persistência no localStorage e no perfil do usuário (se aplicável).
- Critério: tema persistido e sem quebras visuais.

### PAC-016: Frontend-Admin - Página Auditoria
- Objetivo: Validar filtros, paginação e export da página de auditoria.
- Pré-condições: backend com API de auditoria e dados suficientes.
- Passos:
  1. Acessar página de auditoria, aplicar filtros (data, usuário, ação).
  2. Validar paginação e export CSV/JSON.
- Critério: filtros retornam apenas logs correspondentes e export contém mesmos dados.

### PAC-017: Frontend-App - Consulta Cadastral
- Objetivo: Fluxo E2E de consulta por CPF/CNPJ até exibição de resultado.
- Pré-condições: plugin Infosimples ativo e chave configurada.
- Passos:
  1. Inserir CPF/CNPJ válido e submeter.
  2. Verificar chamadas ao backend e exibição de dados.
- Critério: resultado exibido corretamente; erros apresentados quando dados inválidos.

### PAC-018: Frontend-App - Consulta Crédito
- Objetivo: Validar exibição de score e restrições.
- Pré-condições: backend agregador funcionando.
- Passos:
  1. Realizar consulta de crédito com usuário de teste.
  2. Verificar apresentação de score, histórico e recomendações.
- Critério: valores correspondem ao backend e UI sem erros.

### PAC-019: Frontend-App - Consulta Veicular
- Objetivo: Testar busca por placa e visualização dos dados veiculares.
- Pré-condições: plugin veicular configurado.
- Passos:
  1. Realizar busca por placa válida.
  2. Validar retorno e exibição de histórico, sinistros e restrições.
- Critério: dados corretos e sem erros no frontend.

### PAC-020: Frontend-App - Header
- Objetivo: Verificar consistência de navegação e autenticação no frontend-app.
- Pré-condições: usuário autenticado.
- Passos:
  1. Acessar header, verificar menus, saldo e atalhos.
  2. Navegar entre páginas principais.
- Critério: header apresenta informações corretas e links funcionam.

### PAC-021: Frontend-App - Sidebar
- Objetivo: Validar acessos e navegação por categoria.
- Pré-condições: frontend-app ativo.
- Passos:
  1. Abrir sidebar e acessar cada rota principal.
  2. Verificar responsividade e acessibilidade.
- Critério: rotas carregam sem erros e comportamento responsivo está correto.

### PAC-022: Frontend-App - Dashboard Usuário
- Objetivo: Validar cards de saldo, últimas consultas e atualizações automáticas.
- Pré-condições: dados de usuário e tenant disponíveis.
- Passos:
  1. Acessar dashboard e validar cards e widgets.
  2. Gerar evento (consulta) e verificar atualização em tempo ou via refresh.
- Critério: dados atualizados e consistentes.

### PAC-023: Frontend-App - Relatório Consultas
- Objetivo: Testar filtros, exportação e paginação do relatório de consultas.
- Pré-condições: histórico de consultas suficiente.
- Passos:
  1. Aplicar filtros por data, tipo e usuário.
  2. Exportar relatório e validar conteúdo.
- Critério: filtros e export refletem os mesmos dados mostrados na UI.

### PAC-024: Frontend-App - Compra Créditos
- Objetivo: Fluxo de compra de créditos até confirmação (integração Asaas simulada).
- Pré-condições: plugin de pagamento configurado com sandbox.
- Passos:
  1. Abrir compra de créditos, preencher valores e submeter pagamento.
  2. Simular callback e validar atualização do saldo.
- Critério: saldo atualizado e transação registrada.

### PAC-025: Frontend-App - Extrato Financeiro
- Objetivo: Verificar listagem de transações, filtros e export.
- Pré-condições: transações existentes.
- Passos:
  1. Acessar extrato, aplicar filtros e paginar.
  2. Exportar e validar arquivo.
- Critério: listagem e export coerentes.

### PAC-026: Frontend-App - Boletos e Faturas
- Objetivo: Testar geração, download e notificações de vencimento.
- Pré-condições: serviço de geração de boletos configurado.
- Passos:
  1. Gerar boleto para fatura de teste.
  2. Verificar opção de download e notificações de vencimento.
- Critério: boleto disponível para download e notificação disparada.

### PAC-027: Frontend-App - Aviso LGPD
- Objetivo: Validar exibição e aceitação de aviso de privacidade.
- Pré-condições: página LGPD disponível.
- Passos:
  1. Acessar página e aceitar aviso.
  2. Verificar persistência do consentimento.
- Critério: consentimento armazenado e aplicado.

### PAC-028: Frontend-Admin - Dashboard Administrativo
- Objetivo: Validar métricas e atualizações em tempo real/refresh.
- Pré-condições: dados agregados disponíveis.
- Passos:
  1. Acessar dashboard admin e validar principais métricas.
  2. Simular eventos e verificar atualização de métricas.
- Critério: métricas consistentes e atualizadas.

### PAC-029: Frontend-Admin - Gestão de Tenants
- Objetivo: Testar CRUD de tenants via UI.
- Pré-condições: usuário admin autenticado.
- Passos:
  1. Criar tenant, editar e deletar via UI.
  2. Validar isolamento de dados entre tenants.
- Critério: operações CRUD funcionam e isolamento é preservado.

### PAC-030: Infrastructure - Setup Appwrite
- Objetivo: Validar collections, permissões e conexões Appwrite.
- Pré-condições: Appwrite em container de teste.
- Passos:
  1. Verificar existência de collections (users, audits, plugins, billing).
  2. Testar criação/leitura/escrita com credenciais de teste.
- Critério: access control e operações básicas funcionando.

### PAC-031: Estratégia de Testes
- Objetivo: Validar pipeline de testes (unit → e2e) e coleta de cobertura.
- Pré-condições: CI configurado com runner de teste.
- Passos:
  1. Executar suíte de testes completa no CI (unit + e2e).
  2. Validar geração de relatórios e thresholds.
- Critério: job de CI retorna status verde e cobertura mínima atingida.

### PAC-032: Infrastructure - Docker Dev
- Objetivo: Validar docker-compose.dev para desenvolvimento colaborativo.
- Pré-condições: docker-compose.dev.yml presente.
- Passos:
  1. Subir stack dev e validar que backend e frontends sobem corretamente.
  2. Testar hot-reload do frontend.
- Critério: serviços sobem e hot-reload funciona.

### PAC-033: Infrastructure - Docker Prod
- Objetivo: Validar multi-stage builds e imagem otimizada.
- Pré-condições: Dockerfile.base e scripts de build.
- Passos:
  1. Rodar build de produção e inspecionar imagem.
  2. Testar container em ambiente staging.
- Critério: imagem menor, app funcional e variáveis de ambiente seguras.

### PAC-034: Infrastructure - Nginx Gateway
- Objetivo: Validar roteamento, HTTPS e rate-limiting.
- Pré-condições: nginx.conf e certificados de teste.
- Passos:
  1. Subir nginx em frente ao backend e frontends.
  2. Testar roteamento de domínios e regras de rate-limit.
- Critério: roteamento correto e políticas aplicadas.

### PAC-035: Infrastructure - Kubernetes
- Objetivo: Testar manifests e deployment com HPA.
- Pré-condições: cluster de teste (minikube/k3s).
- Passos:
  1. Aplicar manifests e validar pods/serviços.
  2. Testar escala automática sob carga sintética.
- Critério: deploys estáveis e HPA responde à carga.

### PAC-036: Health Checks
- Objetivo: Validar endpoints `/health` e readiness/liveness probes.
- Pré-condições: backend implementou endpoints de saúde.
- Passos:
  1. Chamar `/health` e `/ready` e verificar respostas.
  2. Simular falha (ex.: banco indisponível) e verificar probe.
- Critério: probes refletem corretamente a saúde do serviço.

### PAC-037: Logging Centralizado
- Objetivo: Testar fluxo de logs para sistema central (ELK/observability).
- Pré-condições: stack de logging (Elastic/Logstash/Kibana) ou alternativa.
- Passos:
  1. Gerar logs estruturados com correlation IDs.
  2. Verificar ingestão e busca no Kibana.
- Critério: logs pesquisáveis e correlação entre requests.

### PAC-038: Monitoramento
- Objetivo: Verificar métricas e dashboards (Prometheus/Grafana).
- Pré-condições: exporter e Prometheus configurados.
- Passos:
  1. Gerar métricas e verificar exposição em `/metrics`.
  2. Validar dashboards no Grafana com métricas coletadas.
- Critério: métricas visíveis e alertas configuráveis.

### PAC-039: CI/CD Pipeline
- Objetivo: Validar pipeline de build, testes e deploy.
- Pré-condições: Jobs no GitHub Actions (ou similar).
- Passos:
  1. Simular PR e validar execução de lint/build/test/e2e.
  2. Validar deploy em staging automático após merge.
- Critério: pipeline completa com checks e deploys.

### PAC-040: Testes E2E
- Objetivo: Implementar e validar suíte E2E completa.
- Pré-condições: ambiente de teste com dependências (Appwrite, filas).
- Passos:
  1. Executar todos os casos E2E gerados neste documento.
  2. Gerar relatórios e screenshots em falhas.
- Critério: suíte E2E executa com sucesso em CI; falhas documentadas e reproduzíveis.

---

Execução recomendada:
- Ferramenta: Cypress (frontend + API) ou Playwright (full-stack). Preferir Playwright para testes cross-browser e integração backend+frontend.
- Ambiente: criar um pipeline CI com um job `e2e` que sobe dependências (Appwrite, backend, frontends) via docker-compose.dev e executa testes. Use fixtures para dados e teardown entre execuções.

Modelo de comando local (exemplo com Playwright):
```
# Subir serviços de teste
docker-compose -f infrastructure/docker-compose.dev.yml up -d

# Executar E2E (Playwright)
npx playwright test --project=chromium
```

Observações:
- Para cada PAC, implemente um teste automatizado correspondente e armazene-os sob `e2e/` ou `tests/e2e/` com mapeamento para `Docs/e2e.md`.
- Priorizar PACs críticos: PAC-006 (auth), PAC-007 (billing), PAC-009 (audit), PAC-010 (admin plugins).
