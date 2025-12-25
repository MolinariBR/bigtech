#!/usr/bin/env node

// Script para criar admin de teste no Appwrite
// Execute: node scripts/create-admin-account.js

import { Client, Account, Databases, ID } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'bigtech')
  .setKey(process.env.APPWRITE_API_KEY || '');

const account = new Account(client);
const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'bigtechdb';

async function createAdminAccount() {
  try {
    console.log('🚀 Criando conta de admin no Appwrite...');

    // Dados do admin
    const email = 'admin@bigtech.com';
    const password = 'admin123';
    const name = 'Administrador BigTech';

    // Criar conta no Appwrite Accounts
    const userId = ID.unique();
    const acc = await account.create(userId, email, password, name);
    console.log('✅ Conta criada no Appwrite Accounts:', acc.$id);

    // Criar documento na collection admins
    const adminData = {
      email: email,
      accountId: acc.$id,
      identifier: null,
      type: 'admin',
      role: 'admin',
      status: 'active',
      credits: '0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const adminDoc = await databases.createDocument(databaseId, 'admins', acc.$id, adminData);
    console.log('✅ Documento admin criado:', adminDoc.$id);

    console.log('🎉 Admin criado com sucesso!');
    console.log('Email:', email);
    console.log('Senha:', password);

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
    process.exit(1);
  }
}

createAdminAccount();