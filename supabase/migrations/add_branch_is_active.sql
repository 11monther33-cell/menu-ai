-- Migration to add is_active to pos_branches table

ALTER TABLE pos_branches ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
