# E2E: Orquestração de containers para testes

Este arquivo descreve scripts npm adicionados para subir a stack de desenvolvimento e executar testes E2E.

Scripts adicionados no `package.json` da raiz:

- `npm run e2e:up`  — Sobe Appwrite e a stack de desenvolvimento (frontends + backend) em background.
- `npm run e2e:down` — Derruba os stacks levantados.
- `npm run e2e:test` — Executa os testes do `backend` e do `frontend-app` (falhas no frontend não abortam o script).
- `npm run e2e:run`  — Faz `e2e:up`, espera 8s, executa `e2e:test`, e depois `e2e:down`.

Como usar:

1. Subir a stack (em background):

```bash
npm run e2e:up
```

2. Rodar testes (local):

```bash
npm run e2e:test
```

3. Subir, rodar e derrubar automaticamente:

```bash
npm run e2e:run
```

Requisitos:
- Docker e Docker Compose disponíveis na máquina.
- Variáveis de ambiente necessárias para Appwrite definidas (ver `appwrite/docker-compose.yml`).

Observações:
- Os testes unitários de infra (`infrastructure/tests/container-isolation.test.ts`) usam um mock do Docker Compose. Para testes E2E reais recomendamos usar `testcontainers` ou rodar os `docker compose` acima, conforme o script.
- Ajustes adicionais podem ser feitos para rodar apenas um subconjunto de testes ou para integrar com CI.
