import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_S3_BUCKET;

const s3 = REGION && BUCKET ? new S3Client({ region: REGION }) : null;

export async function uploadExportToS3(buffer: Buffer, key: string) {
  if (!s3 || !BUCKET) throw new Error('S3 not configured');

  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: 'application/x-ndjson' });
  await s3.send(cmd);

  // generate presigned URL valid for 1 hour
  const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 });
  return url;
}
