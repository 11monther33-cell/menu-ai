-- Add import_batch_id to dishes table for undo-import feature
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS import_batch_id UUID;
CREATE INDEX IF NOT EXISTS idx_dishes_import_batch ON dishes(import_batch_id) WHERE import_batch_id IS NOT NULL;
