-- ═══════════════════════════════════════════════════════════════════════════════
-- ONE-TIME BACKFILL: Existing dishes → pos_products
-- 
-- ⚠️  RUN THIS EXACTLY ONCE after sync_dishes_to_pos.sql is applied
-- ⚠️  DO NOT re-run — it's idempotent but there's no reason to run twice
-- 
-- This inserts pos_products rows for all existing dishes that don't already
-- have a mirror. The sync trigger only handles future inserts/updates;
-- this script covers the historical data.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Count before (for reporting)
SELECT COUNT(*) AS existing_synced FROM pos_products WHERE source_dish_id IS NOT NULL;
SELECT COUNT(*) AS total_dishes FROM dishes;

-- Backfill
INSERT INTO pos_products (id, branch_id, name, selling_price, description, image_url, source_dish_id, is_active)
SELECT 
  gen_random_uuid(), 
  pb.id, 
  COALESCE(d.name_en, d.name_ar),
  d.price, 
  COALESCE(d.description_en, d.description_ar),
  d.image_url, 
  d.id, 
  COALESCE(d.is_available, true)
FROM dishes d
JOIN pos_branches pb ON pb.restaurant_id = d.restaurant_id AND pb.is_default = true
WHERE NOT EXISTS (SELECT 1 FROM pos_products WHERE source_dish_id = d.id);

-- Count after (report this number — it tells us how many dishes were "invisible" to POS)
SELECT COUNT(*) AS newly_backfilled FROM pos_products WHERE source_dish_id IS NOT NULL;
