/**
 * Asset Service — Server-Side Upload (NO CORS issues!)
 * 
 * Flow: Browser → Vercel API → R2 (everything goes through our server)
 * The browser NEVER talks to Cloudflare directly.
 * Images are compressed before upload to stay under Vercel's 4.5MB limit.
 */
import { supabase } from '../lib/supabase';

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('يجب تسجيل الدخول لرفع الملفات');
  }
  return session.access_token;
}

/**
 * Convert a File/Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the "data:image/jpeg;base64," prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Compress an image to ensure it's under maxSizeKB.
 * Uses Canvas API to resize and reduce quality.
 */
function compressImage(file: File, maxSizeKB = 2500, maxDimension = 1920): Promise<File> {
  return new Promise((resolve) => {
    // If not an image or already small, return as-is
    if (!file.type.startsWith('image/') || file.size <= maxSizeKB * 1024) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Resize if too large
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round(height * maxDimension / width);
          width = maxDimension;
        } else {
          width = Math.round(width * maxDimension / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            resolve(file); // Original was smaller, use it
          }
        },
        'image/jpeg',
        0.82
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Can't compress, use original
    };

    img.src = url;
  });
}

export const assetService = {
  /**
   * Upload any file (image or 3D model) through our server.
   * No CORS issues because the browser only talks to our API.
   */
  async uploadFile(
    file: File, 
    _resourceType: 'image' | 'raw' = 'image',
    options?: { maxSizeKB?: number; maxDimension?: number }
  ): Promise<string> {
    const token = await getAuthToken();

    // Compress images to stay under Vercel's body size limit
    let processedFile: File = file;
    if (file.type.startsWith('image/')) {
      processedFile = await compressImage(file, options?.maxSizeKB, options?.maxDimension);
    }

    // Convert file to base64
    const base64Data = await blobToBase64(processedFile);

    // Upload through OUR server (no CORS!)
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: processedFile.name,
        contentType: processedFile.type || 'application/octet-stream',
        data: base64Data,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `فشل رفع الملف (${response.status})`);
    }

    const result = await response.json();
    return result.url || result.publicUrl;
  },

  /**
   * Returns the URL as-is (R2 CDN-served).
   */
  getOptimizedUrl(url: string, _options: { width?: number; height?: number; quality?: string } = {}): string {
    return url;
  },
};
