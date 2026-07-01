import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import dotenv from 'dotenv';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config();

const IS_VERCEL = !!process.env.VERCEL;

// ═══════════════════════════════════════════
// ☁️ Cloudflare R2 Storage Client (S3-compatible)
// ═══════════════════════════════════════════
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});
const R2_BUCKET = process.env.R2_BUCKET || 'tablex-assets';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════
// 🔒 SECURITY: Server-side Supabase client (service role)
// ═══════════════════════════════════════════
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServer = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// ═══════════════════════════════════════════
// 🔒 SECURITY: Authentication middleware
// ═══════════════════════════════════════════
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!supabaseServer) {
      return res.status(503).json({ error: 'Server not configured' });
    }

    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// ═══════════════════════════════════════════
// 🔒 SECURITY: Rate limiting
// ═══════════════════════════════════════════
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    record.count++;
    next();
  };
};

const ALLOWED_EXTENSIONS = ['.glb', '.gltf', '.usdz', '.jpg', '.jpeg', '.png', '.webp', '.heic', '.avif'];
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  }
});

const sanitizeError = (error: any): string => {
  if (process.env.NODE_ENV === 'production') return 'An internal error occurred.';
  return error?.message || 'Unknown error';
};

// PayPal Helpers
const getPayPalAccessToken = async () => {
  const clientId = process.env.VITE_PAYPAL_CLIENT_ID;
  const secretKey = process.env.PAYPAL_SECRET_KEY;
  if (!clientId || !secretKey) throw new Error('PayPal credentials missing');
  const isSandbox = !process.env.PAYPAL_LIVE_MODE;
  const baseURL = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  const auth = Buffer.from(`${clientId}:${secretKey}`).toString('base64');
  const response = await fetch(`${baseURL}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json();
  return { token: data.access_token, baseURL };
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // Only serve static uploads locally (not on Vercel)
  if (!IS_VERCEL) {
    app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
  }

  app.get('/api/health', (req, res) => res.json({ status: 'ok', env: IS_VERCEL ? 'vercel' : 'local' }));

  // ═══════════════════════════════════════════
  // 💳 PayPal Routes
  // ═══════════════════════════════════════════
  app.post('/api/paypal/setup-token', requireAuth, async (req: any, res: any) => {
    try {
      const { token, baseURL } = await getPayPalAccessToken();
      const response = await fetch(`${baseURL}/v3/vault/setup-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ payment_source: { card: {} } })
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: sanitizeError(err) });
    }
  });

  app.post('/api/paypal/create-subscription', requireAuth, async (req: any, res: any) => {
    try {
      const { vaultSetupToken, planId } = req.body;
      const { token, baseURL } = await getPayPalAccessToken();
      const response = await fetch(`${baseURL}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan_id: planId, payment_source: { token: { id: vaultSetupToken, type: 'SETUP_TOKEN' } } })
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: sanitizeError(err) });
    }
  });

  // ═══════════════════════════════════════════
  // ☁️ Presigned URL — Client uploads DIRECTLY to R2 (bypasses Vercel 4.5MB limit)
  // ═══════════════════════════════════════════
  app.post('/api/presign', requireAuth, rateLimit(30, 60000), async (req: any, res: any) => {
    try {
      const { filename, contentType } = req.body;
      if (!filename || !contentType) return res.status(400).json({ error: 'Missing filename or contentType' });

      const ext = path.extname(filename).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) return res.status(400).json({ error: 'Invalid file type' });

      const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ContentType: contentType,
      });

      const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
      const publicUrl = `${R2_PUBLIC_URL}/${key}`;

      res.json({ signedUrl, publicUrl, key });
    } catch (err: any) {
      console.error('[Presign Error]', err);
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  });

  // ☁️ Fallback: server-side upload for small files (< 4MB)
  app.post('/api/upload', requireAuth, rateLimit(20, 60000), upload.single('file'), async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file' });
      const ext = path.extname(req.file.originalname).toLowerCase();
      const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      
      await r2Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }));

      res.json({ url: `${R2_PUBLIC_URL}/${key}` });
    } catch (err: any) {
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  // ☁️ Presigned URL for 3D models (large files)
  app.post('/api/dishes/:id/model3d/presign', requireAuth, rateLimit(10, 60000), async (req: any, res: any) => {
    try {
      if (!supabaseServer) return res.status(503).json({ error: 'Server not configured' });

      const { data: userData } = await supabaseServer.from('users').select('restaurant_id').eq('id', req.user.id).single();
      const key = `models/${userData?.restaurant_id || 'unknown'}/${req.params.id}-${Date.now()}.glb`;

      const command = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ContentType: 'model/gltf-binary',
      });

      const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 600 });
      const publicUrl = `${R2_PUBLIC_URL}/${key}`;

      res.json({ signedUrl, publicUrl, key });
    } catch (err: any) {
      console.error('[3D Presign Error]', err);
      res.status(500).json({ error: '3D presign failed' });
    }
  });

  // ☁️ Confirm 3D model upload (update DB after direct upload)
  app.post('/api/dishes/:id/model3d/confirm', requireAuth, async (req: any, res: any) => {
    try {
      if (!supabaseServer) return res.status(503).json({ error: 'Server not configured' });
      const { publicUrl } = req.body;
      if (!publicUrl) return res.status(400).json({ error: 'Missing publicUrl' });

      await supabaseServer.from('dishes').update({ model_3d_url: publicUrl, model_3d_status: 'READY' }).eq('id', req.params.id);
      res.json({ modelUrl: publicUrl, status: 'READY' });
    } catch (err: any) {
      res.status(500).json({ error: '3D confirm failed' });
    }
  });

  // ☁️ Legacy: server-side 3D upload (fallback for small models)
  app.post('/api/dishes/:id/model3d', requireAuth, rateLimit(10, 60000), upload.single('file'), async (req: any, res: any) => {
    try {
      if (!req.file || !supabaseServer) return res.status(400).json({ error: 'Missing file or server config' });
      
      const { data: userData } = await supabaseServer.from('users').select('restaurant_id').eq('id', req.user.id).single();
      const key = `models/${userData.restaurant_id}/${req.params.id}-${Date.now()}.glb`;

      await r2Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: 'model/gltf-binary'
      }));

      const publicUrl = `${R2_PUBLIC_URL}/${key}`;
      await supabaseServer.from('dishes').update({ model_3d_url: publicUrl, model_3d_status: 'READY' }).eq('id', req.params.id);

      res.json({ modelUrl: publicUrl, status: 'READY' });
    } catch (err: any) {
      res.status(500).json({ error: '3D Upload failed' });
    }
  });

  // ═══════════════════════════════════════════
  // 🖨️ QR & AI
  // ═══════════════════════════════════════════
  app.post('/api/qr/generate', requireAuth, async (req: any, res) => {
    try {
      const { restaurantSlug, tableNumber, origin } = req.body;
      const qrData = `${origin || 'https://tablexapp.com'}/menu/${restaurantSlug}?table=${tableNumber}`;
      const qrSvg = await QRCode.toString(qrData, { type: 'svg' });
      res.json({ svg: Buffer.from(qrSvg).toString('base64'), qrData });
    } catch (err) { res.status(500).json({ error: 'QR Failed' }); }
  });

  app.post('/api/ai/generate', requireAuth, async (req: any, res) => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: req.body.prompt }] }] })
      });
      res.json(await response.json());
    } catch (err) { res.status(500).json({ error: 'AI Failed' }); }
  });

  // ═══════════════════════════════════════════
  // 🧊 Stability AI — Stable Fast 3D Generation
  // ═══════════════════════════════════════════
  // Single POST → returns GLB directly (~5-15s). No polling needed.
  // Cost: ~$0.10 per model (10 credits)
  // Endpoint: https://api.stability.ai/v2beta/3d/stable-fast-3d
  // ═══════════════════════════════════════════
  const STABILITY_BASE = 'https://api.stability.ai/v2beta/3d/stable-fast-3d';
  const STABILITY_KEY  = process.env.STABILITY_API_KEY || '';

  app.post('/api/dishes/:id/generate-3d', requireAuth, rateLimit(5, 60000), async (req: any, res: any) => {
    try {
      if (!STABILITY_KEY) {
        return res.status(503).json({ error: 'Stability AI API key not configured' });
      }
      if (!supabaseServer) {
        return res.status(503).json({ error: 'Server not configured' });
      }

      const dishId = req.params.id;

      // ── 1. Auth & ownership check ──────────────────────────
      const { data: userData } = await supabaseServer
        .from('profiles')
        .select('restaurant_id')
        .eq('id', req.user.id)
        .single();

      if (!userData?.restaurant_id) {
        return res.status(401).json({ error: 'Restaurant not found' });
      }

      const { data: dish } = await supabaseServer
        .from('dishes')
        .select('id, image_url, images')
        .eq('id', dishId)
        .eq('restaurant_id', userData.restaurant_id)
        .single();

      if (!dish) {
        return res.status(404).json({ error: 'Dish not found' });
      }

      const imageUrl = dish.image_url || (dish.images && dish.images[0]);
      if (!imageUrl) {
        return res.status(400).json({ error: 'Upload at least one dish image first' });
      }

      // ── 2. Mark dish as PROCESSING ─────────────────────────
      await supabaseServer
        .from('dishes')
        .update({ model_3d_status: 'PROCESSING' })
        .eq('id', dishId);

      // ── 3. Download the dish image ─────────────────────────
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        await supabaseServer.from('dishes').update({ model_3d_status: 'ERROR' }).eq('id', dishId);
        return res.status(502).json({ error: 'Failed to download dish image' });
      }

      const imgArrayBuffer = await imgRes.arrayBuffer();
      const imgBuffer = Buffer.from(imgArrayBuffer);
      const imgContentType = imgRes.headers.get('content-type') || 'image/jpeg';

      // Determine file extension from content type
      const extMap: Record<string, string> = {
        'image/jpeg': 'jpg', 'image/png': 'png',
        'image/webp': 'webp', 'image/avif': 'avif',
      };
      const imgExt = extMap[imgContentType] || 'jpg';

      // ── 4. Send to Stability AI (multipart/form-data) ──────
      // Node.js 18+ has built-in FormData + Blob
      const formData = new FormData();
      formData.append('image', new Blob([imgBuffer], { type: imgContentType }), `dish.${imgExt}`);
      formData.append('texture_resolution', '1024');
      formData.append('foreground_ratio', '0.9');

      const stabilityRes = await fetch(STABILITY_BASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STABILITY_KEY}`,
          'Accept': 'application/octet-stream',
        },
        body: formData,
      });

      if (!stabilityRes.ok) {
        const errText = await stabilityRes.text().catch(() => '');
        let errMsg = `Stability AI error (${stabilityRes.status})`;
        try { errMsg = JSON.parse(errText).message || errMsg; } catch {}

        await supabaseServer.from('dishes').update({ model_3d_status: 'ERROR' }).eq('id', dishId);
        return res.status(502).json({ error: errMsg });
      }

      // ── 5. Receive GLB binary directly ─────────────────────
      const glbArrayBuffer = await stabilityRes.arrayBuffer();
      const glbBuffer = Buffer.from(glbArrayBuffer);

      if (glbBuffer.length < 100) {
        await supabaseServer.from('dishes').update({ model_3d_status: 'ERROR' }).eq('id', dishId);
        return res.status(502).json({ error: 'Received empty or invalid GLB from Stability AI' });
      }

      // ── 6. Upload GLB to R2 ────────────────────────────────
      const key = `models/${userData.restaurant_id}/${dishId}-ai-${Date.now()}.glb`;

      await r2Client.send(new PutObjectCommand({
        Bucket      : R2_BUCKET,
        Key         : key,
        Body        : glbBuffer,
        ContentType : 'model/gltf-binary',
        CacheControl: 'public, max-age=31536000, immutable',
      }));

      const publicUrl = `${R2_PUBLIC_URL}/${key}`;

      // ── 7. Update dish in DB ───────────────────────────────
      await supabaseServer
        .from('dishes')
        .update({
          model_3d_url        : publicUrl,
          model_3d_status     : 'READY',
          model_3d_size_kb    : Math.round(glbBuffer.length / 1024),
          model_3d_uploaded_at: new Date().toISOString(),
          is_ai_generated     : true,
        })
        .eq('id', dishId);

      console.log(`[3D AI] ✓ Generated for dish ${dishId} — ${Math.round(glbBuffer.length / 1024)}KB`);

      return res.json({
        status    : 'SUCCEEDED',
        model3dUrl: publicUrl,
        sizeKb    : Math.round(glbBuffer.length / 1024),
      });

    } catch (err: any) {
      console.error('[3D AI Error]', err);
      // Try to mark dish as error
      if (supabaseServer) {
        try {
          await supabaseServer.from('dishes')
            .update({ model_3d_status: 'ERROR' })
            .eq('id', req.params.id);
        } catch { /* ignore cleanup errors */ }
      }
      return res.status(500).json({ error: sanitizeError(err) });
    }
  });

  // ── Vite / Static (local dev only, NOT on Vercel) ──────────────
  if (!IS_VERCEL) {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
      app.use(vite.middlewares);
    } else {
      app.use(express.static('dist'));
      app.get('*', (req, res) => res.sendFile(path.join(process.cwd(), 'dist', 'index.html')));
    }

    app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on http://0.0.0.0:${PORT}`));

    // ── HTTPS + self-signed (for mobile camera/AR) ─────────────────
    try {
      const selfsigned = await import('selfsigned');
      const https = await import('https');
      const attrs = [{ name: 'commonName', value: 'tablex.local' }];
      const cert = (selfsigned as any).generate(attrs, { days: 365 });
      const httpsServer = https.createServer({ key: cert.private as string, cert: cert.cert as string }, app);
      const HTTPS_PORT = 3443;
      httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => console.log(`🔒 Server on https://0.0.0.0:${HTTPS_PORT}`));
    } catch (err) {
      console.warn('[HTTPS] Skipped — selfsigned failed');
    }
  }

  return app;
}

// On Vercel: only export, never listen
// Locally: start the server
if (!IS_VERCEL) startServer();
export default startServer;
