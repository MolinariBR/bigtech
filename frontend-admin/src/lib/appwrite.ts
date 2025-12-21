import { Client, Databases, Account } from 'appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1') // Substitua pelo seu endpoint
  .setProject('your-project-id'); // Substitua pelo seu project ID

export const databases = new Databases(client);
export const account = new Account(client);

export default client;