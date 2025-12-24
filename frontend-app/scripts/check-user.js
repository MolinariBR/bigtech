#!/usr/bin/env node

// Script para verificar se usuário existe no Appwrite
// Execute: node scripts/check-user.js <email>

import { Client, Account, Databases } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'bigtech')
  .setKey(process.env.APPWRITE_API_KEY || '');

const account = new Account(client);
const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'bigtechdb';

async function checkUser(email) {
  try {
    console.log(`🔍 Verificando usuário: ${email}`);

    // Tentar fazer login para verificar se o usuário existe
    try {
      const session = await account.createEmailPasswordSession(email, 'dummy-password');
      console.log('✅ Usuário encontrado e pode fazer login');
      // Logout da sessão de teste
      await account.deleteSession('current');
      return true;
    } catch (loginError) {
      // Se der erro de senha, o usuário existe mas senha está errada
      if (loginError.code === 401) {
        console.log('✅ Usuário encontrado (senha incorreta na verificação)');
        return true;
      }
      // Se der outro erro, provavelmente usuário não existe
      console.log('❌ Usuário não encontrado ou erro na verificação');
      return false;
    }

  } catch (error) {
    console.error('❌ Erro ao verificar usuário:', error.message);
    return false;
  }
}

// Executar se chamado diretamente
if (process.argv[1].endsWith('check-user.js')) {
  const email = process.argv[2];
  if (!email) {
    console.error('❌ Uso: node scripts/check-user.js <email>');
    process.exit(1);
  }
  checkUser(email);
}

export { checkUser };