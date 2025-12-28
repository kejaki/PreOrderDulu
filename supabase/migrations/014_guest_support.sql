-- Migration: Enable Guest Support for Live Chat
-- This allows unauthenticated users to access the support chat system
-- 1. Modify support_sessions to support guest users
ALTER TABLE support_sessions
ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE support_sessions
ADD COLUMN IF NOT EXISTS guest_id TEXT,
    ADD COLUMN IF NOT EXISTS contact_info TEXT;
-- 2. Create index for guest_id lookups
CREATE INDEX IF NOT EXISTS idx_support_sessions_guest ON support_sessions(guest_id);
-- 3. Update RLS Policies for support_sessions
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own sessions" ON support_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON support_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON support_sessions;
-- New policies for both authenticated and guest users
CREATE POLICY "Users can view own sessions (auth or guest)" ON support_sessions FOR
SELECT USING (
        auth.uid() = user_id
        OR guest_id IS NOT NULL -- Allow if has guest_id (session-based access)
    );
CREATE POLICY "Anyone can create sessions" ON support_sessions FOR
INSERT WITH CHECK (true);
-- Allow both auth and anon to create sessions
CREATE POLICY "Users can update own sessions" ON support_sessions FOR
UPDATE USING (
        auth.uid() = user_id
        OR guest_id IS NOT NULL
    );
-- 4. Update RLS Policies for support_messages
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own messages" ON support_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON support_messages;
-- New policies for messages
CREATE POLICY "Users can view messages in accessible sessions" ON support_messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM support_sessions
            WHERE support_sessions.id = support_messages.session_id
                AND (
                    support_sessions.user_id = auth.uid()
                    OR support_sessions.guest_id IS NOT NULL
                )
        )
    );
CREATE POLICY "Anyone can insert messages" ON support_messages FOR
INSERT WITH CHECK (true);
-- Allow both auth and anon to send messages
-- Note: Admin policies remain unchanged (they can still view and update all)