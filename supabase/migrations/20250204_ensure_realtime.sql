DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'clients'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE clients;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'payment_methods'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payment_methods;
  END IF;
END $$;

ALTER TABLE IF EXISTS transactions REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS clients REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS payment_methods REPLICA IDENTITY FULL;
