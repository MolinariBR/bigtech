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
    const doc = settings.documents[0];
    if (!doc) {
      return res.json({
        billing: { minCreditPurchase: 1, maxCreditPurchase: 1000, creditValue: 1.0, retentionDays: 365 },
        email: { fromEmail: '', replyToEmail: '', supportEmail: '' },
        smtp: { host: '', port: 587, secure: false, user: '', pass: '' },
        rates: { defaultRateLimit: 100, fallbackCostMultiplier: 1.5 },
      });
    }

    // Parse JSON strings back to objects
    const data = {
      billing: JSON.parse(doc.billing || '{}'),
      email: JSON.parse(doc.email || '{}'),
      smtp: JSON.parse(doc.smtp || '{}'),
      rates: JSON.parse(doc.rates || '{}'),
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { billing, email, smtp, rates } = req.body;
    const userId = (req as any).userId || 'system-admin'; // From auth middleware or default for dev
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    // Fetch existing or create new
    const existing = await appwrite.databases.listDocuments(
      appwrite.databaseId,
      SYSTEM_SETTINGS_COLLECTION,
      []
    );
    const documentId = existing.documents[0]?.$id || 'global';

    const data = {
      billing: JSON.stringify(billing),
      email: JSON.stringify(email),
      smtp: JSON.stringify(smtp),
      rates: JSON.stringify(rates),
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
      details: { changes: { billing, email, smtp, rates } },
      ipAddress,
    });

    res.json({ ...result, auditId });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
});

export default router;