"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBillingRouter = void 0;
const express_1 = require("express");
const billingEngine_1 = require("../../core/billingEngine");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const s3_1 = require("../../lib/s3");
const router = (0, express_1.Router)();
// In-memory export jobs store
const exportJobs = {};
router.get('/stats', async (req, res) => {
    const result = await billingEngine_1.billingEngine.getBillingStats();
    res.json(result);
});
router.get('/', async (req, res) => {
    const { tenantId, page, perPage, from, to, type, status } = req.query;
    const result = await billingEngine_1.billingEngine.listBillings({ tenantId, page: Number(page) || 1, perPage: Number(perPage) || 50, from, to, type, status });
    res.json(result);
});
router.get('/aggregates', async (req, res) => {
    const { tenantId, from, to, granularity, metrics } = req.query;
    const result = await billingEngine_1.billingEngine.aggregateBillings({ tenantId, from, to, granularity, metrics: metrics ? metrics.split(',') : undefined });
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
            const list = await billingEngine_1.billingEngine.listBillings(filters);
            const items = list.items || [];
            // Serialize NDJSON
            const ndjson = items.map((it) => JSON.stringify(it)).join('\n');
            // If S3 configured, upload, otherwise write local file
            if (process.env.AWS_S3_BUCKET && process.env.AWS_REGION) {
                const key = `exports/${jobId}.ndjson`;
                const url = await (0, s3_1.uploadExportToS3)(Buffer.from(ndjson), key);
                exportJobs[jobId] = { status: 'ready', url, createdAt: new Date().toISOString() };
            }
            else {
                const outDir = process.env.EXPORTS_DIR || '/tmp/exports';
                fs.mkdirSync(outDir, { recursive: true });
                const filePath = path.join(outDir, `${jobId}.ndjson`);
                fs.writeFileSync(filePath, ndjson);
                exportJobs[jobId] = { status: 'ready', url: `/exports/${jobId}.ndjson`, createdAt: new Date().toISOString(), path: filePath };
            }
        }
        catch (err) {
            exportJobs[jobId] = { status: 'error', error: String(err), createdAt: new Date().toISOString() };
        }
    })();
    res.status(202).json({ jobId });
});
router.get('/export/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const job = exportJobs[jobId];
    if (!job)
        return res.status(404).json({ status: 'not_found' });
    res.json(job);
});
router.post('/:id/refund', async (req, res) => {
    const { id } = req.params;
    const { amount, reason } = req.body || {};
    const auditId = req.header('X-Audit-Id') || req.body?.auditId;
    const result = await billingEngine_1.billingEngine.refundTransaction(id, amount, reason, { tenantId: req.tenantId, userId: req.userId, auditId });
    if (result.success)
        return res.json({ refundId: result.refundId });
    return res.status(400).json({ error: result.error || 'refund_failed' });
});
exports.adminBillingRouter = router;
//# sourceMappingURL=billing.js.map