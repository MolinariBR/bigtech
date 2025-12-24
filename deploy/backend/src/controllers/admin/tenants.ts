// Baseado em: 2.Architecture.md v1.0.1, 4.Entities.md v1.1, 7.Tasks.md v1.0
// Precedência: 1.Project → 2.Architecture → 4.Entities → 7.Tasks
// Decisão: Controlador admin para gerenciamento de tenants conforme contratos padronizados

import { Router } from 'express';
import { Query } from 'node-appwrite';
import { AppwriteService as LocalAppwriteService } from '../../lib/appwrite';
// Note: `Query` is provided by `node-appwrite` for building filter queries
// We alias the local AppwriteService import to avoid name clash with SDK types
import { auditLogger } from '../../core/audit';

const router = Router();
const appwrite = LocalAppwriteService.getInstance();

// GET /api/admin/tenants - Listar todos os tenants (admin vê todos)
router.get('/', async (req, res) => {
  try {
    // Admin vê todos os tenants - isolamento global
    const tenants = await appwrite.databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'tenants',
      [] // Sem filtros - admin vê tudo
    );

    const formattedTenants = tenants.documents.map((doc: any) => ({
      id: doc.$id,
      name: doc.name,
      status: doc.status,
      plugins: doc.plugins || [],
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    }));

    res.json({ tenants: formattedTenants });
  } catch (error) {
    console.error('Failed to list tenants:', error);
    res.status(500).json({ error: 'Failed to load tenants' });
  }
});

// POST /api/admin/tenants - Criar novo tenant
router.post('/', async (req, res) => {
  try {
    const { name, status = 'active', plugins = [] } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    // Validar unicidade do nome globalmente
    const existing = await appwrite.databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'tenants',
      [Query.equal('name', name)]
    );

    if (existing.documents.length > 0) {
      return res.status(409).json({ error: 'Tenant name already exists' });
    }

    // Criar tenant
    const tenantDoc = await appwrite.databases.createDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'tenants',
      'unique()',
      {
        name,
        status,
        plugins,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: (req as any).userId,
      }
    );

    // Auditar criação
    try {
      console.log('Audit: about to log CREATE for tenant', tenantDoc.$id);
      await auditLogger.log({
        tenantId: tenantDoc.$id, // Usar o próprio ID do tenant como tenantId para admin
        action: 'CREATE',
        resource: 'TENANT',
        details: { name, status, plugins },
        ipAddress: req.ip || 'unknown',
        userId: (req as any).userId,
      });
      console.log('Audit: logged CREATE for tenant', tenantDoc.$id);
    } catch (auditErr) {
      console.error('Audit logging failed (non-fatal):', auditErr);
    }

    const tenant = {
      id: tenantDoc.$id,
      name: tenantDoc.name,
      status: tenantDoc.status,
      plugins: tenantDoc.plugins || [],
      createdAt: tenantDoc.$createdAt,
      updatedAt: tenantDoc.$updatedAt,
    };

    res.status(201).json(tenant);
  } catch (error) {
    console.error('Failed to create tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// PUT /api/admin/tenants/:id - Atualizar tenant
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, plugins } = req.body;

    // Buscar tenant existente
    const existing = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'tenants',
      id
    );

    if (!existing) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Se nome mudou, validar unicidade
    if (name && name !== existing.name) {
      const nameCheck = await appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'tenants',
        [Query.equal('name', name)]
      );

      if (nameCheck.documents.length > 0) {
        return res.status(409).json({ error: 'Tenant name already exists' });
      }
    }

    // Atualizar tenant
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (plugins !== undefined) updateData.plugins = plugins;

    const updatedDoc = await appwrite.databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'tenants',
      id,
      updateData
    );

    // Auditar atualização
    await auditLogger.log({
      tenantId: id,
      action: 'UPDATE',
      resource: 'TENANT',
      details: updateData,
      ipAddress: req.ip || 'unknown',
      userId: (req as any).userId,
    });

    const tenant = {
      id: updatedDoc.$id,
      name: updatedDoc.name,
      status: updatedDoc.status,
      plugins: updatedDoc.plugins || [],
      createdAt: updatedDoc.$createdAt,
      updatedAt: updatedDoc.$updatedAt,
    };

    res.json(tenant);
  } catch (error) {
    console.error('Failed to update tenant:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// DELETE /api/admin/tenants/:id - Deletar tenant
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se tenant existe
    const existing = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'tenants',
      id
    );

    if (!existing) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Deletar tenant
    await appwrite.databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'tenants',
      id
    );

    // Auditar deleção
    await auditLogger.log({
      tenantId: id,
      action: 'DELETE',
      resource: 'TENANT',
      details: { name: existing.name },
      ipAddress: req.ip || 'unknown',
      userId: (req as any).userId,
    });

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Failed to delete tenant:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

export const adminTenantsRouter = router;