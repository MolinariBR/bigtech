#!/usr/bin/env node

// Script para criar plugins de exemplo no Appwrite
// Execute: node scripts/create-sample-plugins.js

import { Client, Databases, ID } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'bigtech')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'bigtechdb';

async function createSamplePlugins() {
  try {
    console.log('🚀 Criando plugins de exemplo...');

    const plugins = [
      {
        tenantId: 'global', // Plugins globais disponíveis para todos os tenants
        type: 'consulta',
        name: 'Consulta Cadastral',
        version: '1.0.0',
        status: 'enabled',
        config: JSON.stringify({
          costPerQuery: 1,
          apiKey: 'sample-key',
          fallbackSources: ['serasa', 'boavista']
        }),
        dependencies: JSON.stringify([])
      },
      {
        tenantId: 'global',
        type: 'consulta',
        name: 'Consulta de Crédito',
        version: '1.0.0',
        status: 'enabled',
        config: JSON.stringify({
          costPerQuery: 2,
          apiKey: 'sample-key',
          fallbackSources: ['serasa', 'equifax']
        }),
        dependencies: JSON.stringify([])
      },
      {
        tenantId: 'global',
        type: 'consulta',
        name: 'Consulta Veicular',
        version: '1.0.0',
        status: 'enabled',
        config: JSON.stringify({
          costPerQuery: 1.5,
          apiKey: 'sample-key',
          fallbackSources: ['denatran', 'detran']
        }),
        dependencies: JSON.stringify([])
      }
    ];

    for (const plugin of plugins) {
      const pluginId = ID.unique();
      await databases.createDocument(databaseId, 'plugins', pluginId, plugin);
      console.log(`✅ Plugin '${plugin.name}' criado com ID: ${pluginId}`);
    }

    console.log('🎉 Plugins de exemplo criados com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar plugins de exemplo:', error);
    process.exit(1);
  }
}

createSamplePlugins();