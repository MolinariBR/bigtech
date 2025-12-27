#!/usr/bin/env node

// Script para criar coleção global_plugins no Appwrite
// Execute: node scripts/create-global-plugins-collection.js

import { Client, Databases } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'bigtech')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'bigtechdb';

async function createCollectionIfNotExists(collectionId, name, permissions = []) {
  try {
    // Verificar se a collection já existe
    await databases.getCollection(databaseId, collectionId);
    console.log(`✅ Collection '${collectionId}' já existe`);
  } catch (error) {
    if (error.code === 404) {
      // Criar collection
      await databases.createCollection(databaseId, collectionId, name, permissions);
      console.log(`✅ Collection '${collectionId}' criada`);
    } else {
      throw error;
    }
  }
}

async function createAttribute(collectionId, key, type, size = null, required = false, defaultValue = null) {
  try {
    // Verificar se o atributo já existe
    await databases.getAttribute(databaseId, collectionId, key);
    console.log(`✅ Atributo '${key}' já existe na collection '${collectionId}'`);
  } catch (error) {
    if (error.code === 404) {
      // Criar atributo
      switch (type) {
        case 'string':
          await databases.createStringAttribute(databaseId, collectionId, key, size || 255, required, defaultValue);
          break;
        case 'boolean':
          await databases.createBooleanAttribute(databaseId, collectionId, key, required, defaultValue);
          break;
        case 'datetime':
          await databases.createDatetimeAttribute(databaseId, collectionId, key, required, defaultValue);
          break;
        default:
          console.log(`⚠️ Tipo de atributo '${type}' não suportado`);
          return;
      }
      console.log(`✅ Atributo '${key}' criado na collection '${collectionId}'`);
    } else {
      throw error;
    }
  }
}

async function createGlobalPluginsCollection() {
  try {
    console.log('🚀 Criando coleção global_plugins...');

    // Collection: global_plugins
    await createCollectionIfNotExists('global_plugins', 'Global Plugins', []);

    // Atributos básicos
    await createAttribute('global_plugins', 'pluginId', 'string', 100, true);
    await createAttribute('global_plugins', 'type', 'string', 50, true);
    await createAttribute('global_plugins', 'version', 'string', 50, true);
    await createAttribute('global_plugins', 'status', 'string', 50, false, 'installed');

    // Configurações de API
    await createAttribute('global_plugins', 'config', 'string', 5000, false, '{}');

    // Controle de instalação
    await createAttribute('global_plugins', 'installedBy', 'string', 255, false);
    await createAttribute('global_plugins', 'installedAt', 'datetime', null, false);
    await createAttribute('global_plugins', 'updatedAt', 'datetime', null, false);

    // Preços por serviço (para plugins de consulta)
    await createAttribute('global_plugins', 'servicePrices', 'string', 2000, false, '{}');

    // Configurações de fallback
    await createAttribute('global_plugins', 'fallbackConfig', 'string', 2000, false, '{}');

    // Rate limiting
    await createAttribute('global_plugins', 'rateLimitConfig', 'string', 1000, false, '{}');

    console.log('✅ Coleção global_plugins configurada com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar coleção global_plugins:', error);
    process.exit(1);
  }
}

createGlobalPluginsCollection();