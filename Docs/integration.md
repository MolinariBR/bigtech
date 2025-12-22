# Testes de Integração mapeados por PAC

Este documento descreve cenários de testes de integração (integration tests) para cada PAC. Os testes de integração verificam a interação entre componentes (backend, Appwrite, frontends, filas, jobs) e são projetados para rodar em um ambiente de teste (docker-compose.dev) ou em CI com dependências simuladas.
```markdown
# Testes de Integração (PAC-001 .. PAC-040)

Este documento mapeia cenários de testes de integração para todos os PACs (001..040). Cada item inclui objetivo, arquivo(s) de teste sugerido(s) e passos principais.

Regras: execute a cadeia documental antes de implementar (1.Project → 2.Architecture → 6.UserStories → 7.Tasks). Use `docker-compose.dev.yml` para iniciar dependências quando necessário.

Formato sugerido por caso: Objetivo curto, Arquivo de teste recomendado (`backend/tests/integration/*.test.ts`), Pré-condições, Passos de integração, Critério de aceitação.

PAC-001 — Autenticação básica (integração)
- Arquivo: `backend/tests/integration/auth.basic.integration.test.ts`
- Pré-condições: Appwrite em docker-compose, variáveis de ambiente de teste
- Passos: criar usuário via API → login → acessar rota protegida → validar resposta 200
- ACE: fluxo completo com tokens válidos e cabeçalho `X-Tenant-ID` funciona.

PAC-002 — Registro de usuário (integração)
- Arquivo: `backend/tests/integration/auth.register.integration.test.ts`
- Pré-condições: Appwrite mock/instância
- Passos: POST /auth/register → verificar usuário criado no DB → cleanup
- ACE: código 201 e documento no Appwrite.

PAC-003 — Login e sessão (integração)
- Arquivo: `backend/tests/integration/auth.login.integration.test.ts`
- Pré-condições: usuário existente
- Passos: login → acessar rota protegida com token → refresh via cookie → logout
- ACE: tokens rotacionam e rota protegida aceita novo token.

PAC-004 — Refresh Token (E2E/integração do core)
- Arquivo: `backend/tests/integration/auth.refresh.integration.test.ts`
- Pré-condições: cookie HttpOnly configurado no cliente de teste
- Passos: simular expiração do access token → chamar `/auth/refresh` → verificar novo access token
- ACE: refresh retorna novo access token e o anterior é inválido.

PAC-005 — Logout e revogação (integração)
- Arquivo: `backend/tests/integration/auth.logout.integration.test.ts`
- Passos: login → logout → tentativa de uso do token anterior → 401

PAC-006 — Fluxo completo de autenticação (smoke)
- Arquivo: `backend/tests/integration/auth.flow.integration.test.ts`
- Passos: cenário end-to-end cobrindo login, acesso, refresh e logout.

PAC-007 — Billing Engine (integração)
- Arquivo: `backend/tests/integration/billing.integration.test.ts`
- Pré-condições: base de dados com transações de exemplo
- Passos: disparar job de faturamento → verificar registros de fatura e saldos → validar idempotência ao re-executar
- ACE: resultados coerentes com regras de negócio.

PAC-008 — Event Bus (integração)
- Arquivo: `backend/tests/integration/eventBus.integration.test.ts`
- Pré-condições: worker/processo que consome events ou mock adapter durável
- Passos: publicar evento → verificar consumo por subscriber → validar retry em falha
- ACE: evento entregue e processado; retries ocorrem conforme política.

PAC-009 — Audit Logger (integração)
- Arquivo: `backend/tests/integration/audit.integration.test.ts`
- Passos: executar ações que geram audit → chamar API de listagem → validar filtros e paginação
- ACE: logs persistem e filtros retornam resultados esperados.

PAC-010 — Admin Plugins (integração)
- Arquivo: `backend/tests/integration/admin_plugins.integration.test.ts`
- Passos: endpoint admin autentica → instalar plugin → listar plugins → atualizar config → desinstalar
- ACE: ciclo CRUD funciona com estados consistentes.

PAC-011 — Execução de plugins (integração)
- Arquivo: `backend/tests/integration/plugin_execution.integration.test.ts`
- Passos: instalar plugin de teste → executar plugin via endpoint público → validar saída e logs

PAC-012 — Migrations (integração)
- Arquivo: `backend/tests/integration/migrations.integration.test.ts`
- Passos: aplicar migração de teste em base limpa → validar schema/artefatos esperados → reaplicar para checar idempotência

PAC-013 — Multi-tenant isolation (integração)
- Arquivo: `backend/tests/integration/multiTenant.integration.test.ts`
- Passos: criar recursos sob tenant A e tenant B → validar que não há vazamento entre eles

PAC-014 — Rate limiting (integração)
- Arquivo: `backend/tests/integration/rateLimit.integration.test.ts`
- Passos: disparar N requisições → esperar 429 depois do limite → validar headers `Retry-After`

PAC-015 — Billing jobs (workers) (integração)
- Arquivo: `backend/tests/integration/billing.jobs.integration.test.ts`
- Passos: enfileirar jobs → rodar worker → validar estados/processamento e retries

PAC-016 — Storage e uploads (integração)
- Arquivo: `backend/tests/integration/storage.integration.test.ts`
- Passos: upload arquivo → recuperar via link assinado → deletar → validar permissões

PAC-017 — Upload validation (integração)
- Arquivo: `backend/tests/integration/upload.validation.integration.test.ts`

PAC-018 — Notifications (integração)
- Arquivo: `backend/tests/integration/notifications.integration.test.ts`
- Passos: enviar notificação → verificar entrega (mock endpoints) e retries

PAC-019 — Relatórios de billing (integração)
- Arquivo: `backend/tests/integration/billing.reporting.integration.test.ts`
- Passos: gerar relatórios por ISO-week → validar números com dados de origem

PAC-020 — Auth isolation por tenant (integração)
- Arquivo: `backend/tests/integration/auth.isolation.integration.test.ts`

PAC-021 — PluginLoader + storage real (integração)
- Arquivo: `backend/tests/integration/plugin_loader.integration.test.ts`

PAC-022 — Billing - moedas e conversões (integração)
- Arquivo: `backend/tests/integration/billing.currency.integration.test.ts`

PAC-023 — Admin RBAC (integração)
- Arquivo: `backend/tests/integration/admin_auth.integration.test.ts`

PAC-024 — Audit export (integração)
- Arquivo: `backend/tests/integration/audit.export.integration.test.ts`

PAC-025 — Healthchecks end-to-end
- Arquivo: `backend/tests/integration/health.integration.test.ts`
- Passos: derrubar um serviço dependente → validar `health` reflete alteração

PAC-026 — Billing property-based integration
- Arquivo: `backend/tests/integration/billing.property.integration.test.ts`

PAC-027 — Event Bus durable adapter (integração)
- Arquivo: `backend/tests/integration/eventBus.adapter.integration.test.ts`

PAC-028 — Audit purge/retention (integração)
- Arquivo: `backend/tests/integration/audit.purge.integration.test.ts`

PAC-029 — Billing gateway (integração)
- Arquivo: `backend/tests/integration/billing.gateway.integration.test.ts`

PAC-030 — OpenAPI contract tests (integração)
- Arquivo: `backend/tests/integration/openapi.contract.integration.test.ts`
- Passos: validar respostas com `openapi-infosimples-*.json`

PAC-031 — Webhooks end-to-end
- Arquivo: `backend/tests/integration/webhooks.integration.test.ts`

PAC-032 — Metrics e ingestão (integração)
- Arquivo: `backend/tests/integration/metrics.integration.test.ts`

PAC-033 — Tenant provisioning (integração)
- Arquivo: `backend/tests/integration/tenant.provision.integration.test.ts`

PAC-034 — Admin audit trails (integração)
- Arquivo: `backend/tests/integration/admin_audit.integration.test.ts`

PAC-035 — Backup/restore (integração)
- Arquivo: `backend/tests/integration/backup.integration.test.ts`

PAC-036 — Security end-to-end (sanitization)
- Arquivo: `backend/tests/integration/security.sanitize.integration.test.ts`

PAC-037 — Pagination end-to-end
- Arquivo: `backend/tests/integration/pagination.integration.test.ts`

PAC-038 — Rate-limit em endpoints de billing (integração)
- Arquivo: `backend/tests/integration/billing.rateLimit.integration.test.ts`

PAC-039 — Feature flags rollout (integração)
- Arquivo: `backend/tests/integration/featureflags.integration.test.ts`

PAC-040 — CI smoke integration
- Arquivo: `backend/tests/integration/ci.smoke.integration.test.ts`
- Passos: rodar um conjunto pequeno de cenários críticos para validar ambiente de staging/CI.

Execução e dicas
- Para integração local, use o compose de desenvolvimento: `infrastructure/docker/docker-compose.dev.yml` ou `appwrite/docker-compose.yml` (conforme projeto).
- Scripts sugeridos no `package.json` do backend:

```bash
npm --prefix backend run test:integration
# ou rodar arquivo específico
npm --prefix backend test -- tests/integration/auth.flow.integration.test.ts
```

- Comece gerando skeletons em `backend/tests/integration/` para os PACs prioritários (`PAC-006`, `PAC-007`, `PAC-009`, `PAC-010`) e então amplie.

Deseja que eu gere agora os arquivos skeleton de integração para os 40 PACs em `backend/tests/integration/`? 
```
