-- If you already ran 001 without app_data, add the column:
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS app_data JSONB DEFAULT '{}'::jsonb;
