/**
 * stability3d.ts — Client-side helper for Stability AI 3D generation
 *
 * Flow: Client → POST /api/dishes/:id/generate-3d → Server → Stability AI → R2
 * API key stays server-side only.
 *
 * Stability AI Stable Fast 3D:
 *   - Single POST request → returns GLB binary directly
 *   - No polling needed (~0.5 seconds)
 *   - $0.10 per model (10 credits)
 */

import { supabase } from './supabase';

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('يجب تسجيل الدخول');
  }
  return session.access_token;
}

export interface Generate3DResponse {
  status: 'SUCCEEDED' | 'FAILED';
  model3dUrl?: string;
  error?: string;
}

/**
 * Compress an image file to max 512px and small JPEG for fast transfer.
 * Stability AI only needs a small reference — no need for high-res.
 */
function compressForAI(file: File): Promise<{ base64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const MAX = 512;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round(height * MAX / width);
          width = MAX;
        } else {
          width = Math.round(width * MAX / height);
          height = MAX;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Compression failed'));
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve({ base64, contentType: 'image/jpeg' });
          };
          reader.onerror = () => reject(new Error('Read failed'));
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        0.65
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

/**
 * Generate a 3D model from the dish image.
 * If a customFile (raw camera photo) is provided, it's compressed
 * client-side and sent as base64 — no separate upload step needed!
 */
export async function generateAI3D(
  dishId: string,
  imageUrl?: string,
  customFile?: File
): Promise<Generate3DResponse> {
  const token = await getAuthToken();

  // If user took a custom photo, compress & encode it client-side
  let imageBase64: string | undefined;
  let imageContentType: string | undefined;
  if (customFile) {
    const compressed = await compressForAI(customFile);
    imageBase64 = compressed.base64;
    imageContentType = compressed.contentType;
  }

  const res = await fetch(`/api/dishes/${dishId}/generate-3d`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl: imageUrl || undefined,
      imageBase64,
      imageContentType,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'فشل توليد النموذج ثلاثي الأبعاد');
  }

  return data;
}
