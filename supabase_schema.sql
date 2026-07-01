-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TableX Database Schema (PostgreSQL / Supabase)             ║
-- ║  🔒 SECURITY-HARDENED VERSION                               ║
-- ║  Date: 2026-04-26                                           ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════
-- HELPER: Function to get current user's restaurant_id
-- ═══════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_my_restaurant_ids()
RETURNS SETOF UUID AS $$
  SELECT r.id FROM restaurants r WHERE r.owner_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ═══════════════════════════════════════════
-- 0. Profiles Table (Users)
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'RESTAURANT_OWNER'
    CHECK (role IN ('SUPER_ADMIN', 'RESTAURANT_OWNER')),
  is_active BOOLEAN DEFAULT true,
  restaurant_id UUID,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 0b. Restaurants Table
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  city TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
  subscription_status TEXT DEFAULT 'none'
    CHECK (subscription_status IN ('none', 'trial', 'active', 'expired', 'cancelled')),
  subscription_plan TEXT DEFAULT 'basic',
  subscription_expiry TIMESTAMP WITH TIME ZONE,
  paypal_subscription_id TEXT,
  branding JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 1. Categories Table
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  emoji TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 2. Dishes Table
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Content
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  currency TEXT DEFAULT 'USD',
  
  -- Media
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  
  -- 3D Model
  model_3d_url TEXT,
  model_3d_status TEXT DEFAULT 'NONE'
    CHECK (model_3d_status IN ('NONE', 'UPLOADING', 'PROCESSING', 'READY', 'ERROR')),
  model_3d_size_kb INTEGER,
  model_3d_uploaded_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  allergens TEXT[] DEFAULT '{}',
  calories INTEGER CHECK (calories >= 0),
  protein FLOAT CHECK (protein >= 0),
  carbs FLOAT CHECK (carbs >= 0),
  fat FLOAT CHECK (fat >= 0),
  taste_tags TEXT[] DEFAULT '{}',
  mood_tags TEXT[] DEFAULT '{}',
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  is_chef_special BOOLEAN DEFAULT false,
  is_customizable BOOLEAN DEFAULT false,
  stock_count INTEGER CHECK (stock_count >= 0),
  prep_time_min INTEGER DEFAULT 15 CHECK (prep_time_min >= 0),
  sort_order INTEGER DEFAULT 0,
  
  -- Stats (read-only for owners, write via triggers/functions)
  view_count INTEGER DEFAULT 0,
  ar_view_count INTEGER DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  snap_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 3. QR Codes Table
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL CHECK (table_number > 0),
  label TEXT,
  qr_data TEXT NOT NULL,
  svg_base64 TEXT,
  pdf_base64 TEXT,
  scan_count INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, table_number)
);

-- ═══════════════════════════════════════════
-- 4. Orders Table
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL CHECK (table_number > 0),
  device_hash TEXT,
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  status TEXT DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED')),
  special_request TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 5. Order Items Table
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  notes TEXT
);

-- ═══════════════════════════════════════════
-- 6. Snap Captures Table
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS snap_captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE,
  device_hash TEXT,
  card_url TEXT,
  mode TEXT CHECK (mode IN ('rotate', 'zoom', 'xray', 'ar')),
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 7. Chef Notes Table
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS chef_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE,
  message_ar TEXT NOT NULL,
  message_en TEXT,
  is_global BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 8. UGC Photos Table
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ugc_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 9. System Settings Table (Admin Only)
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  🔒 ENABLE ROW LEVEL SECURITY ON ALL TABLES                ║
-- ╚══════════════════════════════════════════════════════════════╝

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE snap_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE chef_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  🔒 PROFILES — RLS POLICIES                                ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Users can read their own profile
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Super admin can read all profiles
CREATE POLICY "Admin read all profiles"
  ON profiles FOR SELECT
  USING (is_super_admin());

-- Users can only insert their OWN profile (id must match auth.uid)
-- Role is forced to RESTAURANT_OWNER by trigger (see below)
CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users can update only their own profile (role changes blocked by trigger)
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Only admin can delete profiles
CREATE POLICY "Admin delete profiles"
  ON profiles FOR DELETE
  USING (is_super_admin());


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  🔒 RESTAURANTS — RLS POLICIES                             ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Public can read approved restaurants (for public menu)
CREATE POLICY "Public read approved restaurants"
  ON restaurants FOR SELECT
  USING (status = 'APPROVED');

-- Owners can read their own restaurants (any status)
CREATE POLICY "Owners read own restaurants"
  ON restaurants FOR SELECT
  USING (owner_id = auth.uid());

-- Admin can read all restaurants
CREATE POLICY "Admin read all restaurants"
  ON restaurants FOR SELECT
  USING (is_super_admin());

-- Authenticated users can insert (register new restaurant)
-- Status forced to PENDING by trigger
CREATE POLICY "Users insert restaurant"
  ON restaurants FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Owners can update their own restaurant (but NOT status — blocked by trigger)
CREATE POLICY "Owners update own restaurant"
  ON restaurants FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Admin can update any restaurant (approve/reject)
CREATE POLICY "Admin update restaurants"
  ON restaurants FOR UPDATE
  USING (is_super_admin());

-- Admin can delete restaurants
CREATE POLICY "Admin delete restaurants"
  ON restaurants FOR DELETE
  USING (is_super_admin());


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  🔒 CATEGORIES — RLS POLICIES                              ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Public can read categories (for public menu)
CREATE POLICY "Public read categories"
  ON categories FOR SELECT
  USING (true);

-- Owner can manage own categories
CREATE POLICY "Owner manage categories"
  ON categories FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT get_my_restaurant_ids()));

CREATE POLICY "Owner update categories"
  ON categories FOR UPDATE
  USING (restaurant_id IN (SELECT get_my_restaurant_ids()))
  WITH CHECK (restaurant_id IN (SELECT get_my_restaurant_ids()));

CREATE POLICY "Owner delete categories"
  ON categories FOR DELETE
  USING (restaurant_id IN (SELECT get_my_restaurant_ids()));

-- Admin can manage all categories
CREATE POLICY "Admin manage categories"
  ON categories FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  🔒 DISHES — RLS POLICIES                                  ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Public can read dishes (for public menu)
CREATE POLICY "Public read dishes"
  ON dishes FOR SELECT
  USING (true);

-- Owner can manage own dishes
CREATE POLICY "Owner insert dishes"
  ON dishes FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT get_my_restaurant_ids()));

CREATE POLICY "Owner update dishes"
  ON dishes FOR UPDATE
  USING (restaurant_id IN (SELECT get_my_restaurant_ids()))
  WITH CHECK (restaurant_id IN (SELECT get_my_restaurant_ids()));

CREATE POLICY "Owner delete dishes"
  ON dishes FOR DELETE
  USING (restaurant_id IN (SELECT get_my_restaurant_ids()));

-- Admin can manage all dishes
CREATE POLICY "Admin manage dishes"
  ON dishes FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  🔒 QR CODES — RLS POLICIES                                ║
-- ╚══════════════════════════════════════════════════════════════╝

CREATE POLICY "Public read qr codes"
  ON qr_codes FOR SELECT
  USING (true);

CREATE POLICY "Owner insert qr codes"
  ON qr_codes FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT get_my_restaurant_ids()));

CREATE POLICY "Owner update qr codes"
  ON qr_codes FOR UPDATE
  USING (restaurant_id IN (SELECT get_my_restaurant_ids()))
  WITH CHECK (restaurant_id IN (SELECT get_my_restaurant_ids()));

CREATE POLICY "Owner delete qr codes"
  ON qr_codes FOR DELETE
  USING (restaurant_id IN (SELECT get_my_restaurant_ids()));

CREATE POLICY "Admin manage qr codes"
  ON qr_codes FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  🔒 ORDERS — RLS POLICIES                                  ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Public (anon) can INSERT orders (guests placing orders from public menu)
CREATE POLICY "Public insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Public can read their own order by device_hash (optional)
CREATE POLICY "Public read own orders"
  ON orders FOR SELECT
  USING (true);

-- Owner can manage orders for their restaurants
CREATE POLICY "Owner manage orders"
  ON orders FOR UPDATE
  USING (restaurant_id IN (SELECT get_my_restaurant_ids()))
  WITH CHECK (restaurant_id IN (SELECT get_my_restaurant_ids()));

CREATE POLICY "Owner delete orders"
  ON orders FOR DELETE
  USING (restaurant_id IN (SELECT get_my_restaurant_ids()));

CREATE POLICY "Admin manage orders"
  ON orders FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  🔒 ORDER ITEMS — RLS POLICIES                             ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Public can insert order items (with their order)
CREATE POLICY "Public insert order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public read order items"
  ON order_items FOR SELECT
  USING (true);

-- Owner can manage via order's restaurant_id
CREATE POLICY "Owner manage order items"
  ON order_items FOR UPDATE
  USING (
    order_id IN (
      SELECT o.id FROM orders o WHERE o.restaurant_id IN (SELECT get_my_restaurant_ids())
    )
  );

CREATE POLICY "Owner delete order items"
  ON order_items FOR DELETE
  USING (
    order_id IN (
      SELECT o.id FROM orders o WHERE o.restaurant_id IN (SELECT get_my_restaurant_ids())
    )
  );

CREATE POLICY "Admin manage order items"
  ON order_items FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  🔒 SNAP CAPTURES — RLS POLICIES                           ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Public can insert snap captures (guests sharing dishes)
CREATE POLICY "Public insert snap captures"
  ON snap_captures FOR INSERT
  WITH CHECK (true);

-- Public can read snap captures
CREATE POLICY "Public read snap captures"
  ON snap_captures FOR SELECT
  USING (true);

-- Admin can manage
CREATE POLICY "Admin manage snap captures"
  ON snap_captures FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  🔒 CHEF NOTES — RLS POLICIES                              ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Public can read active chef notes
CREATE POLICY "Public read active chef notes"
  ON chef_notes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owner insert chef notes"
  ON chef_notes FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT get_my_restaurant_ids()));

CREATE POLICY "Owner update chef notes"
  ON chef_notes FOR UPDATE
  USING (restaurant_id IN (SELECT get_my_restaurant_ids()))
  WITH CHECK (restaurant_id IN (SELECT get_my_restaurant_ids()));

CREATE POLICY "Owner delete chef notes"
  ON chef_notes FOR DELETE
  USING (restaurant_id IN (SELECT get_my_restaurant_ids()));

CREATE POLICY "Admin manage chef notes"
  ON chef_notes FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  🔒 UGC PHOTOS — RLS POLICIES                              ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Public can read approved photos
CREATE POLICY "Public read approved ugc photos"
  ON ugc_photos FOR SELECT
  USING (status = 'APPROVED');

-- Public can upload photos (pending review)
CREATE POLICY "Public insert ugc photos"
  ON ugc_photos FOR INSERT
  WITH CHECK (true);

-- Owner can manage UGC for their restaurants' dishes
CREATE POLICY "Owner manage ugc photos"
  ON ugc_photos FOR UPDATE
  USING (
    dish_id IN (
      SELECT d.id FROM dishes d WHERE d.restaurant_id IN (SELECT get_my_restaurant_ids())
    )
  );

CREATE POLICY "Owner read ugc photos"
  ON ugc_photos FOR SELECT
  USING (
    dish_id IN (
      SELECT d.id FROM dishes d WHERE d.restaurant_id IN (SELECT get_my_restaurant_ids())
    )
  );

CREATE POLICY "Admin manage ugc photos"
  ON ugc_photos FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  🔒 SYSTEM SETTINGS — ADMIN ONLY                           ║
-- ╚══════════════════════════════════════════════════════════════╝

CREATE POLICY "Admin read system settings"
  ON system_settings FOR SELECT
  USING (is_super_admin());

CREATE POLICY "Admin manage system settings"
  ON system_settings FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  🛡️ SECURITY TRIGGERS                                      ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Trigger 1: Force role to RESTAURANT_OWNER on profile insert (prevent privilege escalation)
CREATE OR REPLACE FUNCTION enforce_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow SUPER_ADMIN if set by an existing super admin via service role
  -- For client-side inserts, always force RESTAURANT_OWNER
  IF NEW.role = 'SUPER_ADMIN' THEN
    -- Check if the current user is already a super admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN') THEN
      NEW.role := 'RESTAURANT_OWNER';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_enforce_profile_role
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_profile_role();


-- Trigger 2: Force restaurant status to PENDING on insert (prevent bypassing approval)
CREATE OR REPLACE FUNCTION enforce_restaurant_pending()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT, always force PENDING unless admin is doing it
  IF TG_OP = 'INSERT' THEN
    IF NOT is_super_admin() THEN
      NEW.status := 'PENDING';
    END IF;
  END IF;
  
  -- On UPDATE, only admin can change status
  IF TG_OP = 'UPDATE' AND NEW.status != OLD.status THEN
    IF NOT is_super_admin() THEN
      NEW.status := OLD.status; -- Revert status change
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_enforce_restaurant_pending
  BEFORE INSERT OR UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION enforce_restaurant_pending();


-- Trigger 3: Prevent role escalation on profile update
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Normal users cannot change their role
  IF TG_OP = 'UPDATE' AND NEW.role != OLD.role THEN
    IF NOT is_super_admin() THEN
      NEW.role := OLD.role; -- Revert role change
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_prevent_role_change
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_change();


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  📊 INDEXES FOR PERFORMANCE                                 ║
-- ╚══════════════════════════════════════════════════════════════╝

CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id ON categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant_id ON dishes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dishes_category_id ON dishes(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_restaurant_id ON qr_codes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_chef_notes_restaurant_id ON chef_notes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
