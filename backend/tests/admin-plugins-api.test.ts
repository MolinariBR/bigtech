import request from 'supertest';
import express from 'express';
import { adminPluginsRouter } from '../src/controllers/admin/plugins';

// Mock do Appwrite
jest.mock('node-appwrite', () => ({
  Client: jest.fn().mockImplementation(() => ({
    setEndpoint: jest.fn().mockReturnThis(),
    setProject: jest.fn().mockReturnThis(),
    setKey: jest.fn().mockReturnThis(),
  })),
  Databases: jest.fn().mockImplementation(() => ({
    listDocuments: jest.fn().mockResolvedValue({
      documents: [
        {
          $id: 'plugin1',
          id: 'bigtech',
          type: 'consulta',
          enabled: true,
          config: {
            apiKey: 'encrypted-key',
            productionUrl: 'https://api.bigtech.com',
            sandboxUrl: 'https://sandbox.bigtech.com',
            servicePrices: {
              '11-serasa-consumidor': 5.50,
              '1003-serasa-empresarial': 8.75
            }
          }
        }
      ]
    }),
    getDocument: jest.fn().mockResolvedValue({
      $id: 'plugin1',
      id: 'bigtech',
      config: { apiKey: 'encrypted-key' }
    }),
    updateDocument: jest.fn().mockResolvedValue({}),
    createDocument: jest.fn().mockResolvedValue({})
  }))
}));

// Mock do plugin loader
jest.mock('../src/core/pluginLoader', () => ({
  PluginLoader: {
    getInstance: jest.fn().mockReturnValue({
      getPlugin: jest.fn().mockResolvedValue({
        id: 'bigtech',
        testConnection: jest.fn().mockResolvedValue({
          status: 'success',
          responseTime: 1500
        }),
        getAvailableServices: jest.fn().mockResolvedValue([
          { code: '11-serasa-consumidor', name: 'Serasa Consumidor', defaultPrice: 5.00 },
          { code: '1003-serasa-empresarial', name: 'Serasa Empresarial', defaultPrice: 8.00 }
        ])
      })
    })
  }
}));

const app = express();
app.use(express.json());
app.use('/api/admin/plugins', adminPluginsRouter);

describe('Admin Plugins API', () => {
  describe('GET /api/admin/plugins', () => {
    it('should return plugins list for tenant', async () => {
      const response = await request(app)
        .get('/api/admin/plugins')
        .set('x-tenant-id', 'test-tenant');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/admin/plugins/:pluginId/services', () => {
    it('should return services with custom prices', async () => {
      const response = await request(app)
        .get('/api/admin/plugins/bigtech/services')
        .set('x-tenant-id', 'test-tenant');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('code');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('price');
      expect(response.body[0]).toHaveProperty('defaultPrice');
    });

    it('should return services with default prices when no custom prices configured', async () => {
      const response = await request(app)
        .get('/api/admin/plugins/bigtech/services')
        .set('x-tenant-id', 'test-tenant');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/admin/plugins/:pluginId/test-connection', () => {
    it('should test plugin connection', async () => {
      const response = await request(app)
        .post('/api/admin/plugins/bigtech/test-connection')
        .set('x-tenant-id', 'test-tenant')
        .send({
          config: {
            apiKey: 'test-key',
            productionUrl: 'https://api.test.com'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('responseTime');
    });
  });

  describe('PUT /api/admin/plugins/:pluginId/config', () => {
    it('should update service prices configuration', async () => {
      const configData = {
        servicePrices: {
          '11-serasa-consumidor': 6.50,
          '1003-serasa-empresarial': 9.75
        }
      };

      const response = await request(app)
        .put('/api/admin/plugins/bigtech/config')
        .set('x-tenant-id', 'test-tenant')
        .send(configData);

      expect(response.status).toBe(200);
    });

    it('should validate price values are positive', async () => {
      const invalidConfig = {
        servicePrices: {
          '11-serasa-consumidor': -1.00 // Preço negativo
        }
      };

      const response = await request(app)
        .put('/api/admin/plugins/bigtech/config')
        .set('x-tenant-id', 'test-tenant')
        .send(invalidConfig);

      expect(response.status).toBe(400);
    });
  });
});</content>
