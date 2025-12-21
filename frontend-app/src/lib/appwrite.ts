import { Client } from 'appwrite';

const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'http://localhost:80/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT || 'bigtech-project');

export default client;