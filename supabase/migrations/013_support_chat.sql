-- 1. Create Custom Types
CREATE TYPE participant_type AS ENUM ('user', 'admin', 'bot');
CREATE TYPE msg_type AS ENUM ('text', 'options', 'order_card', 'image');
CREATE TYPE session_status AS ENUM (
    'bot_active',
    'queued_for_admin',
    'live_agent',
    'resolved'
);
-- 2. Create support_sessions table
CREATE TABLE IF NOT EXISTS support_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status session_status DEFAULT 'bot_active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 3. Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES support_sessions(id) ON DELETE CASCADE,
    sender_type participant_type NOT NULL,
    message_type msg_type NOT NULL,
    content TEXT NOT NULL,
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 4. Create indexes for performance
CREATE INDEX idx_support_sessions_user ON support_sessions(user_id);
CREATE INDEX idx_support_sessions_status ON support_sessions(status);
CREATE INDEX idx_support_messages_session ON support_messages(session_id);
CREATE INDEX idx_support_messages_created ON support_messages(created_at DESC);
-- 5. Enable RLS
ALTER TABLE support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
-- 6. RLS Policies for support_sessions
-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON support_sessions FOR
SELECT USING (auth.uid() = user_id);
-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions" ON support_sessions FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON support_sessions FOR
UPDATE USING (auth.uid() = user_id);
-- Authenticated users can view all sessions (for admin access)
-- In production, you'd add a proper admin role check
CREATE POLICY "Admins can view all sessions" ON support_sessions FOR
SELECT TO authenticated USING (true);
-- 7. RLS Policies for support_messages
-- Users can view messages in their own sessions
CREATE POLICY "Users can view own messages" ON support_messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM support_sessions
            WHERE support_sessions.id = support_messages.session_id
                AND support_sessions.user_id = auth.uid()
        )
    );
-- Users can insert messages in their own sessions
CREATE POLICY "Users can insert own messages" ON support_messages FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM support_sessions
            WHERE support_sessions.id = support_messages.session_id
                AND support_sessions.user_id = auth.uid()
        )
    );
-- Admins can view all messages
CREATE POLICY "Admins can view all messages" ON support_messages FOR
SELECT TO authenticated USING (true);
-- Admins can insert messages (replies)
CREATE POLICY "Admins can insert messages" ON support_messages FOR
INSERT TO authenticated WITH CHECK (true);
-- Admins can update messages (mark as read)
CREATE POLICY "Admins can update messages" ON support_messages FOR
UPDATE TO authenticated USING (true);
-- 8. Enable Realtime for support_messages
ALTER PUBLICATION supabase_realtime
ADD TABLE support_messages;
-- 9. Trigger to update updated_at on support_sessions
CREATE TRIGGER update_support_sessions_updated_at BEFORE
UPDATE ON support_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();