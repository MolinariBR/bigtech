#!/usr/bin/env node

// Script para criar documento inicial na collection systemSettings
// Execute: node scripts/create-system-settings.js

import { Client, Databases } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'bigtech')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'bigtechdb';

async function createSystemSettingsDocument() {
  try {
    console.log('🚀 Criando documento inicial systemSettings...');

    const documentData = {
      billing: JSON.stringify({
        minCreditPurchase: 1,
        maxCreditPurchase: 1000,
        creditValue: 1.0,
        retentionDays: 365
      }),
      email: JSON.stringify({
        fromEmail: '',
        replyToEmail: '',
        supportEmail: ''
      }),
      smtp: JSON.stringify({
        host: '',
        port: 587,
        secure: false,
        user: '',
        pass: ''
      }),
      rates: JSON.stringify({
        defaultRateLimit: 100,
        fallbackCostMultiplier: 1.5
      })
    };

    // Tentar criar o documento
    try {
      await databases.createDocument(databaseId, 'systemSettings', 'global', documentData);
      console.log('✅ Documento systemSettings criado com ID: global');
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ Documento systemSettings já existe');
      } else {
        throw error;
      }
    }

    console.log('🎉 Documento systemSettings pronto!');

  } catch (error) {
    console.error('❌ Erro ao criar documento systemSettings:', error);
    process.exit(1);
  }
}

createSystemSettingsDocument();