import { Router } from 'express';
import { AppwriteService } from '../../lib/appwrite';

const router = Router();
const appwrite = AppwriteService.getInstance();

// In-memory export jobs store
const exportJobs: Record<string, any> = {};

router.get('/', async (req, res) => {
  const {
    tenantId,
    userId,
    action,
    resource,
    startDate,
    endDate,
    search,
    page = 1,
    perPage = 20
  } = req.query as any;

  try {
    const queries: string[] = [];

    if (tenantId) queries.push(`tenantId=${tenantId}`);
    if (userId) queries.push(`userId=${userId}`);
    if (action) queries.push(`action=${action}`);
    if (resource) queries.push(`resource=${resource}`);
    if (search) {
      // Search in multiple fields
      queries.push(`$search=${search}`);
    }

    const result = await appwrite.databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'audits',
      queries
    );

    let docs = result.documents || [];

    // Date filtering (client-side for simplicity)
    if (startDate) {
      const start = new Date(startDate);
      docs = docs.filter((d: any) => new Date(d.timestamp) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      docs = docs.filter((d: any) => new Date(d.timestamp) <= end);
    }

    // Sort by timestamp descending
    docs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = docs.length;
    const startIndex = (Number(page) - 1) * Number(perPage);
    const endIndex = startIndex + Number(perPage);
    const items = docs.slice(startIndex, endIndex);

    res.json({ total, page: Number(page), perPage: Number(perPage), items });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const result = await appwrite.databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'audits',
      []
    );

    const docs = result.documents || [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let totalLogs = docs.length;
    let todayLogs = 0;
    let criticalActions = 0;
    const uniqueUsers = new Set();
    const actionCounts: Record<string, number> = {};

    docs.forEach((doc: any) => {
      const timestamp = new Date(doc.timestamp);

      // Count today's logs
      if (timestamp >= today) {
        todayLogs++;
      }

      // Count unique users
      if (doc.userId) {
        uniqueUsers.add(doc.userId);
      }

      // Count actions
      actionCounts[doc.action] = (actionCounts[doc.action] || 0) + 1;

      // Count critical actions
      const criticalActionsList = ['admin_action', 'billing_debit', 'tenant_deleted', 'user_deleted'];
      if (criticalActionsList.includes(doc.action)) {
        criticalActions++;
      }
    });

    // Get top actions
    const topActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));

    res.json({
      totalLogs,
      todayLogs,
      criticalActions,
      uniqueUsers: uniqueUsers.size,
      topActions
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ error: 'Failed to fetch audit stats' });
  }
});

router.post('/export', async (req, res) => {
  const jobId = `job_${Date.now()}`;
  exportJobs[jobId] = { status: 'queued', createdAt: new Date().toISOString() };

  // Start async job
  (async () => {
    try {
      exportJobs[jobId].status = 'processing';
      const filters = req.body || {};

      // Get filtered logs
      const queryParams = new URLSearchParams({
        ...filters,
        perPage: '10000' // Large limit for export
      });

      const response = await fetch(`${req.protocol}://${req.get('host')}/api/admin/audit?${queryParams}`);
      const data = await response.json() as { items?: any[] };
      const items = data.items || [];

      // Serialize NDJSON
      const ndjson = items.map((item: any) => JSON.stringify(item)).join('\n');

      // For simplicity, return as downloadable content
      // In production, you might want to upload to S3 or similar
      exportJobs[jobId] = {
        status: 'ready',
        url: `data:text/plain;charset=utf-8,${encodeURIComponent(ndjson)}`,
        createdAt: new Date().toISOString(),
        filename: `audit-logs-${jobId}.ndjson`
      };
    } catch (err) {
      exportJobs[jobId] = { status: 'error', error: String(err), createdAt: new Date().toISOString() };
    }
  })();

  res.status(202).json({ jobId });
});

router.get('/export/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const job = exportJobs[jobId];
  if (!job) return res.status(404).json({ status: 'not_found' });
  res.json(job);
});

export const adminAuditRouter = router;