ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe' CHECK (payment_method IN ('stripe', 'transferencia', 'efectivo'));
