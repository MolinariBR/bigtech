#!/usr/bin/env node

// Script para remover plugins mockados do Appwrite
// Execute: node scripts/remove-mock-plugins.js

import { Client, Databases, Query } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'bigtech')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'bigtechdb';

async function removeMockPlugins() {
  try {
    console.log('🚀 Removendo plugins mockados...');

    // Buscar todos os plugins que não são do tipo 'consulta'
    const plugins = await databases.listDocuments(databaseId, 'plugins', [
      Query.notEqual('type', 'consulta')
    ]);

    console.log(`Encontrados ${plugins.documents.length} plugins mockados para remover`);

    for (const plugin of plugins.documents) {
      await databases.deleteDocument(databaseId, 'plugins', plugin.$id);
      console.log(`✅ Plugin '${plugin.name}' removido`);
    }

    console.log('🎉 Plugins mockados removidos com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao remover plugins mockados:', error);
    process.exit(1);
  }
}

removeMockPlugins();