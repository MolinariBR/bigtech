import { Router } from 'express';
import { billingEngine } from '../../core/billingEngine';
import * as fs from 'fs';
import * as path from 'path';
import { uploadExportToS3 } from '../../lib/s3';

const router = Router();

// In-memory export jobs store
const exportJobs: Record<string, any> = {};

router.get('/', async (req, res) => {
  const { tenantId, page, perPage, from, to, type, status } = req.query as any;
  const result = await billingEngine.listBillings({ tenantId, page: Number(page) || 1, perPage: Number(perPage) || 50, from, to, type, status });
  res.json(result);
});

router.get('/aggregates', async (req, res) => {
  const { tenantId, from, to, granularity, metrics } = req.query as any;
  const result = await billingEngine.aggregateBillings({ tenantId, from, to, granularity, metrics: metrics ? metrics.split(',') : undefined });
  res.json(result);
});

router.post('/export', async (req, res) => {
  const jobId = `job_${Date.now()}`;
  exportJobs[jobId] = { status: 'queued', createdAt: new Date().toISOString() };

  // start async job
  (async () => {
    try {
      exportJobs[jobId].status = 'processing';
      const filters = req.body || {};
      const list = await billingEngine.listBillings(filters);
      const items = list.items || [];

      // Serialize NDJSON
      const ndjson = items.map((it: any) => JSON.stringify(it)).join('\n');

      // If S3 configured, upload, otherwise write local file
      if (process.env.AWS_S3_BUCKET && process.env.AWS_REGION) {
        const key = `exports/${jobId}.ndjson`;
        const url = await uploadExportToS3(Buffer.from(ndjson), key);
        exportJobs[jobId] = { status: 'ready', url, createdAt: new Date().toISOString() };
      } else {
        const outDir = process.env.EXPORTS_DIR || '/tmp/exports';
        fs.mkdirSync(outDir, { recursive: true });
        const filePath = path.join(outDir, `${jobId}.ndjson`);
        fs.writeFileSync(filePath, ndjson);
        exportJobs[jobId] = { status: 'ready', url: `/exports/${jobId}.ndjson`, createdAt: new Date().toISOString(), path: filePath };
      }
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

router.post('/:id/refund', async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body || {};
  const auditId = req.header('X-Audit-Id') || req.body?.auditId;

  const result = await billingEngine.refundTransaction(id, amount, reason, { tenantId: (req as any).tenantId, userId: (req as any).userId, auditId });

  if (result.success) return res.json({ refundId: result.refundId });
  return res.status(400).json({ error: result.error || 'refund_failed' });
});

export const adminBillingRouter = router;
