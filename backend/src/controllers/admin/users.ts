// Baseado em: 2.Architecture.md v1.0.1, 4.Entities.md v1.2, 7.Tasks.md v1.0
// Precedência: 1.Project → 2.Architecture → 4.Entities → 7.Tasks
// Decisão: Controlador admin para gerenciamento de usuários conforme contratos padronizados

import { Router } from 'express';
import { Query } from 'node-appwrite';
import { AppwriteService as LocalAppwriteService } from '../../lib/appwrite';
// Note: `Query` is provided by `node-appwrite` for building filter queries
// We alias the local AppwriteService import to avoid name clash with SDK types
import { auditLogger } from '../../core/audit';

const router = Router();
const appwrite = LocalAppwriteService.getInstance();

// GET /api/admin/users - Listar todos os usuários (admin vê todos)
router.get('/', async (req, res) => {
  try {
    // Admin vê todos os usuários - isolamento global
    const users = await appwrite.databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      [] // Sem filtros - admin vê tudo
    );

    const formattedUsers = users.documents.map((doc: any) => ({
      id: doc.$id,
      tenantId: doc.tenantId,
      type: doc.type || 'user',
      identifier: doc.identifier,
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      role: doc.role || 'viewer',
      status: doc.status || 'active',
      credits: doc.credits || 0,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Failed to list users:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// PUT /api/admin/users/:id - Atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, status } = req.body;

    // Buscar usuário existente
    const existing = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      id
    );

    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Atualizar apenas campos que existem no documento
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    // Se não há campos para atualizar, retornar sucesso
    if (Object.keys(updateData).length === 0) {
      const user = {
        id: existing.$id,
        tenantId: existing.tenantId,
        type: existing.type || 'user',
        identifier: existing.identifier,
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        role: existing.role || 'viewer',
        status: existing.status || 'active',
        credits: existing.credits || 0,
        createdAt: existing.$createdAt,
        updatedAt: existing.$updatedAt,
      };
      return res.json(user);
    }

    const updatedDoc = await appwrite.databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      id,
      updateData
    );

    // Auditar atualização
    await auditLogger.log({
      tenantId: existing.tenantId,
      action: 'UPDATE',
      resource: 'USER',
      details: updateData,
      ipAddress: req.ip || 'unknown',
      userId: (req as any).userId,
    });

    const user = {
      id: updatedDoc.$id,
      tenantId: updatedDoc.tenantId,
      type: updatedDoc.type || 'user',
      identifier: updatedDoc.identifier,
      name: updatedDoc.name,
      email: updatedDoc.email,
      phone: updatedDoc.phone,
      role: updatedDoc.role || 'viewer',
      status: updatedDoc.status || 'active',
      credits: updatedDoc.credits || 0,
      createdAt: updatedDoc.$createdAt,
      updatedAt: updatedDoc.$updatedAt,
    };

    res.json(user);
  } catch (error) {
    console.error('Failed to update user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PATCH /api/admin/users/:id/status - Alterar status do usuário
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active or inactive' });
    }

    // Buscar usuário existente
    const existing = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      id
    );

    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Atualizar status
    const updatedDoc = await appwrite.databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      id,
      { status }
    );

    // Auditar mudança de status
    await auditLogger.log({
      tenantId: existing.tenantId,
      action: 'UPDATE',
      resource: 'USER_STATUS',
      details: { oldStatus: existing.status, newStatus: status },
      ipAddress: req.ip || 'unknown',
      userId: (req as any).userId,
    });

    const user = {
      id: updatedDoc.$id,
      tenantId: updatedDoc.tenantId,
      type: updatedDoc.type || 'user',
      identifier: updatedDoc.identifier,
      name: updatedDoc.name,
      email: updatedDoc.email,
      phone: updatedDoc.phone,
      role: updatedDoc.role || 'viewer',
      status: updatedDoc.status || 'active',
      credits: updatedDoc.credits || 0,
      createdAt: updatedDoc.$createdAt,
      updatedAt: updatedDoc.$updatedAt,
    };

    res.json(user);
  } catch (error) {
    console.error('Failed to update user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// DELETE /api/admin/users/:id - Deletar usuário
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se usuário existe
    const existing = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      id
    );

    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Deletar usuário
    await appwrite.databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      id
    );

    // Auditar deleção
    await auditLogger.log({
      tenantId: existing.tenantId,
      action: 'DELETE',
      resource: 'USER',
      details: { identifier: existing.identifier, name: existing.name },
      ipAddress: req.ip || 'unknown',
      userId: (req as any).userId,
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export const adminUsersRouter = router;