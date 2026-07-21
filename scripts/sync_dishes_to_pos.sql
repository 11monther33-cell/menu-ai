-- ═══════════════════════════════════════════════════════════════════════════════
-- dishes → pos_products One-Way Sync Trigger
-- 
-- Run this ONCE in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- 
-- What this does:
-- 1. Adds missing columns to pos_products (description, image_url, source_dish_id)
-- 2. Creates a trigger that auto-mirrors any dish insert/update into pos_products
-- 3. Creates a trigger that deactivates the pos_product when a dish is deleted
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Step 1: Add missing columns to pos_products ─────────────────────────────
ALTER TABLE pos_products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE pos_products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE pos_products ADD COLUMN IF NOT EXISTS source_dish_id UUID REFERENCES dishes(id);

-- ─── Step 2: Unique constraint for upsert (ON CONFLICT) ─────────────────────
-- This allows the trigger to update existing synced products instead of duplicating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_source_dish'
  ) THEN
    ALTER TABLE pos_products ADD CONSTRAINT uniq_source_dish UNIQUE (source_dish_id);
  END IF;
END $$;

-- ─── Step 3: Sync trigger function ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_dish_to_pos_product()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_branch_id UUID;
BEGIN
  -- Find the default branch for this restaurant
  SELECT id INTO v_branch_id 
  FROM pos_branches 
  WHERE restaurant_id = NEW.restaurant_id AND is_default = true
  LIMIT 1;

  -- If no branch exists yet, skip silently (POS not set up for this restaurant)
  IF v_branch_id IS NULL THEN
    RAISE WARNING '[sync_dish_to_pos] No default pos_branch for restaurant %, skipping dish %',
                  NEW.restaurant_id, NEW.id;
    RETURN NEW;
  END IF;

  -- Upsert: insert new or update existing synced product
  INSERT INTO pos_products (
    id, branch_id, name, selling_price, description, image_url, 
    source_dish_id, is_active
  )
  VALUES (
    gen_random_uuid(),
    v_branch_id,
    COALESCE(NEW.name_en, NEW.name_ar),  -- Prefer English, fallback to Arabic
    NEW.price,
    COALESCE(NEW.description_en, NEW.description_ar),
    NEW.image_url,
    NEW.id,
    COALESCE(NEW.is_available, true)
  )
  ON CONFLICT (source_dish_id) DO UPDATE SET
    name          = EXCLUDED.name,
    selling_price = EXCLUDED.selling_price,
    description   = EXCLUDED.description,
    image_url     = EXCLUDED.image_url,
    is_active     = EXCLUDED.is_active;

  RETURN NEW;
END;
$$;

-- ─── Step 4: Attach the sync trigger ────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_sync_dish_to_pos_product ON dishes;
CREATE TRIGGER trg_sync_dish_to_pos_product
AFTER INSERT OR UPDATE ON dishes
FOR EACH ROW
EXECUTE FUNCTION sync_dish_to_pos_product();

-- ─── Step 5: Deactivation trigger (soft-delete) ────────────────────────────
-- When a dish is deleted, don't delete the pos_product (it may have order history,
-- recipes, invoices). Instead, just deactivate it.
CREATE OR REPLACE FUNCTION deactivate_pos_product_on_dish_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE pos_products SET is_active = false WHERE source_dish_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_deactivate_on_dish_delete ON dishes;
CREATE TRIGGER trg_deactivate_on_dish_delete
BEFORE DELETE ON dishes
FOR EACH ROW
EXECUTE FUNCTION deactivate_pos_product_on_dish_delete();

-- ─── Done! ──────────────────────────────────────────────────────────────────
-- Verify with: SELECT * FROM pos_products WHERE source_dish_id IS NOT NULL;
