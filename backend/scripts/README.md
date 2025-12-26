Scripts de Migração e Utilitários do Backend

## Migração para Classificação de Usuários (v1.4.0)

Script: `migrate-to-user-types.ts`

Remove o conceito de tenants e classifica usuários diretamente como 'empresa' ou 'usuario_final'.

**Uso:**

1. Exporte variáveis de ambiente:

```bash
export APPWRITE_ENDPOINT=http://localhost/v1
export APPWRITE_PROJECT_ID=bigtech
export APPWRITE_API_KEY=your-admin-api-key
export APPWRITE_DATABASE_ID=bigtechdb
```

2. Execute o script:

```bash
cd backend
npx ts-node scripts/migrate-to-user-types.ts
```

**O que o script faz:**
- Migra usuários: remove `tenantId`, adiciona `type` ('empresa' se role era 'admin', senão 'usuario_final')
- Remove todos os tenants
- NOTA: Campos `tenantId` permanecem nos documentos existentes (consultas, billing, audit) para compatibilidade. Em produção, considere recriar collections sem esses campos.

---

## Migração Appwrite: adicionar atributo `refreshToken`

Script: `add-refresh-token-attribute.ts`

Uso rápido:

1. Exporte variáveis de ambiente com credenciais do Appwrite:

```bash
export APPWRITE_ENDPOINT=http://localhost/v1
export APPWRITE_PROJECT_ID=bigtech
export APPWRITE_API_KEY=your-admin-api-key
export APPWRITE_DATABASE_ID=bigtechdb
```

2. Execute o script (precisa de Node.js):

```bash
cd backend
npx ts-node scripts/add-refresh-token-attribute.ts
```

O script tentará criar um atributo string chamado `refreshToken` na collection `users`. Se o atributo já existir, nada será alterado.

Observação: este script usa privilégios administrativos (API key). Execute apenas em ambientes controlados (local/CI) e preferencialmente na janela de manutenção.

---

## Limpeza de Tenants de Teste

Script: `clean-test-tenants.ts`

Remove tenants de teste (nomes começando com 't') e opcionalmente limpa audits.

Uso:

```bash
export APPWRITE_ENDPOINT=http://localhost/v1
export APPWRITE_PROJECT_ID=bigtech
export APPWRITE_API_KEY=your-admin-api-key
export APPWRITE_DATABASE_ID=bigtechdb
# Opcional: export CLEAN_ALL=1 para limpar todos os tenants

cd backend
npx ts-node scripts/clean-test-tenants.ts
```
