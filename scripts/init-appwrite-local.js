#!/usr/bin/env node

// Script para inicializar o projeto Appwrite local
// Execute: node scripts/init-appwrite-local.js

import { Client, Databases } from 'appwrite';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis do appwrite-local/.env
config({ path: join(__dirname, '..', 'appwrite-local', '.env') });

const endpoint = 'http://localhost/v1';
const masterKey = process.env._APP_API_KEY_MASTER || 'master-key-for-dev-only';

const client = new Client()
  .setEndpoint(endpoint);

const databases = new Databases(client);

async function initAppwriteLocal() {
  try {
    console.log('🚀 Inicializando Appwrite local...\n');

    // Verificar conexão com master key
    console.log('📡 Verificando conexão com master key...');
    try {
      const response = await fetch(`${endpoint}/health`, {
        headers: {
          'X-Appwrite-Key': masterKey,
          'X-Appwrite-Mode': 'admin'
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      console.log('✅ Conexão estabelecida com Appwrite');
    } catch (error) {
      console.log('❌ Erro de conexão:', error.message);
      console.log('💡 Verifique se o Appwrite está rodando');
      return;
    }

    // Criar projeto
    const projectId = 'bigtech';
    const projectName = 'BigTech Project';

    console.log(`📁 Criando projeto '${projectId}'...`);
    try {
      const response = await fetch(`${endpoint}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Key': masterKey
        },
        body: JSON.stringify({
          projectId: projectId,
          name: projectName
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.message}`);
      }
      
      const project = await response.json();
      console.log(`✅ Projeto '${projectId}' criado com sucesso`);
      console.log(`   ID: ${project.$id}`);
      console.log(`   Name: ${project.name}`);
    } catch (error) {
      if (error.message.includes('409')) {
        console.log(`ℹ️ Projeto '${projectId}' já existe`);
      } else {
        console.log('❌ Erro ao criar projeto:', error.message);
        return;
      }
    }

    // Criar API Key com todos os scopes
    console.log('\n🔑 Criando API Key com todos os scopes...');
    const apiKeyName = 'bigtech-api-key';
    const scopes = [
      'users.read',
      'users.write',
      'teams.read',
      'teams.write',
      'databases.read',
      'databases.write',
      'collections.read',
      'collections.write',
      'attributes.read',
      'attributes.write',
      'indexes.read',
      'indexes.write',
      'documents.read',
      'documents.write',
      'files.read',
      'files.write',
      'buckets.read',
      'buckets.write',
      'functions.read',
      'functions.write',
      'execution.read',
      'execution.write',
      'locale.read',
      'avatars.read',
      'health.read',
      'migrations.read',
      'migrations.write',
      'realtime',
      'logs.read'
    ];

    try {
      const response = await fetch(`${endpoint}/projects/${projectId}/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Key': masterKey
        },
        body: JSON.stringify({
          name: apiKeyName,
          scopes: scopes
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.message}`);
      }
      
      const apiKey = await response.json();
      console.log(`✅ API Key '${apiKeyName}' criada com sucesso`);
      console.log(`   Secret: ${apiKey.secret}`);

      // Salvar no backend/.env
      const backendEnvPath = join(__dirname, '..', 'backend', '.env');
      const fs = await import('fs');

      let envContent = fs.readFileSync(backendEnvPath, 'utf8');
      envContent = envContent.replace(/APPWRITE_PROJECT_ID=.*/, `APPWRITE_PROJECT_ID=${projectId}`);
      envContent = envContent.replace(/APPWRITE_API_KEY=.*/, `APPWRITE_API_KEY=${apiKey.secret}`);

      fs.writeFileSync(backendEnvPath, envContent);
      console.log('💾 Credenciais salvas no backend/.env');

    } catch (error) {
      console.log('❌ Erro ao criar API Key:', error.message);
      return;
    }

    // Criar database
    const databaseId = 'bigtechdb';
    console.log(`\n📊 Criando database '${databaseId}'...`);
    try {
      client.setProject(projectId);
      const database = await databases.create(databaseId, databaseId);
      console.log(`✅ Database '${databaseId}' criado com sucesso`);
    } catch (error) {
      if (error.code === 409) {
        console.log(`ℹ️ Database '${databaseId}' já existe`);
      } else {
        console.log('❌ Erro ao criar database:', error.message);
        console.log('Response:', error.response);
      }
    }

    console.log('\n🎯 Inicialização concluída!');
    console.log('\n📋 Resumo:');
    console.log(`   - Projeto: ${projectId}`);
    console.log(`   - Database: ${databaseId}`);
    console.log('   - API Key: Criada com todos os scopes');
    console.log('   - Credenciais: Salvas no backend/.env');

  } catch (error) {
    console.error('❌ Erro geral na inicialização:', error);
    process.exit(1);
  }
}

initAppwriteLocal();