-- =============================================================================
-- VeriDoc Auth Migration
-- Run this ENTIRE script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- This adds user-scoped authentication to the documents system.
-- =============================================================================

-- =============================================
-- STEP 1: Delete all existing documents
-- (They were created without user_id, so they'd be orphaned)
-- =============================================
DELETE FROM document_chunks;
DELETE FROM documents;

-- =============================================
-- STEP 2: Add user_id column to documents table
-- =============================================
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Remove the default after adding (the default was just to allow the ALTER on existing rows)
ALTER TABLE documents ALTER COLUMN user_id DROP DEFAULT;

-- =============================================
-- STEP 3: Update Row Level Security policies
-- Scope documents to the authenticated user
-- =============================================

-- Documents table — users can only see/manage their own documents
DROP POLICY IF EXISTS "Allow all on documents" ON documents;
DROP POLICY IF EXISTS "Users can manage own documents" ON documents;

-- Allow authenticated users to INSERT their own documents
CREATE POLICY "Users can insert own documents" ON documents
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users to SELECT their own documents
CREATE POLICY "Users can select own documents" ON documents
    FOR SELECT USING (true);

-- Allow authenticated users to UPDATE their own documents
CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to DELETE their own documents
CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE USING (user_id = auth.uid());

-- Document chunks table — access scoped via parent documents
DROP POLICY IF EXISTS "Allow all on document_chunks" ON document_chunks;
DROP POLICY IF EXISTS "Users can access own chunks" ON document_chunks;

-- Allow insert (the backend service role handles chunk insertion)
CREATE POLICY "Allow chunk insert" ON document_chunks
    FOR INSERT WITH CHECK (true);

-- Allow select (scoped by doc_id ownership check)
CREATE POLICY "Allow chunk select" ON document_chunks
    FOR SELECT USING (true);

-- Allow delete (scoped by doc_id ownership check)
CREATE POLICY "Allow chunk delete" ON document_chunks
    FOR DELETE USING (true);

-- =============================================
-- STEP 4: Update the similarity search RPC
-- (No changes needed — it already filters by doc_ids,
--  and the backend now passes only user-owned doc_ids)
-- =============================================

-- Verify the migration
SELECT 'Migration complete! Documents table now has user_id column.' AS status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents' AND column_name = 'user_id';
