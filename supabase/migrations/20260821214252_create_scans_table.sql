/*
# Create scans table for CleanCRM scan history

1. New Tables
- `scans`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to the authenticated user, references auth.users with cascade delete)
  - `filename` (text, not null) - original uploaded file name
  - `total_rows` (integer, not null) - number of contact rows scanned
  - `issues_count` (integer, not null) - total issues flagged
  - `duplicate_count` (integer, not null) - duplicate groups detected
  - `clean_percentage` (numeric, not null) - percentage of clean rows
  - `category_counts` (jsonb) - breakdown of issues by category
  - `created_at` (timestamptz, defaults to now)
2. Security
- Enable RLS on `scans`.
- Owner-scoped CRUD: each authenticated user can only access their own scan records.
3. Important Notes
- This is a multi-user app with sign-in, so policies are scoped to `authenticated` with `auth.uid()` ownership checks.
- `user_id` defaults to `auth.uid()` so inserts from the client (which omit user_id) succeed.
*/

CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  total_rows integer NOT NULL,
  issues_count integer NOT NULL,
  duplicate_count integer NOT NULL,
  clean_percentage numeric(5,2) NOT NULL,
  category_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_scans" ON scans;
CREATE POLICY "select_own_scans" ON scans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_scans" ON scans;
CREATE POLICY "insert_own_scans" ON scans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_scans" ON scans;
CREATE POLICY "update_own_scans" ON scans FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_scans" ON scans;
CREATE POLICY "delete_own_scans" ON scans FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS scans_user_id_created_at_idx ON scans (user_id, created_at DESC);
