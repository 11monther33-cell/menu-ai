// Standalone Vercel Serverless API — no dependency on server.ts
// This file handles ALL /api/* routes on Vercel
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import crypto from 'crypto';

// ── Encryption Helper for WhatsApp Access Tokens ──────────
const ENCRYPTION_KEY = process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'visiono_secure_default_key_32b!';
function getSecretKey() {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

function encryptToken(token: string): string {
  if (!token) return '';
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', getSecretKey(), iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    return token;
  }
}

function decryptToken(encryptedData: string): string {
  if (!encryptedData) return '';
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return encryptedData;
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    const decipher = crypto.createDecipheriv('aes-256-gcm', getSecretKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return encryptedData;
  }
}

// ── Vercel config: allow up to 5MB request body ─────────
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

// ── R2 Setup & Validation ──────────────────────────────────
function cleanEnv(val: string | undefined): string {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
}

let r2Endpoint = cleanEnv(process.env.R2_ENDPOINT);
// Auto-fix common copy-paste typo where '.com' is truncated to '.co'
if (r2Endpoint && r2Endpoint.endsWith('.co')) {
  r2Endpoint += 'm';
}

const r2AccessKey = cleanEnv(process.env.R2_ACCESS_KEY_ID);
const r2SecretKey = cleanEnv(process.env.R2_SECRET_ACCESS_KEY);
const BUCKET = cleanEnv(process.env.R2_BUCKET) || 'tablex-assets';
const CDN = cleanEnv(process.env.R2_PUBLIC_URL);

let r2: S3Client | null = null;
let r2InitError: string | null = null;

try {
  if (!r2Endpoint || !r2AccessKey || !r2SecretKey) {
    throw new Error('Missing R2 credentials');
  }
  new URL(r2Endpoint);
  r2 = new S3Client({
    region: 'auto',
    endpoint: r2Endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: r2AccessKey, secretAccessKey: r2SecretKey },
  });
} catch (err: any) {
  r2InitError = err.message || 'Failed to initialize R2 client';
}

// ── Supabase ─────────────────────────────────────────────
const sbUrl = process.env.VITE_SUPABASE_URL || '';
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const sb = sbUrl && sbKey ? createClient(sbUrl, sbKey) : null;

// ── Auth helper ──────────────────────────────────────────
async function getUser(req: VercelRequest) {
  const h = req.headers.authorization;
  if (!sb) return { user: null, reason: 'Supabase keys missing in Vercel Env Vars' };
  if (!h || !h.startsWith('Bearer ')) return { user: null, reason: 'Missing Authorization header' };
  const token = h.replace('Bearer ', '');
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return { user: null, reason: `Auth error: ${error?.message || 'User not found'}` };
  return { user, reason: null };
}

// ── Allowed extensions ───────────────────────────────────
const EXTS = ['.glb', '.gltf', '.usdz', '.jpg', '.jpeg', '.png', '.webp', '.heic', '.avif'];
function ext(filename: string) {
  const i = filename.lastIndexOf('.');
  return i >= 0 ? filename.slice(i).toLowerCase() : '';
}

// ── PayPal helper ────────────────────────────────────────
async function paypalToken() {
  const cid = process.env.VITE_PAYPAL_CLIENT_ID;
  const sec = process.env.PAYPAL_SECRET_KEY;
  if (!cid || !sec) throw new Error('PayPal credentials missing');
  const base = process.env.PAYPAL_LIVE_MODE
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
  const r = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${cid}:${sec}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const d = await r.json();
  return { token: d.access_token, base };
}

// ── Server-side upload to R2 ─────────────────────────────
async function uploadToR2(base64Data: string, filename: string, contentType: string): Promise<string> {
  if (!r2 || r2InitError) {
    throw new Error(`R2 not configured: ${r2InitError}`);
  }

  const buffer = Buffer.from(base64Data, 'base64');
  const e = ext(filename);
  const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}${e}`;

  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return `${CDN}/${key}`;
}

// ═══════════════════════════════════════════════════════════
// Main handler — routes all /api/* requests
// ═══════════════════════════════════════════════════════════
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url || '';
  const method = req.method || 'GET';

  try {
    // ── Health ────────────────────────────────────────────
    if (url === '/api/health') {
      return res.json({
        status: 'ok',
        env: 'vercel',
        r2: r2 ? 'connected' : `error: ${r2InitError}`,
        supabase: sb ? 'connected' : 'missing keys',
      });
    }

    // ══════════════════════════════════════════════════════
    // SERVER-SIDE UPLOAD — No CORS issues!
    // Browser → Vercel API → R2 (all server-side)
    // ══════════════════════════════════════════════════════
    if ((url === '/api/upload' || url === '/api/presign') && method === 'POST') {
      const { user, reason } = await getUser(req);
      if (!user) return res.status(401).json({ error: `Auth failed: ${reason}` });

      const { filename, contentType, data } = req.body;
      if (!filename) return res.status(400).json({ error: 'Missing filename' });

      const e = ext(filename);
      if (!EXTS.includes(e)) return res.status(400).json({ error: 'Invalid file type' });

      // If client sent base64 data, upload server-side (NO CORS!)
      if (data) {
        const publicUrl = await uploadToR2(data, filename, contentType || 'application/octet-stream');
        return res.json({ url: publicUrl, publicUrl });
      }

      // Fallback: tell client to send data
      return res.status(400).json({ error: 'Missing file data. Send base64 in "data" field.' });
    }

    // ── 3D Model upload (server-side) ────────────────────
    if (url.match(/^\/api\/dishes\/[^/]+\/model3d\/upload$/) && method === 'POST') {
      const { user } = await getUser(req);
      if (!user || !sb) return res.status(401).json({ error: 'Auth required' });

      if (!r2 || r2InitError) {
        return res.status(500).json({ error: 'R2 not configured', detail: r2InitError });
      }

      const dishId = url.split('/')[3];
      const { data: base64Data, contentType } = req.body;
      if (!base64Data) return res.status(400).json({ error: 'Missing model data' });

      const { data: u } = await sb.from('users').select('restaurant_id').eq('id', user.id).single();
      const key = `models/${u?.restaurant_id || 'unknown'}/${dishId}-${Date.now()}.glb`;

      const buffer = Buffer.from(base64Data, 'base64');
      await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'model/gltf-binary',
      }));

      const publicUrl = `${CDN}/${key}`;
      await sb.from('dishes').update({ model_3d_url: publicUrl, model_3d_status: 'READY' }).eq('id', dishId);
      return res.json({ modelUrl: publicUrl, status: 'READY' });
    }

    // ── 3D Model confirm (legacy) ────────────────────────
    if (url.match(/^\/api\/dishes\/[^/]+\/model3d\/confirm$/) && method === 'POST') {
      const { user } = await getUser(req);
      if (!user || !sb) return res.status(401).json({ error: 'Auth required' });

      const dishId = url.split('/')[3];
      const { publicUrl } = req.body;
      if (!publicUrl) return res.status(400).json({ error: 'Missing publicUrl' });

      await sb.from('dishes').update({ model_3d_url: publicUrl, model_3d_status: 'READY' }).eq('id', dishId);
      return res.json({ modelUrl: publicUrl, status: 'READY' });
    }

    // ── PayPal setup-token ───────────────────────────────
    if (url === '/api/paypal/setup-token' && method === 'POST') {
      const { user } = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Auth required' });

      const { token, base } = await paypalToken();
      const r = await fetch(`${base}/v3/vault/setup-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ payment_source: { card: {} } }),
      });
      return res.json(await r.json());
    }

    // ── PayPal create-subscription ───────────────────────
    if (url === '/api/paypal/create-subscription' && method === 'POST') {
      const { user } = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Auth required' });

      const { vaultSetupToken, planId } = req.body;
      const { token, base } = await paypalToken();
      const r = await fetch(`${base}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan_id: planId, payment_source: { token: { id: vaultSetupToken, type: 'SETUP_TOKEN' } } }),
      });
      return res.json(await r.json());
    }

    // ── QR generate ──────────────────────────────────────
    if (url === '/api/qr/generate' && method === 'POST') {
      const { user } = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Auth required' });

      const { restaurantSlug, tableNumber, origin } = req.body;
      const qrData = `${origin || 'https://tablexapp.vercel.app'}/menu/${restaurantSlug}?table=${tableNumber}`;
      const qrSvg = await QRCode.toString(qrData, { type: 'svg' });
      return res.json({ svg: Buffer.from(qrSvg).toString('base64'), qrData });
    }

    // ── Device Pairing (Generate) ────────────────────────
    if (url === '/api/device-pairing/generate' && method === 'POST') {
      const { user } = await getUser(req);
      if (!user || !sb) return res.status(401).json({ error: 'Auth required' });

      const { productId } = req.body;
      const { data: profile } = await sb.from('profiles').select('restaurant_id').eq('id', user.id).single();
      if (!profile?.restaurant_id) return res.status(403).json({ error: 'No restaurant associated' });

      const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await sb.from('device_pairing_codes').insert({
        code: pairingCode,
        restaurant_id: profile.restaurant_id,
        product_id: productId || null,
        expires_at: expiresAt
      });

      return res.json({ pairingCode, expiresAt });
    }

    // ── Manual Restaurant Invite (Admin Only) ───────────────────
    if (url === '/api/admin/create-restaurant' && method === 'POST') {
      const { user, reason } = await getUser(req);
      if (!user || !sb) return res.status(401).json({ error: `Auth failed: ${reason}` });

      const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Super Admin access required' });
      }

      const { restaurantName, ownerEmail, subscriptionPlan } = req.body;
      if (!restaurantName || !ownerEmail || !subscriptionPlan) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // 1. Check if email already used
      const { data: existingUsers, error: userError } = await sb.auth.admin.listUsers();
      if (userError) return res.status(500).json({ error: 'Failed to verify email uniqueness' });
      
      if (existingUsers?.users.find((u: any) => u.email?.toLowerCase() === ownerEmail.toLowerCase())) {
        return res.status(409).json({ error: 'هذا البريد مستخدم بالفعل' });
      }

      // 2. Create placeholder auth user
      const tempPassword = crypto.randomUUID() + 'A1!'; // Secure temp password
      const { data: authData, error: authError } = await sb.auth.admin.createUser({
        email: ownerEmail.toLowerCase(),
        password: tempPassword,
        email_confirm: true
      });

      if (authError || !authData.user) {
        return res.status(500).json({ error: 'Failed to create owner account', detail: authError?.message });
      }

      const userId = authData.user.id;

      // 3. Create the restaurant record
      const { data: restaurant, error: restError } = await sb.from('restaurants').insert({
        owner_id: userId,
        name_ar: restaurantName,
        name_en: restaurantName,
        slug: restaurantName.toLowerCase().replace(/[\s_]+/g, '-'),
        plan: subscriptionPlan
      }).select().single();

      if (restError) {
        // Rollback user
        await sb.auth.admin.deleteUser(userId);
        // Handle slug collision gracefully
        if (restError.code === '23505' && restError.message.includes('slug')) {
          return res.status(409).json({ error: 'اسم المطعم مستخدم ومحجوز مسبقاً (رابط مكرر)' });
        }
        return res.status(500).json({ error: 'Failed to create restaurant', detail: restError.message });
      }

      // 3. Create one-time invite token
      const inviteToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      const { error: inviteError } = await sb.from('admin_invites').insert({
        restaurant_id: restaurant.id,
        email: ownerEmail.toLowerCase(),
        token: inviteToken,
        expires_at: expiresAt
      });

      if (inviteError) {
        // Rollback restaurant
        await sb.from('restaurants').delete().eq('id', restaurant.id);
        return res.status(500).json({ error: 'Failed to generate invite token' });
      }

      // Determine public URL from request context or env
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'visiono.vercel.app';
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const origin = process.env.VITE_APP_URL || `${protocol}://${host}`;

      const inviteLink = `${origin}/complete-signup?token=${inviteToken}`;
      return res.status(201).json({ restaurantId: restaurant.id, inviteLink });
    }

    // ── Complete Signup via Invite (Public) ──────────────────────
    if (url === '/api/auth/complete-invite' && method === 'POST') {
      if (!sb) return res.status(500).json({ error: 'Supabase missing' });
      
      const { token, password } = req.body;
      if (!token || !password) return res.status(400).json({ error: 'Missing token or password' });

      // 1. Validate token
      const { data: invite } = await sb.from('admin_invites')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();
        
      if (!invite) return res.status(401).json({ error: 'Invalid or expired invite link. Please contact support.' });

      // Get the restaurant to find the owner_id
      const { data: restaurant } = await sb.from('restaurants').select('owner_id').eq('id', invite.restaurant_id).single();
      if (!restaurant || !restaurant.owner_id) return res.status(500).json({ error: 'Restaurant data corrupted' });
      const uid = restaurant.owner_id;

      // 2. Update the auth user password securely via Admin API
      const { error: authError } = await sb.auth.admin.updateUserById(uid, {
        password: password
      });

      if (authError) {
        return res.status(500).json({ error: 'Failed to set secure password', detail: authError.message });
      }

      // 3. Create Profile mapped to the restaurant
      const { error: profileError } = await sb.from('profiles').insert({
        id: uid,
        email: invite.email,
        name: 'Restaurant Owner', // Default name
        restaurant_id: invite.restaurant_id,
        // role is handled by DB triggers (defaults to RESTAURANT_OWNER)
      });

      if (profileError) {
        return res.status(500).json({ error: 'Failed to create user profile' });
      }

      // 4. Mark invite as used
      await sb.from('admin_invites').update({ used: true }).eq('token', token);

      return res.json({ success: true, message: 'Account successfully configured.' });
    }

    // ── Device Pairing (Auth) ────────────────────────────
    if (url === '/api/auth/device-pair' && method === 'POST') {
      if (!sb) return res.status(500).json({ error: 'Supabase missing' });
      const { pairingCode } = req.body;
      
      const { data: pairing } = await sb.from('device_pairing_codes')
        .select('*')
        .eq('code', pairingCode)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();
        
      if (!pairing) return res.status(401).json({ error: 'Invalid or expired code' });
      
      await sb.from('device_pairing_codes').update({ used: true }).eq('code', pairingCode);
      
      return res.json({
        accessToken: `dev_${pairing.restaurant_id}_${Date.now()}`,
        refreshToken: 'dummy_refresh',
        restaurantId: pairing.restaurant_id,
        preselectedProductId: pairing.product_id,
        expiresIn: 3600 * 24 * 365,
      });
    }

    // ── 3D Model Status ──────────────────────────────────
    const statusMatch = url.match(/^\/api\/products\/([^/]+)\/3d-model\/status$/);
    if (statusMatch && method === 'GET') {
      if (!sb) return res.status(500).json({ error: 'Supabase missing' });
      const { data: model } = await sb.from('product_3d_models')
        .select('status, glb_url, usdz_url, thumbnail_url')
        .eq('product_id', statusMatch[1])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!model) return res.status(404).json({ error: 'No model found' });
      return res.json(model);
    }

    // ── AI generate ──────────────────────────────────────
    if (url === '/api/ai/generate' && method === 'POST') {
      const { user } = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Auth required' });

      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: req.body.prompt }] }] }),
        }
      );
      return res.json(await r.json());
    }

    // ═══════════════════════════════════════════════════════
    // 🧊 Stability AI — Stable Fast 3D Generation
    // ═══════════════════════════════════════════════════════
    const STABILITY_BASE = 'https://api.stability.ai/v2beta/3d/stable-fast-3d';
    const STABILITY_KEY  = process.env.STABILITY_API_KEY || '';

    const gen3dMatch = url.match(/^\/api\/dishes\/([^/]+)\/generate-3d$/);
    if (gen3dMatch && method === 'POST') {
      const { user } = await getUser(req);
      if (!user || !sb) return res.status(401).json({ error: 'Auth required' });
      if (!STABILITY_KEY) return res.status(503).json({ error: 'Stability AI API key not configured' });
      if (!r2 || r2InitError) return res.status(500).json({ error: 'R2 not configured', detail: r2InitError });

      const dishId = gen3dMatch[1];
      
      // Parse body to see if imageUrl is passed directly
      let bodyData: any = {};
      try {
        bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      } catch (e) {}

      let imageUrl = bodyData.imageUrl;
      const imageBase64 = bodyData.imageBase64;
      const imageContentType = bodyData.imageContentType || 'image/jpeg';

      // 1. Auth & ownership
      const { data: userData } = await sb
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.restaurant_id) {
        return res.status(401).json({ error: 'Restaurant not found' });
      }

      // If no direct image was provided, try to fetch from DB
      if (!imageBase64 && !imageUrl && dishId !== 'new') {
        const { data: dish } = await sb
          .from('dishes')
          .select('id, image_url, images')
          .eq('id', dishId)
          .eq('restaurant_id', userData.restaurant_id)
          .single();

        if (!dish) return res.status(404).json({ error: 'Dish not found' });
        imageUrl = dish.image_url || (dish.images && dish.images[0]);
      }

      if (!imageBase64 && !imageUrl) return res.status(400).json({ error: 'Upload at least one dish image first' });

      // 2. Mark as processing (only if dish exists in DB)
      if (dishId !== 'new') {
        await sb.from('dishes').update({ model_3d_status: 'PROCESSING' }).eq('id', dishId);
      }

      // 3. Get image buffer — either from base64 or by downloading
      let imgBuffer: Buffer;
      let imgContentType: string;

      if (imageBase64) {
        // Image was sent directly from the client — no download needed!
        imgBuffer = Buffer.from(imageBase64, 'base64');
        imgContentType = imageContentType;
      } else {
        // Download from URL (fallback)
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) {
          if (dishId !== 'new') await sb.from('dishes').update({ model_3d_status: 'ERROR' }).eq('id', dishId);
          return res.status(502).json({ error: 'Failed to download dish image' });
        }
        imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        imgContentType = imgRes.headers.get('content-type') || 'image/jpeg';
      }

      const extMap: Record<string, string> = {
        'image/jpeg': 'jpg', 'image/png': 'png',
        'image/webp': 'webp', 'image/avif': 'avif',
      };
      const imgExt = extMap[imgContentType] || 'jpg';

      // 4. Send to Stability AI
      const formData = new FormData();
      formData.append('image', new Blob([imgBuffer], { type: imgContentType }), `dish.${imgExt}`);
      formData.append('texture_resolution', '512');
      formData.append('foreground_ratio', '0.85');

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
        if (dishId !== 'new') await sb.from('dishes').update({ model_3d_status: 'ERROR' }).eq('id', dishId);
        return res.status(502).json({ error: errMsg });
      }

      // 5. Receive GLB binary
      const glbBuffer = Buffer.from(await stabilityRes.arrayBuffer());
      if (glbBuffer.length < 100) {
        if (dishId !== 'new') await sb.from('dishes').update({ model_3d_status: 'ERROR' }).eq('id', dishId);
        return res.status(502).json({ error: 'Received empty GLB from Stability AI' });
      }

      // 6. Upload to R2
      const key = `models/${userData.restaurant_id}/${dishId}-ai-${Date.now()}.glb`;
      await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: glbBuffer,
        ContentType: 'model/gltf-binary',
        CacheControl: 'public, max-age=31536000, immutable',
      }));

      const publicUrl = `${CDN}/${key}`;

      // 7. Update DB
      if (dishId !== 'new') {
        await sb.from('dishes').update({
          model_3d_url: publicUrl,
          model_3d_status: 'READY',
          model_3d_size_kb: Math.round(glbBuffer.length / 1024),
          model_3d_uploaded_at: new Date().toISOString(),
          is_ai_generated: true,
        }).eq('id', dishId);
      }

      return res.json({
        status: 'SUCCEEDED',
        model3dUrl: publicUrl,
        sizeKb: Math.round(glbBuffer.length / 1024),
      });
    }

    // ═══════════════════════════════════════════════════════════
    // POST /api/import-menu-pdf — AI-powered PDF menu extraction
    // ═══════════════════════════════════════════════════════════
    if (url === '/api/import-menu-pdf' && req.method === 'POST') {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await sb.auth.getUser(token);
      
      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Read raw body as buffer (PDF file from FormData)
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const body = Buffer.concat(chunks);

      // Extract file from multipart (simplified: find PDF content)
      // Find the PDF data between boundaries
      const bodyStr = body.toString('latin1');
      const contentTypeHeader = req.headers['content-type'] || '';
      const boundaryMatch = contentTypeHeader.match(/boundary=(.+)/);
      
      if (!boundaryMatch) {
        return res.status(400).json({ error: 'Missing multipart boundary' });
      }

      const boundary = boundaryMatch[1];
      const parts = bodyStr.split(`--${boundary}`);
      let pdfBuffer: Buffer | null = null;

      for (const part of parts) {
        if (part.includes('application/pdf') || part.includes('.pdf')) {
          const headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd !== -1) {
            const dataStr = part.substring(headerEnd + 4);
            // Remove trailing boundary markers
            const cleanData = dataStr.replace(/\r\n--.*$/, '').replace(/\r\n$/, '');
            pdfBuffer = Buffer.from(cleanData, 'latin1');
          }
        }
      }

      if (!pdfBuffer || pdfBuffer.length === 0) {
        return res.status(400).json({ error: 'No PDF file found in request' });
      }

      // Convert to base64 for Gemini
      const pdfBase64 = pdfBuffer.toString('base64');

      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      }

      // Call Gemini with the PDF
      const geminiResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: pdfBase64
                  }
                },
                {
                  text: `You are a restaurant menu parser. Extract ALL dishes/items from this menu PDF.

For each dish, extract:
- name_ar: Arabic name (if present)
- name_en: English name (if present)  
- price: numeric price (just the number, no currency symbols)
- category: the category/section this dish belongs to
- description_ar: Arabic description (if present)
- description_en: English description (if present)

Return ONLY valid JSON in this exact format, no markdown, no explanation:
{
  "dishes": [
    {
      "name_ar": "...",
      "name_en": "...",
      "price": 12.5,
      "category": "...",
      "description_ar": "...",
      "description_en": "..."
    }
  ]
}

Rules:
- Extract EVERY dish you can find, do not skip any
- If the menu is only in Arabic, put the name in name_ar and leave name_en empty
- If the menu is only in English, put the name in name_en and leave name_ar empty
- Price must be a number (e.g. 12.5 not "12.5 OMR")
- If no price is visible for a dish, set price to 0
- Category should be the section heading the dish appears under`
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8192
            }
          })
        }
      );

      if (!geminiResp.ok) {
        const errText = await geminiResp.text();
        console.error('[Gemini PDF Error]', errText);
        return res.status(500).json({ error: 'Gemini extraction failed' });
      }

      const geminiData = await geminiResp.json();
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Parse JSON from response (strip markdown code fences if present)
      let parsed;
      try {
        const jsonStr = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.error('[Gemini Parse Error]', rawText);
        return res.status(500).json({ error: 'Failed to parse Gemini response', raw: rawText.substring(0, 500) });
      }

      return res.json(parsed);
    }

    // ══════════════════════════════════════════════════════
    // WHATSAPP SALES AGENT & META QR API ROUTES
    // ══════════════════════════════════════════════════════

    // ── Meta Webhook Verification (GET) ─────────────────
    if (url.startsWith('/api/whatsapp/webhook') && method === 'GET') {
      const query = new URLSearchParams(url.split('?')[1] || '');
      const mode = query.get('hub.mode');
      const token = query.get('hub.verify_token');
      const challenge = query.get('hub.challenge');

      const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'visiono_wa_verify_token';

      if (mode === 'subscribe' && token === expectedToken) {
        return res.status(200).send(challenge);
      }
      return res.status(403).json({ error: 'Verification failed' });
    }

    // ── Meta Webhook Receiver (POST) ─────────────────────
    if (url.startsWith('/api/whatsapp/webhook') && method === 'POST') {
      if (!sb) return res.status(500).json({ error: 'Supabase client missing' });

      const body = req.body;
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];

      if (!message) {
        return res.status(200).json({ status: 'ok', detail: 'No message payload' });
      }

      const metaPhoneNumberId = value?.metadata?.phone_number_id;
      const customerPhone = message.from;
      const customerName = value?.contacts?.[0]?.profile?.name || customerPhone;
      const messageText = message.text?.body || '';
      const metaMessageId = message.id;

      if (!messageText || !metaPhoneNumberId) {
        return res.status(200).json({ status: 'ok', detail: 'Missing text or phone number ID' });
      }

      // Find branch matching whatsapp_phone_number_id
      const { data: branch } = await sb
        .from('pos_branches')
        .select('id, restaurant_id, whatsapp_phone_number_id, whatsapp_access_token, whatsapp_enabled')
        .eq('whatsapp_phone_number_id', metaPhoneNumberId)
        .maybeSingle();

      if (!branch || !branch.whatsapp_enabled) {
        return res.status(200).json({ status: 'ignored', reason: 'Branch not connected or AI disabled' });
      }

      const decryptedToken = decryptToken(branch.whatsapp_access_token);

      // Find or create conversation
      let { data: conv } = await sb
        .from('whatsapp_conversations')
        .select('id')
        .eq('branch_id', branch.id)
        .eq('customer_phone', customerPhone)
        .maybeSingle();

      if (!conv) {
        const { data: newConv } = await sb
          .from('whatsapp_conversations')
          .insert({
            branch_id: branch.id,
            customer_phone: customerPhone,
            customer_name: customerName,
            last_message_at: new Date().toISOString(),
          })
          .select()
          .single();
        conv = newConv;
      } else {
        await sb
          .from('whatsapp_conversations')
          .update({
            last_message_at: new Date().toISOString(),
            customer_name: customerName,
          })
          .eq('id', conv.id);
      }

      // Save customer message
      await sb.from('whatsapp_messages').insert({
        conversation_id: conv.id,
        sender_type: 'customer',
        message_text: messageText,
        meta_message_id: metaMessageId,
      });

      // Grounding Data: Fetch dishes & products
      const { data: dishes } = await sb
        .from('dishes')
        .select('name_ar, name_en, price, description_ar, description_en, available')
        .eq('restaurant_id', branch.restaurant_id)
        .eq('available', true);

      const { data: products } = await sb
        .from('pos_products')
        .select('name, selling_price, description, is_active')
        .eq('branch_id', branch.id)
        .eq('is_active', true);

      // Grounding Data: Fetch FAQs
      const { data: faqs } = await sb
        .from('pos_branch_faq')
        .select('question, answer')
        .eq('branch_id', branch.id)
        .eq('is_active', true);

      const menuSummary = [
        ...(dishes || []).map(d => `- ${d.name_ar || d.name_en} (${d.price} OMR/SAR): ${d.description_ar || d.description_en || 'لا يوجد وصف'}`),
        ...(products || []).map(p => `- ${p.name} (${p.selling_price} OMR/SAR): ${p.description || ''}`)
      ].join('\n');

      const faqSummary = (faqs || []).map(f => `س: ${f.question}\nج: ${f.answer}`).join('\n\n');

      // Call Gemini for grounded AI reply
      const geminiKey = process.env.GEMINI_API_KEY;
      let aiReplyText = "شكراً لتواصلك معنا! يسعدنا خدمتك في مطعمنا.";

      if (geminiKey) {
        try {
          const aiPrompt = `أنت موظف مبيعات وخدمة عملاء ذكي، مهذب، وسريع الاستجابة لمطعم عبر الواتساب.
استخدم البيانات الحقيقية فقط المذكورة أدناه للرد على الزبون.

قائمة الطعام المتاحة حالياً:
${menuSummary || 'لا تتوفر أصناف حالياً'}

الأسئلة الشائعة ومعلومات الفرع:
${faqSummary || 'لا تتوفر أسئلة شائعة حالياً'}

قواعد صارمة:
1. تجنب الهلوسة نهائياً: إذا سأل الزبون عن طبق أو خدمة غير موجودة في المنيو أو الأسئلة الشائعة، قل له بكل صراحة ولباقة أن هذا الصنف غير متوفر حالياً لدينا.
2. أسعار المنيو والخدمات ومكونات الأطباق يجب أن تكون دقيقة 100% حسب البيانات المرفقة.
3. إذا أبدى الزبون رغبته الصريحة في الطلب (مثال: "أبي 2 برجر لحم وعصير")، رحب بطلبه وأكد له الأطباق والسعر الإجمالي واطلب منه تأكيد الطلب.
4. حافظ على نبرة ترحيبية قصيرة ومناسبة لمحادثات الواتساب باللغة العربية.

رسالة الزبون الحالية: "${messageText}"`;

          const aiResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: aiPrompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 500 }
              })
            }
          );
          if (aiResp.ok) {
            const aiData = await aiResp.json();
            const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) aiReplyText = text.trim();
          }
        } catch (err) {
          console.error('[WhatsApp AI Error]', err);
        }
      }

      // Order Intent Check & Order Request Creation
      const orderIntentKeywords = ['أطلب', 'طلب', 'أبي', 'اريد', 'أريد', 'احجز', 'اشتري'];
      const containsOrderKeyword = orderIntentKeywords.some(kw => messageText.includes(kw));

      if (containsOrderKeyword) {
        await sb.from('pos_order_requests').insert({
          branch_id: branch.id,
          customer_phone: customerPhone,
          customer_name: customerName,
          order_summary: messageText,
          status: 'pending',
        });
      }

      // Send response back to Meta Messages API
      if (decryptedToken) {
        try {
          await fetch(`https://graph.facebook.com/v24.0/${metaPhoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${decryptedToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: customerPhone,
              text: { body: aiReplyText },
            }),
          });
        } catch (sendErr) {
          console.error('[Meta Message Send Error]', sendErr);
        }
      }

      // Save AI reply to database
      await sb.from('whatsapp_messages').insert({
        conversation_id: conv.id,
        sender_type: 'ai',
        message_text: aiReplyText,
      });

      return res.status(200).json({ status: 'success', reply: aiReplyText });
    }

    // ── Save WhatsApp Connection Settings ────────────────
    if (url === '/api/whatsapp/connection' && method === 'POST') {
      const { user } = await getUser(req);
      if (!user || !sb) return res.status(401).json({ error: 'Auth required' });

      const { branchId, whatsappPhoneNumberId, whatsappAccessToken, whatsappNumber, whatsappEnabled } = req.body;
      if (!branchId) return res.status(400).json({ error: 'Missing branchId' });

      const updateData: any = {
        whatsapp_phone_number_id: whatsappPhoneNumberId,
        whatsapp_number: whatsappNumber,
        whatsapp_enabled: !!whatsappEnabled,
      };

      if (whatsappAccessToken) {
        updateData.whatsapp_access_token = encryptToken(whatsappAccessToken);
      }

      const { data, error } = await sb
        .from('pos_branches')
        .update(updateData)
        .eq('id', branchId)
        .select('id, whatsapp_phone_number_id, whatsapp_number, whatsapp_enabled, whatsapp_access_token')
        .single();

      if (error) return res.status(500).json({ error: error.message });

      return res.json({
        success: true,
        branch: {
          id: data.id,
          whatsappPhoneNumberId: data.whatsapp_phone_number_id,
          whatsappNumber: data.whatsapp_number,
          whatsappEnabled: data.whatsapp_enabled,
          hasToken: !!data.whatsapp_access_token,
        }
      });
    }

    // ── Get WhatsApp Connection Status ────────────────────
    if (url.startsWith('/api/whatsapp/connection') && method === 'GET') {
      const { user } = await getUser(req);
      if (!user || !sb) return res.status(401).json({ error: 'Auth required' });

      const query = new URLSearchParams(url.split('?')[1] || '');
      const branchId = query.get('branchId');
      if (!branchId) return res.status(400).json({ error: 'Missing branchId' });

      const { data, error } = await sb
        .from('pos_branches')
        .select('id, whatsapp_phone_number_id, whatsapp_number, whatsapp_enabled, whatsapp_access_token')
        .eq('id', branchId)
        .maybeSingle();

      if (error) return res.status(500).json({ error: error.message });

      return res.json({
        branchId: data?.id,
        whatsappPhoneNumberId: data?.whatsapp_phone_number_id || '',
        whatsappNumber: data?.whatsapp_number || '',
        whatsappEnabled: !!data?.whatsapp_enabled,
        hasToken: !!data?.whatsapp_access_token,
      });
    }

    // ── Generate Meta Official QR Code ────────────────────
    if (url === '/api/whatsapp/generate-qr' && method === 'POST') {
      const { user } = await getUser(req);
      if (!user || !sb) return res.status(401).json({ error: 'Auth required' });

      const { branchId, prefilledMessage } = req.body;
      if (!branchId) return res.status(400).json({ error: 'Missing branchId' });

      const { data: branch } = await sb
        .from('pos_branches')
        .select('whatsapp_phone_number_id, whatsapp_access_token')
        .eq('id', branchId)
        .maybeSingle();

      if (!branch?.whatsapp_phone_number_id || !branch?.whatsapp_access_token) {
        return res.status(400).json({ error: 'لم يتم ربط رقم واتساب لهـذا الفرع بعد' });
      }

      const decryptedToken = decryptToken(branch.whatsapp_access_token);

      const metaResp = await fetch(
        `https://graph.facebook.com/v24.0/${branch.whatsapp_phone_number_id}/message_qrdls`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${decryptedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prefilled_message: prefilledMessage || 'مرحباً',
            generate_qr_image: 'SVG',
          }),
        }
      );

      const metaData = await metaResp.json();
      if (!metaResp.ok) {
        return res.status(metaResp.status).json({ error: metaData.error?.message || 'فشل توليد الكود من Meta' });
      }

      const qrRecord = metaData.data?.[0];
      if (!qrRecord) {
        return res.status(500).json({ error: 'لم يتم إرجاع بيانات الرمز من Meta' });
      }

      const { data: inserted, error: dbErr } = await sb
        .from('whatsapp_qr_codes')
        .insert({
          branch_id: branchId,
          meta_qr_code_id: qrRecord.code,
          deep_link_url: qrRecord.deep_link_url,
          prefilled_message: qrRecord.prefilled_message,
          qr_image_url: qrRecord.qr_image_url || null,
        })
        .select()
        .single();

      if (dbErr) return res.status(500).json({ error: dbErr.message });

      return res.status(201).json(inserted);
    }

    // ── Update Meta QR Code Prefilled Message ─────────────
    if (url === '/api/whatsapp/update-qr' && method === 'POST') {
      const { user } = await getUser(req);
      if (!user || !sb) return res.status(401).json({ error: 'Auth required' });

      const { branchId, qrCodeId, metaQrCodeId, prefilledMessage } = req.body;
      if (!branchId || !metaQrCodeId) return res.status(400).json({ error: 'Missing parameters' });

      const { data: branch } = await sb
        .from('pos_branches')
        .select('whatsapp_phone_number_id, whatsapp_access_token')
        .eq('id', branchId)
        .maybeSingle();

      if (!branch?.whatsapp_phone_number_id || !branch?.whatsapp_access_token) {
        return res.status(400).json({ error: 'لم يتم ربط رقم واتساب لهـذا الفرع بعد' });
      }

      const decryptedToken = decryptToken(branch.whatsapp_access_token);

      const metaResp = await fetch(
        `https://graph.facebook.com/v24.0/${branch.whatsapp_phone_number_id}/message_qrdls`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${decryptedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: metaQrCodeId,
            prefilled_message: prefilledMessage || 'مرحباً',
            generate_qr_image: 'SVG',
          }),
        }
      );

      const metaData = await metaResp.json();
      if (!metaResp.ok) {
        return res.status(metaResp.status).json({ error: metaData.error?.message || 'فشل تحديث الكود في Meta' });
      }

      const updatedQrRecord = metaData.data?.[0];

      const { data: updated, error: dbErr } = await sb
        .from('whatsapp_qr_codes')
        .update({
          prefilled_message: prefilledMessage,
          deep_link_url: updatedQrRecord?.deep_link_url || undefined,
          qr_image_url: updatedQrRecord?.qr_image_url || undefined,
        })
        .eq('id', qrCodeId)
        .select()
        .single();

      if (dbErr) return res.status(500).json({ error: dbErr.message });

      return res.json(updated);
    }

    // ── Delete Meta QR Code ──────────────────────────────
    if (url === '/api/whatsapp/delete-qr' && method === 'POST') {
      const { user } = await getUser(req);
      if (!user || !sb) return res.status(401).json({ error: 'Auth required' });

      const { branchId, qrCodeId, metaQrCodeId } = req.body;
      if (!branchId || !qrCodeId || !metaQrCodeId) return res.status(400).json({ error: 'Missing parameters' });

      const { data: branch } = await sb
        .from('pos_branches')
        .select('whatsapp_phone_number_id, whatsapp_access_token')
        .eq('id', branchId)
        .maybeSingle();

      if (branch?.whatsapp_phone_number_id && branch?.whatsapp_access_token) {
        const decryptedToken = decryptToken(branch.whatsapp_access_token);
        try {
          await fetch(
            `https://graph.facebook.com/v24.0/${branch.whatsapp_phone_number_id}/message_qrdls?code=${metaQrCodeId}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${decryptedToken}` },
            }
          );
        } catch (e) {
          console.error('[Meta Delete QR Error]', e);
        }
      }

      await sb.from('whatsapp_qr_codes').delete().eq('id', qrCodeId);
      return res.json({ success: true });
    }

    // ── List Active Meta QR Codes for Branch ──────────────
    if (url.startsWith('/api/whatsapp/qr-codes') && method === 'GET') {
      const { user } = await getUser(req);
      if (!user || !sb) return res.status(401).json({ error: 'Auth required' });

      const query = new URLSearchParams(url.split('?')[1] || '');
      const branchId = query.get('branchId');
      if (!branchId) return res.status(400).json({ error: 'Missing branchId' });

      const { data, error } = await sb
        .from('whatsapp_qr_codes')
        .select('*')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });

      return res.json(data || []);
    }

    // ── 404 ──────────────────────────────────────────────
    return res.status(404).json({ error: 'API route not found', url });

  } catch (err: any) {
    console.error('[API Error]', err);
    // Include the actual error message in the error field so it gets shown on the client
    return res.status(500).json({ error: `Internal server error: ${err.message}`, detail: err.message, stack: err.stack });
  }
}

