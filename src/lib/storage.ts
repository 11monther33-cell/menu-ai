/**
 * storage.ts — VISIONO Unified Storage
 * Development → local disk (public/uploads/)
 * Production  → Cloudflare R2
 * Same interface — switch NODE_ENV only.
 */

import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export interface UploadResult {
  url    : string;
  key    : string;
  sizeKb : number;
}

const IS_PROD = process.env.NODE_ENV === 'production';

// ── Local Storage (Development) ──────────────────────────────────
async function uploadLocal(
  buffer   : Buffer,
  key      : string,
  _mimeType: string
): Promise<UploadResult> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const safeKey   = key.replace(/\.\./g, '').replace(/[^a-zA-Z0-9_\-./]/g, '_');
  const filePath  = path.join(uploadDir, safeKey.replace(/\//g, '_'));

  if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

  await writeFile(filePath, buffer);

  return {
    url   : `/uploads/${safeKey.replace(/\//g, '_')}`,
    key   : safeKey,
    sizeKb: Math.round(buffer.length / 1024),
  };
}

// ── R2 Storage (Production) ───────────────────────────────────────
async function uploadR2(
  buffer   : Buffer,
  key      : string,
  mimeType : string
): Promise<UploadResult> {
  // @ts-ignore — lazy import: @aws-sdk/client-s3 only needed in production
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  const r2 = new S3Client({
    region  : 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
    credentials: {
      accessKeyId    : process.env.CLOUDFLARE_R2_ACCESS_KEY!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
    },
  });

  await r2.send(new PutObjectCommand({
    Bucket      : process.env.CLOUDFLARE_R2_BUCKET!,
    Key         : key,
    Body        : buffer,
    ContentType : mimeType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  return {
    url   : `${process.env.NEXT_PUBLIC_CDN_URL}/${key}`,
    key,
    sizeKb: Math.round(buffer.length / 1024),
  };
}

// ── Unified API ──────────────────────────────────────────────────
export async function uploadFile(
  buffer   : Buffer,
  key      : string,
  mimeType : string
): Promise<UploadResult> {
  return IS_PROD
    ? uploadR2(buffer, key, mimeType)
    : uploadLocal(buffer, key, mimeType);
}

export async function deleteFile(key: string): Promise<void> {
  if (!IS_PROD) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const safeKey   = key.replace(/\.\./g, '').replace(/[^a-zA-Z0-9_\-./]/g, '_');
    const filePath  = path.join(uploadDir, safeKey.replace(/\//g, '_'));
    try { await unlink(filePath); } catch { /* file may not exist */ }
    return;
  }

  // @ts-ignore — lazy import: @aws-sdk/client-s3 only needed in production
  const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  const r2 = new S3Client({
    region  : 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
    credentials: {
      accessKeyId    : process.env.CLOUDFLARE_R2_ACCESS_KEY!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
    },
  });
  await r2.send(new DeleteObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
    Key   : key,
  }));
}
