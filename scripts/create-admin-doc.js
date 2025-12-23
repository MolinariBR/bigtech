#!/usr/bin/env node

import { Databases } from 'node-appwrite';
import { Client } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'bigtech')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'bigtechdb';

async function createAdminDoc() {
  const adminData = {
    email: 'admin2@bigtech.com',
    accountId: '694aca2e54e201e38b57',
    identifier: null,
    type: 'admin',
    role: 'admin',
    status: 'active',
    credits: '0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const doc = await databases.createDocument(databaseId, 'admins', '694aca2e54e201e38b57', adminData);
    console.log('Admin doc created:', doc.$id);
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminDoc();