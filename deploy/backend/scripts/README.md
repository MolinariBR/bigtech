Migração Appwrite: adicionar atributo `refreshToken`

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
