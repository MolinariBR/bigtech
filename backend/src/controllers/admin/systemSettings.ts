import { Router } from 'express';
import { AppwriteService } from '../../lib/appwrite';
import { AuditLogger } from '../../core/audit';

const router = Router();
const appwrite = AppwriteService.getInstance();
const auditLogger = AuditLogger.getInstance();

// Collection ID for SystemSettings (assume it's created in Appwrite)
const SYSTEM_SETTINGS_COLLECTION = 'systemSettings';

router.get('/', async (req, res) => {
  try {
    const settings = await appwrite.databases.listDocuments(
      appwrite.databaseId,
      SYSTEM_SETTINGS_COLLECTION,
      []
    );
    const data = settings.documents[0] || {}; // Assume single document
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { billing, email, smtp, rates } = req.body;
    const userId = (req as any).userId; // From auth middleware

    // Fetch existing or create new
    const existing = await appwrite.databases.listDocuments(
      appwrite.databaseId,
      SYSTEM_SETTINGS_COLLECTION,
      []
    );
    const documentId = existing.documents[0]?.$id || 'global';

    const data = {
      billing,
      email,
      smtp,
      rates,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    let result;
    if (existing.documents[0]) {
      result = await appwrite.databases.updateDocument(
        appwrite.databaseId,
        SYSTEM_SETTINGS_COLLECTION,
        documentId,
        data
      );
    } else {
      result = await appwrite.databases.createDocument(
        appwrite.databaseId,
        SYSTEM_SETTINGS_COLLECTION,
        documentId,
        data
      );
    }

    // Generate audit
    const auditId = await auditLogger.log({
      tenantId: 'system', // Global
      userId,
      action: 'update_system_settings',
      resource: 'systemSettings',
      details: { changes: data },
    });

    res.json({ ...result, auditId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update system settings' });
  }
});

export default router;