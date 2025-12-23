#!/usr/bin/env node

// Script para criar usuário admin no Appwrite
// Execute: node scripts/create-admin.js

import { Client, Account, Databases, ID } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'bigtech')
  .setKey(process.env.APPWRITE_API_KEY || '');

const account = new Account(client);
const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'bigtechdb';

async function createAdmin() {
  try {
    console.log('🚀 Criando usuário admin...');

    // Dados do admin
    const email = 'admin2@bigtech.com';
    const password = 'admin123';
    const name = 'Admin BigTech';

    // Criar conta no Appwrite Accounts
    const userId = ID.unique();
    const acc = await account.create(userId, email, password, name);
    console.log('✅ Conta criada no Appwrite Accounts:', acc.$id);

    // Adicionar à coleção admins
    const adminData = {
      email,
      accountId: userId,
      identifier: null,
      type: 'admin',
      role: 'admin',
      status: 'active',
      credits: '0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const adminDoc = await databases.createDocument(databaseId, 'admins', userId, adminData);
    console.log('✅ Documento criado na coleção admins:', adminDoc.$id);

    console.log('🎉 Admin criado com sucesso!');
    console.log('Email:', email);
    console.log('Senha:', password);

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
    process.exit(1);
  }
}

createAdmin();