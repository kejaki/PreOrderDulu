-- Add whatsapp_number to merchants table
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
-- Optional: Backfill with existing phone numbers if they are valid mobile numbers
-- This is a heuristic update, can be risky if phone numbers are landlines. 
-- User prompt didn't strictly ask for backfill but it's helpful.
-- We will just set it to null by default as per plan, letting merchants update it.