 # Mapeamento de Testes Unitários (PAC-001 .. PAC-040)

Este documento lista os alvos de testes unitários para cada PAC (001..040), com o arquivo de teste sugerido e os principais casos a cobrir. Siga a precedência documental antes de implementar (veja `Docs/1.Project.md` → `Docs/2.Architecture.md` → `Docs/4.Entities.md`).

Formato: PAC, Objetivo breve, Arquivo(s) de teste sugerido(s), Casos principais.

PAC-001 — Autenticação básica
- Arquivo: `backend/tests/auth.basic.test.ts`
- Casos: token válido, token expirado, token mal formado, ausência de token, cabeçalho `X-Tenant-ID` ausente.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-002 — Registro de usuário
- Arquivo: `backend/tests/auth.register.test.ts`
- Casos: validação de payload, duplicidade de e-mail, criação no Appwrite (usar instância de teste ou test-double explícito), resposta 201/4xx.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.


PAC-003 — Login (credenciais)
- Arquivo: `backend/tests/auth.login.test.ts`
- Casos: credenciais válidas, inválidas, bloqueio após N tentativas, emissão de JWT.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-004 — Refresh Token (core)
- Arquivo: `backend/tests/auth.refresh.test.ts`
- Casos: refresh válido (cookie HttpOnly), refresh inválido/expirado, revogação de refresh token.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-005 — Logout / Revogação
- Arquivo: `backend/tests/auth.logout.test.ts`
- Casos: revogar refresh token, limpar cookie, tentativas pós-revogação.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-006 — Autenticação - Core (fluxo completo)
- Arquivo: `backend/tests/auth.flow.test.ts`
- Casos: login → acessar rota protegida → refresh automático → logout.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-007 — Billing Engine
- Arquivo: `backend/tests/billing.test.ts`
- Casos: normalização monetária (2 decimais), cálculo por uso, descontos, impostos, arredondamento, concorrência simulada (locks) e limites.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-008 — Event Bus
- Arquivo: `backend/tests/eventBus.test.ts`
- Casos: subscribe/publish, múltiplos subscribers, unsubscribe, ordering, `waitForEvent`, comportamento em falha de handler.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-009 — Audit Logger
- Arquivo: `backend/tests/audit_logger.test.ts`
- Casos: inicialização sem coleção (skip), `log()` ignora falhas, `getLogs()` com filtros (`userId`, `action`, intervalos), paginação/`limit`.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-010 — Admin Plugins (endpoints)
- Arquivo: `backend/tests/admin_plugins.test.ts`
- Casos: listagem, instalação, instalação conflitante (409), habilitar/desabilitar, atualização de config, validação de `tenantId`.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-011 — Plugins: Execução segura
- Arquivo: `backend/tests/plugin_execution.test.ts`
- Casos: execução isolada por tenant, tempo limite, captura de erro do plugin, sanitização de outputs.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-012 — Integridade de dados (migrations)
- Arquivo: `backend/tests/migrations.test.ts`
- Casos: scripts de migração idempotentes, detecção de estado já migrado, mensagens de erro claras.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-013 — Multi-tenant isolation
- Arquivo: `backend/tests/multiTenant.test.ts`
- Casos: isolamento de dados entre tenants, cabeçalhos `X-Tenant-ID`, escopo de recursos e tokens.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-014 — API Rate Limiting
- Arquivo: `backend/tests/rateLimit.test.ts`
- Casos: limites por tenant/user, reset de janela, respostas 429 e cabeçalhos `Retry-After`.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-015 — Billing jobs (cron/workers)
- Arquivo: `backend/tests/billing.jobs.test.ts`
- Casos: job idempotente, reexecução segura, erro parcial e retry.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-016 — Storage (S3/Appwrite storage)
- Arquivo: `backend/tests/storage.test.ts`
- Casos: upload/download, permissões, links temporários, erros de rede simulados.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-017 — File upload validation
- Arquivo: `backend/tests/upload.validation.test.ts`
- Casos: tipos permitidos, tamanho máximo, conteúdo proibido.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-018 — Notifications (email/HTTP)
- Arquivo: `backend/tests/notifications.test.ts`
- Casos: template rendering, fallback em falhas, retries para webhooks.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-019 — Billing reporting/aggregation
- Arquivo: `backend/tests/billing.aggregate.test.ts`
- Casos: agregação ISO-week, soma por tenant, edge cases com zeros e grandes volumes.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-020 — Auth isolation per tenant
- Arquivo: `backend/tests/auth.isolation.test.ts`
- Casos: tokens não válidos para outro tenant, sessão cruzada negada.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-021 — PluginLoader (carregamento)
- Arquivo: `backend/tests/plugin_loader.test.ts`
- Casos: descoberta de plugins, validação de schema, erro ao carregar e fallback seguro.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-022 — Billing edge cases (currency)
- Arquivo: `backend/tests/billing.currency.test.ts`
- Casos: operações com moedas diferentes (normalização), conversão e arredondamento.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-023 — Admin APIs - Auth + RBAC
- Arquivo: `backend/tests/admin_auth.test.ts`
- Casos: rotas admin protegidas, roles, tentativas sem permissão.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-024 — Audit exports (CSV/JSON)
- Arquivo: `backend/tests/audit.export.test.ts`
- Casos: geração de CSV/JSON, filtros aplicados corretamente, tamanho/pagination para export.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-025 — Healthchecks e readiness
- Arquivo: `backend/tests/health.test.ts`
- Casos: `healthCheck()` do Appwrite, dependências simuladas down/up e status aggregate.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-026 — Billing property tests (propriedades)
- Arquivo: `backend/tests/billing.property.test.ts`
- Casos: invariantes (sum of parts == total), testes property-based para entradas aleatórias.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-027 — Event Bus durable adapter (test-double)
- Arquivo: `backend/tests/eventBus.adapter.test.ts`
- Casos: pluggable adapter interface, fallback in-memory → mock adapter de teste ou adapter de integração leve, ack/nack behavior.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-028 — Audit retention & purge job
- Arquivo: `backend/tests/audit.purge.test.ts`
- Casos: retenção aplicada, purge idempotente, simulação de failsafe.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-029 — Billing external integrations
- Arquivo: `backend/tests/billing.gateway.test.ts`
- Casos: integração com gateway de pagamento (usar test-double ou sandbox do provedor), resposta de sucesso/falha e retries.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-030 — API contracts (OpenAPI validations)
- Arquivo: `backend/tests/openapi.contract.test.ts`
- Casos: respostas conformes ao `openapi-infosimples-*.json`, parâmetros obrigatórios e códigos HTTP.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-031 — Webhooks receiver
- Arquivo: `backend/tests/webhooks.test.ts`
- Casos: assinatura/verificação, idempotência, entrega a consumidores internos.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-032 — Metrics e instrumentação
- Arquivo: `backend/tests/metrics.test.ts`
- Casos: contadores incrementados, histogramas atualizados, labels por tenant.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-033 — Tenant provisioning
- Arquivo: `backend/tests/tenant.provision.test.ts`
- Casos: criação inicial de tenant, recursos associados criados, rollback em falha.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-034 — Admin audit trails
- Arquivo: `backend/tests/admin_audit.test.ts`
- Casos: ações admin gravadas, leitura com filtros, export e autorização.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-035 — Backup/restore basics
- Arquivo: `backend/tests/backup.test.ts`
- Casos: gerar snapshot, restaurar, validar integridade mínima pós-restore.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-036 — Security: input sanitization
- Arquivo: `backend/tests/security.sanitize.test.ts`
- Casos: XSS/SQLi-like payloads contrabalanceados, validação de inputs e escapes.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-037 — Pagination helpers
- Arquivo: `backend/tests/pagination.test.ts`
- Casos: offset/limit, cursor-based, ordenação estável, limites máximos.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-038 — Rate-limit on billing endpoints
- Arquivo: `backend/tests/billing.rateLimit.test.ts`
- Casos: proteções contra abusers, limites por endpoint e mensagens claras.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-039 — Feature flags toggles
- Arquivo: `backend/tests/featureflags.test.ts`
- Casos: ativar/desativar por tenant, rollout gradual e fallback.
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

PAC-040 — CI smoke/unit integration
- Arquivo: `backend/tests/ci.smoke.test.ts`
- Casos: suite rápida para CI que valida endpoints críticos e test-doubles/fixtures básicos (rápido e estável).
- Analise: Compare teste com implementação, caso erro seja do teste, corrija o teste, caso seja da implementação, corrija a implementação.

Observações de implementação
- Evitar mocks globais: prefira usar uma instância de Appwrite de teste (container/local) ou test-doubles explícitos criados por helpers compartilhados. Não use `jest.mock()` global que cria instâncias separadas do singleton do runtime.
- Para chamadas a serviços externos, prefira sandboxes ou doubles configurados em `tests/__helpers__/` (ex.: `appwrite-test-instance.ts`, `payment-sandbox.ts`). Isso garante que o código sob teste e os helpers compartilhem o mesmo objeto/instância reutilizável.
- Coloque skeletons em `backend/tests/unit/` e nomeie os arquivos conforme sugerido. Comece com casos happy-path e depois adicione testes de falha.
- Use `jest` e helpers de test-doubles centralizados (`tests/__helpers__/`) quando conveniente; documente claramente quando um teste usa uma instância real de teste vs. um double.

Quer que eu gere automaticamente os skeletons de arquivos de teste em `backend/tests/unit/` para os 40 PACs agora?
