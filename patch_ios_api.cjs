const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

const anchor = '  // ═══════════════════════════════════════════\n  // 🧊 Stability AI — Stable Fast 3D Generation';

const newCode = `  // ═══════════════════════════════════════════
  // 📱 iOS App Integration APIs
  // ═══════════════════════════════════════════

  // 1. GET /api/products?restaurantId=<uuid>
  app.get('/api/products', requireAuth, async (req: any, res: any) => {
    try {
      if (!supabaseServer) return res.status(503).json({ error: 'Server not configured' });
      const restaurantId = req.query.restaurantId;
      if (!restaurantId) return res.status(400).json({ error: 'restaurantId is required' });

      // Check ownership
      const { data: userData } = await supabaseServer.from('profiles').select('restaurant_id').eq('id', req.user.id).single();
      if (userData?.restaurant_id !== restaurantId) return res.status(403).json({ error: 'Forbidden' });

      const { data: dishes, error } = await supabaseServer
        .from('dishes')
        .select('id, name_en, name_ar, image_url, model_3d_url')
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      const products = dishes.map(d => ({
        id: d.id,
        name: req.headers['accept-language']?.startsWith('ar') ? d.name_ar : d.name_en,
        thumbnailUrl: d.image_url,
        has3DModel: !!d.model_3d_url
      }));

      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  // 2. POST /api/products/:productId/3d-model
  app.post('/api/products/:productId/3d-model', requireAuth, upload.single('model'), async (req: any, res: any) => {
    try {
      if (!req.file || !supabaseServer) return res.status(400).json({ error: 'Missing model file or server config' });
      
      const productId = req.params.productId;
      const { data: dish } = await supabaseServer.from('dishes').select('restaurant_id').eq('id', productId).single();
      if (!dish) return res.status(404).json({ error: 'Product not found' });

      const { data: userData } = await supabaseServer.from('profiles').select('restaurant_id').eq('id', req.user.id).single();
      if (userData?.restaurant_id !== dish.restaurant_id) return res.status(403).json({ error: 'Forbidden' });

      // Save to R2
      const key = \`models/\${dish.restaurant_id}/\${productId}-\${Date.now()}.usdz\`;
      await r2Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: 'model/vnd.usdz+zip'
      }));

      const publicUrl = \`\${R2_PUBLIC_URL}/\${key}\`;

      // Insert into product_3d_models
      const { data: newModel, error } = await supabaseServer.from('product_3d_models').insert({
        product_id: productId,
        usdz_url: publicUrl,
        status: 'processing',
        file_size_bytes: req.file.buffer.length,
        created_by: req.user.id,
        metadata: {
          detailLevel: req.body.detailLevel,
          capturedImageCount: req.body.capturedImageCount,
          deviceModel: req.body.deviceModel,
          appVersion: req.body.appVersion
        }
      }).select('id').single();

      if (error) throw error;

      // Update dishes.model_3d_status
      await supabaseServer.from('dishes').update({ model_3d_status: 'PROCESSING' }).eq('id', productId);

      res.status(202).json({
        modelId: newModel.id,
        status: 'processing',
        usdzUrl: publicUrl
      });
    } catch (err: any) {
      console.error('[iOS Upload Error]', err);
      res.status(500).json({ error: 'Failed to upload 3D model' });
    }
  });

  // 3. GET /api/products/:productId/3d-model/status
  app.get('/api/products/:productId/3d-model/status', requireAuth, async (req: any, res: any) => {
    try {
      if (!supabaseServer) return res.status(503).json({ error: 'Server not configured' });
      
      const { data: model, error } = await supabaseServer
        .from('product_3d_models')
        .select('status, glb_url')
        .eq('product_id', req.params.productId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; 

      if (!model) {
        return res.status(404).json({ error: 'No model found for this product' });
      }

      res.json({
        status: model.status,
        glbUrl: model.glb_url,
        error: model.status === 'failed' ? 'Conversion failed' : null
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to check model status' });
    }
  });

` + anchor;

content = content.replace(anchor, newCode);

fs.writeFileSync('server.ts', content);
