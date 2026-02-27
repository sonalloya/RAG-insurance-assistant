-- ─────────────────────────────────────────────────────────────
-- Supabase Database Schema — RAG Insurance AI Assistant
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────

-- Enable UUID extension (already enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Table: policies ─────────────────────────────────────────
-- Stores metadata about uploaded insurance policy documents
CREATE TABLE IF NOT EXISTS policies (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  file_url    TEXT        NOT NULL DEFAULT '',
  policy_data JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If the table already exists, add the column (safe to run):
ALTER TABLE policies ADD COLUMN IF NOT EXISTS policy_data JSONB;


-- ─── Table: chats ────────────────────────────────────────────
-- Stores every question asked and the AI answer returned
CREATE TABLE IF NOT EXISTS chats (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  question    TEXT        NOT NULL,
  answer      TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Row Level Security (optional but recommended) ───────────
-- Disable RLS for now so the anon key can read/write freely.
-- Enable and configure policies once you add authentication.
ALTER TABLE policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats    DISABLE ROW LEVEL SECURITY;

-- ─── Indexes for performance ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chats_created_at    ON chats    (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policies_created_at ON policies (created_at DESC);

-- ─── Quick verification ───────────────────────────────────────
-- After running, verify with:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('policies', 'chats');