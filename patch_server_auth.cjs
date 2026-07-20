const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

// 1. Import jsonwebtoken
if (!content.includes("import jwt from 'jsonwebtoken';")) {
  content = content.replace("import dotenv from 'dotenv';", "import dotenv from 'dotenv';\nimport jwt from 'jsonwebtoken';");
}

// 2. Patch requireAuth
const oldRequireAuth = `const requireAuth = async (req: any, res: any, next: any) => {
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
};`;

const newRequireAuth = `const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Check if it's a custom device JWT
    try {
      const decoded = jwt.verify(token, process.env.VITE_SUPABASE_ANON_KEY || 'fallback') as any;
      if (decoded && decoded.role === 'DEVICE') {
        req.user = decoded;
        return next();
      }
    } catch (e) {
      // Not a valid device JWT, continue to Supabase auth
    }
    
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
};`;

if (content.includes(oldRequireAuth)) {
  content = content.replace(oldRequireAuth, newRequireAuth);
} else {
  console.log("Could not find requireAuth exactly. Let's do a more robust replace.");
  // robust replace
  content = content.replace(
    /const requireAuth = async \(req: any, res: any, next: any\) => \{[\s\S]*?req\.user = user;\n\s+next\(\);\n\s+\} catch \(err\) \{[\s\S]*?\}\n\};\n/g,
    newRequireAuth + "\n"
  );
}

// 3. Update iOS API: GET /api/products
// Look for checking restaurant_id
const oldCheckGetProducts = `const { data: userData } = await supabaseServer.from('profiles').select('restaurant_id').eq('id', req.user.id).single();
      if (userData?.restaurant_id !== restaurantId) return res.status(403).json({ error: 'Forbidden' });`;

const newCheckGetProducts = `let userRestaurantId = null;
      if (req.user.role === 'DEVICE') {
        userRestaurantId = req.user.restaurant_id;
      } else {
        const { data: userData } = await supabaseServer.from('profiles').select('restaurant_id').eq('id', req.user.id).single();
        userRestaurantId = userData?.restaurant_id;
      }
      if (userRestaurantId !== restaurantId) return res.status(403).json({ error: 'Forbidden' });`;

content = content.replace(oldCheckGetProducts, newCheckGetProducts);

// 4. Update iOS API: POST /api/products/:productId/3d-model
// We might not have restaurantId explicitly from body in POST, we have to look up the product first to check restaurant_id.
// Wait, the API checks ownership of the product.
const oldCheckPostProduct = `const { data: userData } = await supabaseServer.from('profiles').select('restaurant_id').eq('id', req.user.id).single();
      if (userData?.restaurant_id !== productData.restaurant_id) return res.status(403).json({ error: 'Forbidden' });`;

const newCheckPostProduct = `let userRestaurantId = null;
      if (req.user.role === 'DEVICE') {
        userRestaurantId = req.user.restaurant_id;
      } else {
        const { data: userData } = await supabaseServer.from('profiles').select('restaurant_id').eq('id', req.user.id).single();
        userRestaurantId = userData?.restaurant_id;
      }
      if (userRestaurantId !== productData.restaurant_id) return res.status(403).json({ error: 'Forbidden' });`;

content = content.replace(oldCheckPostProduct, newCheckPostProduct);


// 5. Add /api/auth/device-pair
const devicePairEndpoint = `
// ═══════════════════════════════════════════
// 🔒 DEVICE PAIRING API (iOS App)
// ═══════════════════════════════════════════
app.post('/api/auth/device-pair', async (req: any, res: any) => {
  try {
    const { pairingCode } = req.body;
    if (!pairingCode) return res.status(400).json({ error: 'pairingCode is required' });
    if (!supabaseServer) return res.status(503).json({ error: 'Server not configured' });

    // 1. Lookup code
    const { data: codeData, error } = await supabaseServer
      .from('device_pairing_codes')
      .select('*')
      .eq('code', pairingCode)
      .eq('used', false)
      .single();

    if (error || !codeData) {
      return res.status(401).json({ error: 'Invalid or used pairing code' });
    }

    if (new Date(codeData.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Pairing code expired' });
    }

    // 2. Mark code as used
    await supabaseServer
      .from('device_pairing_codes')
      .update({ used: true })
      .eq('code', pairingCode);

    // 3. Generate Custom JWT
    const secret = process.env.VITE_SUPABASE_ANON_KEY || 'fallback';
    const payload = {
      id: 'device_' + pairingCode,
      role: 'DEVICE',
      restaurant_id: codeData.restaurant_id,
      aud: 'authenticated'
    };
    
    // Set to expire in 30 days
    const token = jwt.sign(payload, secret, { expiresIn: '30d' });

    res.json({
      accessToken: token,
      refreshToken: token,
      restaurantId: codeData.restaurant_id,
      expiresIn: 30 * 24 * 60 * 60
    });
  } catch (err) {
    console.error('Device Pair Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
`;

if (!content.includes('/api/auth/device-pair')) {
  content = content.replace('// Start Server', devicePairEndpoint + '\n// Start Server');
}

fs.writeFileSync('server.ts', content);
