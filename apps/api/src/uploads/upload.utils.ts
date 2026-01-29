import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export function ensureUploadsDir() {
  const dir = join(process.cwd(), 'uploads');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getMaxUploadBytes() {
  const mb = Number(process.env.MAX_UPLOAD_MB || 5);
  return mb * 1024 * 1024;
}

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

export const CLASSROOM_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);
