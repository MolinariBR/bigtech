// Script de migração: adiciona atributo `refreshToken` à collection `users` no Appwrite
// Uso: ajustar variáveis de ambiente APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY

import { Client, Databases } from 'node-appwrite';

async function run() {
  const endpoint = process.env.APPWRITE_ENDPOINT || 'http://localhost/v1';
  const project = process.env.APPWRITE_PROJECT_ID || 'bigtech';
  const key = process.env.APPWRITE_API_KEY || '';
  const databaseId = process.env.APPWRITE_DATABASE_ID || 'bigtechdb';
  const collectionId = 'users';

  if (!key) {
    console.error('ERROR: APPWRITE_API_KEY is required');
    process.exit(1);
  }

  const client = new Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const databases = new Databases(client);

  try {
    console.log('Verificando collection', collectionId);
    // Tentar criar um atributo do tipo string opcional (text)
    // Appwrite attribute creation: createStringAttribute(databaseId, collectionId, key, size, required, x)
    // SDK: createStringAttribute(databaseId, collectionId, key, size, required)
    await databases.createStringAttribute(databaseId, collectionId, 'refreshToken', 1024, false);
    console.log('Atributo `refreshToken` criado com sucesso (string, opcional).');
  } catch (err: any) {
    if (err?.response && typeof err.response === 'string' && err.response.includes('attribute_already_exists')) {
      console.log('Atributo `refreshToken` já existe — nada a fazer.');
    } else {
      console.error('Falha ao criar atributo `refreshToken`:', err);
      process.exit(2);
    }
  }
}

run().catch((e) => {
  console.error('Erro inesperado:', e);
  process.exit(3);
});
