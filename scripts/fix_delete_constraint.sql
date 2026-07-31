-- Drop the old constraint that prevents deletion
ALTER TABLE pos_products DROP CONSTRAINT IF EXISTS pos_products_source_dish_id_fkey;

-- Recreate the constraint with ON DELETE SET NULL
ALTER TABLE pos_products 
  ADD CONSTRAINT pos_products_source_dish_id_fkey 
  FOREIGN KEY (source_dish_id) 
  REFERENCES dishes(id) 
  ON DELETE SET NULL;
