#!/usr/bin/env node

// Script para analisar o estado atual do Appwrite
// Execute: node scripts/analyze-appwrite.js

import { Client, Databases } from 'node-appwrite';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis do backend/.env
config({ path: join(__dirname, '..', 'backend', '.env') });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'bigtech')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'bigtechdb';

async function analyzeAppwrite() {
  try {
    console.log('🔍 Analisando estado do Appwrite...\n');

    // Verificar conexão
    console.log('📡 Verificando conexão...');
    try {
      const health = await databases.listCollections(databaseId);
      console.log('✅ Conexão estabelecida com Appwrite');
    } catch (error) {
      console.log('❌ Erro de conexão:', error.message);
      console.log('💡 Verifique se o Appwrite está rodando e as credenciais estão corretas');
      return;
    }

    // Verificar database
    console.log('\n📊 Verificando database...');
    try {
      const dbInfo = await databases.get(databaseId);
      console.log(`✅ Database '${databaseId}' existe: ${dbInfo.name}`);
    } catch (error) {
      if (error.code === 404) {
        console.log(`❌ Database '${databaseId}' não existe`);
      } else {
        console.log('❌ Erro ao verificar database:', error.message);
      }
    }

    // Listar collections existentes
    console.log('\n📋 Listando collections existentes...');
    try {
      const collections = await databases.listCollections(databaseId);
      console.log(`📊 Encontradas ${collections.collections.length} collections:`);

      for (const collection of collections.collections) {
        console.log(`  - ${collection.$id}: ${collection.name}`);

        // Verificar atributos da collection
        try {
          const attributes = await databases.listAttributes(databaseId, collection.$id);
          if (attributes.attributes.length > 0) {
            console.log(`    Atributos (${attributes.attributes.length}):`);
            for (const attr of attributes.attributes) {
              console.log(`      - ${attr.key}: ${attr.type}${attr.size ? `(${attr.size})` : ''}${attr.required ? ' [required]' : ''}`);
            }
          } else {
            console.log('    Nenhum atributo definido');
          }
        } catch (error) {
          console.log(`    ❌ Erro ao listar atributos: ${error.message}`);
        }

        // Verificar documentos na collection
        try {
          const documents = await databases.listDocuments(databaseId, collection.$id);
          console.log(`    Documentos: ${documents.documents.length}`);
        } catch (error) {
          console.log(`    ❌ Erro ao contar documentos: ${error.message}`);
        }

        console.log('');
      }
    } catch (error) {
      console.log('❌ Erro ao listar collections:', error.message);
    }

    // Verificar collections necessárias
    console.log('🔧 Verificando collections necessárias para o projeto...\n');

    const requiredCollections = ['tenants', 'audits', 'plugins'];
    const existingCollections = [];

    try {
      const collections = await databases.listCollections(databaseId);
      existingCollections.push(...collections.collections.map(c => c.$id));
    } catch (error) {
      console.log('❌ Não foi possível verificar collections existentes');
    }

    console.log('📋 Status das collections necessárias:');
    for (const collectionId of requiredCollections) {
      const exists = existingCollections.includes(collectionId);
      console.log(`  - ${collectionId}: ${exists ? '✅ Existe' : '❌ Não existe'}`);
    }

    // Verificar API Key permissions
    console.log('\n🔑 Verificando permissões da API Key...');
    try {
      // Tentar criar uma collection temporária para teste
      const testCollectionId = 'test_permissions_' + Date.now();
      await databases.createCollection(databaseId, testCollectionId, 'Test Collection');

      // Se chegou aqui, tem permissões
      console.log('✅ API Key tem permissões administrativas');

      // Limpar collection de teste
      await databases.deleteCollection(databaseId, testCollectionId);
      console.log('🧹 Collection de teste removida');

    } catch (error) {
      if (error.code === 401) {
        console.log('❌ API Key não tem permissões suficientes');
        console.log('💡 Crie uma API Key com escopo "databases.*" no console do Appwrite');
      } else {
        console.log('⚠️ Não foi possível verificar permissões:', error.message);
      }
    }

    console.log('\n🎯 Análise concluída!');

  } catch (error) {
    console.error('❌ Erro geral na análise:', error);
    process.exit(1);
  }
}

analyzeAppwrite();