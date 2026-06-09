ALTER TABLE monthly_snapshots
  ADD COLUMN IF NOT EXISTS gain_loss_euros NUMERIC(14, 2);
