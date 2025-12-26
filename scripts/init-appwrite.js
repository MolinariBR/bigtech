#!/usr/bin/env node

// Script para inicializar collections no Appwrite
// Execute: node scripts/init-appwrite.js

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

async function initAppwrite() {
  try {
    console.log('🚀 Inicializando Appwrite collections...');

    // Criar database se não existir
    try {
      await databases.get(databaseId);
      console.log(`✅ Database '${databaseId}' já existe`);
    } catch (error) {
      if (error.code === 404) {
        await databases.create(databaseId, 'BigTech Database');
        console.log(`✅ Database '${databaseId}' criado`);
      } else {
        throw error;
      }
    }

    // Collection: tenants
    await createCollectionIfNotExists('tenants', 'Tenants', []);

    await createAttribute('tenants', 'name', 'string', 255, true);
    await createAttribute('tenants', 'status', 'string', 50, false, 'active');
    await createAttribute('tenants', 'plugins', 'string', 1000, false, '[]');

    // Collection: audits
    await createCollectionIfNotExists('audits', 'Audit Logs', []);

    await createAttribute('audits', 'tenantId', 'string', 255, true);
    await createAttribute('audits', 'userId', 'string', 255, false);
    await createAttribute('audits', 'action', 'string', 50, true);
    await createAttribute('audits', 'resource', 'string', 100, true);
    await createAttribute('audits', 'details', 'string', 2000, true);
    await createAttribute('audits', 'ipAddress', 'string', 45, true);
    await createAttribute('audits', 'timestamp', 'datetime', null, true);

    // Collection: users
    await createCollectionIfNotExists('users', 'Users', []);

    await createAttribute('users', 'tenantId', 'string', 255, true);
    await createAttribute('users', 'identifier', 'string', 20, true);
    await createAttribute('users', 'type', 'string', 50, false, 'user');
    await createAttribute('users', 'email', 'string', 255, false);
    await createAttribute('users', 'phone', 'string', 20, false);
    await createAttribute('users', 'preferences', 'string', 2048, false);
    await createAttribute('users', 'role', 'string', 50, false, 'viewer');
    await createAttribute('users', 'status', 'string', 50, false, 'active');
    await createAttribute('users', 'credits', 'string', 50, false, '0');
    await createAttribute('users', 'refreshToken', 'string', 500, false);
    await createAttribute('users', 'allowedPlugins', 'string', 1000, false, '[]');

    // Collection: admins
    await createCollectionIfNotExists('admins', 'Admins', []);

    await createAttribute('admins', 'email', 'string', 255, true);
    await createAttribute('admins', 'accountId', 'string', 255, true);
    await createAttribute('admins', 'identifier', 'string', 20, false);
    await createAttribute('admins', 'type', 'string', 50, false, 'admin');
    await createAttribute('admins', 'role', 'string', 50, false, 'admin');
    await createAttribute('admins', 'status', 'string', 50, false, 'active');
    await createAttribute('admins', 'credits', 'string', 50, false, '0');
    await createAttribute('admins', 'createdAt', 'datetime', null, true);
    await createAttribute('admins', 'updatedAt', 'datetime', null, true);

    // Collection: plugins
    await createCollectionIfNotExists('plugins', 'Plugins', []);

    await createAttribute('plugins', 'tenantId', 'string', 255, true);
    await createAttribute('plugins', 'type', 'string', 50, true);
    await createAttribute('plugins', 'name', 'string', 255, true);
    await createAttribute('plugins', 'version', 'string', 50, true);
    await createAttribute('plugins', 'status', 'string', 50, false, 'enabled');
    await createAttribute('plugins', 'config', 'string', 2000, false, '{}');
    await createAttribute('plugins', 'dependencies', 'string', 1000, false, '[]');

    // Collection: consultas

  } catch (error) {
    console.error('❌ Erro ao inicializar Appwrite:', error);
    process.exit(1);
  }
}

initAppwrite();