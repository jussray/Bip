-- Migration: add sekret_reply column to journal_entries
-- Run manually via Supabase Dashboard or CLI after explicit approval.
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS sekret_reply text;
