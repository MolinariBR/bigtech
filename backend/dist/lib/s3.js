"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadExportToS3 = uploadExportToS3;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_S3_BUCKET;
const s3 = REGION && BUCKET ? new client_s3_1.S3Client({ region: REGION }) : null;
async function uploadExportToS3(buffer, key) {
    if (!s3 || !BUCKET)
        throw new Error('S3 not configured');
    const cmd = new client_s3_1.PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: 'application/x-ndjson' });
    await s3.send(cmd);
    // generate presigned URL valid for 1 hour
    const url = await (0, s3_request_presigner_1.getSignedUrl)(s3, new client_s3_1.PutObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 });
    return url;
}
//# sourceMappingURL=s3.js.map