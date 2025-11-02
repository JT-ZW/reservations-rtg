-- =====================================================
-- Audit Logging System
-- =====================================================
-- Purpose: Track all user activities for audit and compliance
-- Author: System
-- Date: 2025-11-02
-- =====================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who performed the action
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    
    -- What action was performed
    action TEXT NOT NULL, -- e.g., 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT'
    resource_type TEXT NOT NULL, -- e.g., 'booking', 'client', 'room', 'user', 'auth'
    resource_id TEXT, -- ID of the affected resource (if applicable)
    resource_name TEXT, -- Human-readable name of the resource
    
    -- Details of the action
    description TEXT NOT NULL, -- Human-readable description
    changes JSONB, -- For UPDATE actions: {"before": {...}, "after": {...}}
    metadata JSONB, -- Additional context: IP address, user agent, etc.
    
    -- When it happened
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Request context
    ip_address TEXT,
    user_agent TEXT,
    request_method TEXT, -- GET, POST, PUT, DELETE
    request_path TEXT, -- API endpoint called
    
    -- Status
    status TEXT NOT NULL DEFAULT 'success', -- 'success', 'failed', 'error'
    error_message TEXT -- If status is 'failed' or 'error'
);

-- Indexes for faster queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);

-- Composite indexes for common queries
CREATE INDEX idx_audit_logs_user_date ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- RLS Policies (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
    ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- System can insert audit logs (no user restriction for logging)
CREATE POLICY "System can insert audit logs"
    ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- No one can update or delete audit logs (immutable for integrity)
CREATE POLICY "Audit logs are immutable"
    ON audit_logs
    FOR UPDATE
    USING (false);

CREATE POLICY "Audit logs cannot be deleted"
    ON audit_logs
    FOR DELETE
    USING (false);

-- Create a view for audit log summaries
CREATE OR REPLACE VIEW audit_log_summary AS
SELECT 
    user_id,
    user_email,
    user_role,
    action,
    resource_type,
    COUNT(*) as action_count,
    MAX(created_at) as last_action,
    MIN(created_at) as first_action
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id, user_email, user_role, action, resource_type
ORDER BY last_action DESC;

-- Grant permissions
GRANT SELECT ON audit_log_summary TO authenticated;

COMMENT ON TABLE audit_logs IS 'Immutable audit trail of all user actions in the system';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action (NULL if user deleted)';
COMMENT ON COLUMN audit_logs.action IS 'Type of action: CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, etc.';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected: booking, client, room, user, etc.';
COMMENT ON COLUMN audit_logs.changes IS 'JSON object with before/after values for UPDATE actions';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context like IP, device, location, etc.';
