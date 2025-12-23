#!/usr/bin/env node

// Script para criar usuário de teste no Appwrite
// Execute: node scripts/create-test-user.js

import { Client, Account, Databases, ID } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'bigtech')
  .setKey(process.env.APPWRITE_API_KEY || '');

const account = new Account(client);
const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'bigtechdb';

async function createTestUser() {
  try {
    console.log('🚀 Criando usuário de teste...');

    // Dados do usuário
    const email = 'user@bigtech.com';
    const password = 'user1234';
    const name = 'Usuário Teste';

    // Criar conta no Appwrite Accounts
    const userId = ID.unique();
    const acc = await account.create(userId, email, password, name);
    console.log('✅ Conta criada no Appwrite Accounts:', acc.$id);

    console.log('🎉 Usuário de teste criado com sucesso!');
    console.log('Email:', email);
    console.log('Senha:', password);

  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error);
    process.exit(1);
  }
}

createTestUser();