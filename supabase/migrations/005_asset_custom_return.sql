-- Add custom annual return override per asset (null = use category default from settings)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS custom_annual_return double precision DEFAULT NULL;
-- Also add tracks_gain_loss flag if missing
ALTER TABLE assets ADD COLUMN IF NOT EXISTS tracks_gain_loss boolean DEFAULT false;
