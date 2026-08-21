-- PostgreSQL Initialization Schema for FOMS AI Intelligence Layer

-- Create extension if needed for vector embeddings (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. AI Processing Runs
CREATE TABLE IF NOT EXISTS ai_processing_runs (
    id SERIAL PRIMARY KEY,
    run_type VARCHAR(50) NOT NULL, -- 'DUPLICATE_CHECK' or 'COLLECTION_RANKING'
    status VARCHAR(20) NOT NULL, -- 'STARTED', 'COMPLETED', 'FAILED'
    records_retrieved INT DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

-- 2. AI Duplicate Alerts
CREATE TABLE IF NOT EXISTS ai_duplicate_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL, -- 'WAYBILL', 'INVOICE', 'OFFICIAL_RECEIPT', 'SPEEDPAY_REFERENCE'
    matched_field VARCHAR(50) NOT NULL, -- 'number', 'reference', 'amount_and_basis', etc.
    source_record_id VARCHAR(100) NOT NULL,
    matched_record_id VARCHAR(100) NOT NULL,
    similarity_score DECIMAL(5,2) NOT NULL, -- e.g., 95.50
    date_generated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL,
    review_status VARCHAR(30) DEFAULT 'Pending Review' NOT NULL, -- 'Pending Review', 'Reviewed', 'Dismissed'
    source_reference_value VARCHAR(150),
    normalized_reference_value VARCHAR(150)
);

-- Indexing for fast search of duplicates
CREATE INDEX IF NOT EXISTS idx_dup_alert_type ON ai_duplicate_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_dup_status ON ai_duplicate_alerts(review_status);
CREATE INDEX IF NOT EXISTS idx_duplicate_alerts_normalized_reference ON ai_duplicate_alerts(normalized_reference_value);

-- 3. AI Duplicate Match Details (Stores comparison data)
CREATE TABLE IF NOT EXISTS ai_duplicate_matches (
    id SERIAL PRIMARY KEY,
    alert_id INT REFERENCES ai_duplicate_alerts(id) ON DELETE CASCADE,
    source_details JSONB NOT NULL,
    match_details JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. AI Collection Priorities
CREATE TABLE IF NOT EXISTS ai_collection_priorities (
    id SERIAL PRIMARY KEY,
    invoice_id VARCHAR(100) UNIQUE NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    client_id VARCHAR(100) NOT NULL,
    client_name VARCHAR(200) NOT NULL,
    outstanding_balance DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    priority_level VARCHAR(20) NOT NULL, -- 'Urgent', 'High', 'Medium', 'Low'
    explanation_basis JSONB NOT NULL, -- JSON Array of reasons
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_invoice_number VARCHAR(150),
    normalized_invoice_number VARCHAR(150)
);

CREATE INDEX IF NOT EXISTS idx_coll_priority ON ai_collection_priorities(priority_level);
CREATE INDEX IF NOT EXISTS idx_coll_client ON ai_collection_priorities(client_id);
CREATE INDEX IF NOT EXISTS idx_collection_priorities_normalized_invoice ON ai_collection_priorities(normalized_invoice_number);

-- 5. AI Collection Recommendations
CREATE TABLE IF NOT EXISTS ai_collection_recommendations (
    id SERIAL PRIMARY KEY,
    priority_id INT REFERENCES ai_collection_priorities(id) ON DELETE CASCADE,
    recommended_action VARCHAR(200) NOT NULL, -- e.g. 'Schedule follow-up call'
    explanation_basis JSONB NOT NULL,
    review_status VARCHAR(30) DEFAULT 'Pending Review' NOT NULL, -- 'Pending Review', 'Reviewed', 'Accepted as Recommendation', 'Rejected'
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. AI Human Review Decisions (Audit Trail)
CREATE TABLE IF NOT EXISTS ai_review_decisions (
    id SERIAL PRIMARY KEY,
    target_type VARCHAR(50) NOT NULL, -- 'DUPLICATE_ALERT' or 'COLLECTION_RECOMMENDATION'
    target_id INT NOT NULL, -- REFERENCES ai_duplicate_alerts(id) OR ai_collection_recommendations(id)
    reviewer_username VARCHAR(100) NOT NULL,
    reviewer_role VARCHAR(50) NOT NULL,
    decision VARCHAR(50) NOT NULL, -- 'Reviewed', 'Dismissed', 'Accepted as Recommendation', 'Rejected', etc.
    remarks TEXT,
    recommended_action VARCHAR(100), -- 'ProceedWithManualValidation', 'DismissAlert', etc.
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_target ON ai_review_decisions(target_type, target_id);

-- 7. AI Output and Execution Logs (Traceability)
CREATE TABLE IF NOT EXISTS ai_output_logs (
    id SERIAL PRIMARY KEY,
    log_level VARCHAR(10) NOT NULL, -- 'INFO', 'WARNING', 'ERROR'
    message TEXT NOT NULL,
    service_name VARCHAR(50) NOT NULL DEFAULT 'ai-service',
    correlation_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================
-- 8. RBAC and User Management Schemas
-- ==============================================================

CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
    permission_id SERIAL PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    login_id VARCHAR(100) UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Hashed Password
    role_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT FALSE,
    is_temporary_password BOOLEAN DEFAULT FALSE,
    password_changed_at TIMESTAMP,
    password_version INT DEFAULT 1
);

-- 9. AI Activity Logs (Dashboard Recent Activity feed)
CREATE TABLE IF NOT EXISTS ai_activity_logs (
    id SERIAL PRIMARY KEY,
    status_dot VARCHAR(20) NOT NULL, -- 'success', 'warning', 'danger', 'info'
    description TEXT NOT NULL,
    related_record VARCHAR(50) NOT NULL,
    time_ago VARCHAR(50) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================
-- 10. Audit Trail Schema
-- ==============================================================

CREATE TABLE IF NOT EXISTS ai_audit_events (
    event_id UUID PRIMARY KEY,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id VARCHAR(100),
    full_name VARCHAR(200),
    role_name VARCHAR(100),
    event_type VARCHAR(100) NOT NULL,
    action_description TEXT NOT NULL,
    related_record_type VARCHAR(100),
    source_reference VARCHAR(200),
    normalized_reference VARCHAR(200),
    result VARCHAR(50) NOT NULL,
    ip_address VARCHAR(64),
    user_agent TEXT,
    details JSONB,
    correlation_id VARCHAR(150)
);

CREATE INDEX IF NOT EXISTS idx_ai_audit_events_occurred_at ON ai_audit_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_events_event_type ON ai_audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ai_audit_events_user_id ON ai_audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_events_normalized_reference ON ai_audit_events(normalized_reference);

-- ==============================================================
-- Idempotent Data Seeds (ON CONFLICT DO NOTHING)
-- ==============================================================

-- Seed Roles
INSERT INTO roles (role_name) VALUES
('FinancialManager'),
('HeadAccountant'),
('Accountant'),
('Coordinator'),
('AssistantFinancialManager'),
('Client')
ON CONFLICT (role_name) DO NOTHING;

-- Seed Permissions
INSERT INTO permissions (permission_name) VALUES
('ai.dashboard.view'),
('ai.dashboard.view_limited'),
('ai.duplicate.view'),
('ai.duplicate.waybill.view'),
('ai.duplicate.review'),
('ai.collection.view'),
('ai.collection.validate'),
('ai.reports.view'),
('ai.reports.view_limited'),
('ai.audit.view'),
('ai.audit.view_limited'),
('ai.audit.export')
ON CONFLICT (permission_name) DO NOTHING;

-- Seed Role Permissions Mapping
-- FinancialManager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'FinancialManager' AND p.permission_name IN (
    'ai.dashboard.view', 'ai.duplicate.view', 'ai.duplicate.review', 
    'ai.collection.view', 'ai.collection.validate', 'ai.reports.view', 
    'ai.audit.view', 'ai.audit.view_limited', 'ai.audit.export'
) ON CONFLICT DO NOTHING;

-- HeadAccountant
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'HeadAccountant' AND p.permission_name IN (
    'ai.dashboard.view', 'ai.duplicate.view', 'ai.duplicate.review', 
    'ai.collection.view', 'ai.reports.view', 
    'ai.audit.view', 'ai.audit.view_limited', 'ai.audit.export'
) ON CONFLICT DO NOTHING;

-- Accountant
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'Accountant' AND p.permission_name IN (
    'ai.dashboard.view', 'ai.duplicate.view', 'ai.duplicate.review', 
    'ai.collection.view', 'ai.reports.view', 'ai.audit.view_limited'
) ON CONFLICT DO NOTHING;

-- Coordinator
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'Coordinator' AND p.permission_name IN (
    'ai.dashboard.view_limited', 'ai.duplicate.waybill.view'
) ON CONFLICT DO NOTHING;

-- AssistantFinancialManager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'AssistantFinancialManager' AND p.permission_name IN (
    'ai.dashboard.view_limited', 'ai.reports.view_limited', 'ai.audit.view_limited'
) ON CONFLICT DO NOTHING;

-- Seed Users with PBKDF2 (SHA256) hash for 'Password@123'
-- Hash representation: AQAAAAIAAYagAAAAEH/ZkZ1v7L70m6P0x8hYmS8rD8fW1wQzZ0V2yN3m9w0v4y==
INSERT INTO users (login_id, full_name, email, password_hash, role_name) VALUES
('EMP-001', 'Crystalyn Joyce C. Fajardo', 'finance.manager@speedex.test', 'AQAAAAIAAYagAAAAEH/ZkZ1v7L70m6P0x8hYmS8rD8fW1wQzZ0V2yN3m9w0v4y==', 'FinancialManager'),
('EMP-002', 'Misty', 'head.accountant@speedex.test', 'AQAAAAIAAYagAAAAEH/ZkZ1v7L70m6P0x8hYmS8rD8fW1wQzZ0V2yN3m9w0v4y==', 'HeadAccountant'),
('EMP-003', 'Maria Mariel Jane Anonuevo', 'staff.accountant@speedex.test', 'AQAAAAIAAYagAAAAEH/ZkZ1v7L70m6P0x8hYmS8rD8fW1wQzZ0V2yN3m9w0v4y==', 'Accountant'),
('EMP-004', 'Hannah Estrera', 'coordinator@speedex.test', 'AQAAAAIAAYagAAAAEH/ZkZ1v7L70m6P0x8hYmS8rD8fW1wQzZ0V2yN3m9w0v4y==', 'Coordinator'),
('EMP-005', 'Joana Marie Ogaya', 'assistant.fm@speedex.test', 'AQAAAAIAAYagAAAAEH/ZkZ1v7L70m6P0x8hYmS8rD8fW1wQzZ0V2yN3m9w0v4y==', 'AssistantFinancialManager'),
('EMP-006', 'Client User', 'client@external.test', 'AQAAAAIAAYagAAAAEH/ZkZ1v7L70m6P0x8hYmS8rD8fW1wQzZ0V2yN3m9w0v4y==', 'Client')
ON CONFLICT (email) DO NOTHING;

-- Seed Client Users with BCrypt hash for 'Password@123'
INSERT INTO users (login_id, full_name, email, password_hash, role_name, must_change_password, is_temporary_password, password_version) VALUES
('JD-001', 'JD-001 Client', 'jd001@example.com', '$2b$12$Sib5elfB0cG0IwAHcAqJ1uc27zqRN3eNRY5dWl9cxZbGGx5gfRokS', 'Client', TRUE, TRUE, 1),
('CLIENT-002', 'Client 002', 'client002@example.com', '$2b$12$Sib5elfB0cG0IwAHcAqJ1uc27zqRN3eNRY5dWl9cxZbGGx5gfRokS', 'Client', TRUE, TRUE, 1),
('ABC-003', 'ABC-003 Client', 'abc003@example.com', '$2b$12$Sib5elfB0cG0IwAHcAqJ1uc27zqRN3eNRY5dWl9cxZbGGx5gfRokS', 'Client', TRUE, TRUE, 1),
('XYZ-004', 'XYZ-004 Client', 'xyz004@example.com', '$2b$12$Sib5elfB0cG0IwAHcAqJ1uc27zqRN3eNRY5dWl9cxZbGGx5gfRokS', 'Client', TRUE, TRUE, 1)
ON CONFLICT (email) DO NOTHING;

-- Seed AI Duplicate Alerts (including original inconsistent values and canonical normalizations)
INSERT INTO ai_duplicate_alerts (id, alert_type, matched_field, source_record_id, matched_record_id, similarity_score, reason, review_status, source_reference_value, normalized_reference_value) VALUES
(1, 'WAYBILL', 'number', 'WB-2026-001', 'WB-2026-001-DUP', 100.00, 'Identical waybill numbers detected for separate shipments.', 'Pending Review', 'wb-2026-001', 'WB-2026-001'),
(2, 'INVOICE', 'amount_and_basis', 'INV-2026-015', 'INV-2026-015-A', 96.50, 'Highly similar invoice items and amounts matching Zeta Freight.', 'Pending Review', 'inv-2026-015', 'INV-2026-015'),
(3, 'WAYBILL', 'number', 'WB-2026-102', 'WB-2026-102-COPY', 100.00, 'Identical copy of Waybill 102 found in database batch.', 'Pending Review', ' wb 2026 102', 'WB-2026-102'),
(4, 'OFFICIAL_RECEIPT', 'reference', 'OR-99882', 'OR-99882-B', 98.00, 'Duplicate receipt references mapped to single collection payment.', 'Pending Review', 'or_99882', 'OR-99882'),
(5, 'SPEEDPAY_REFERENCE', 'amount_and_basis', 'SP-7711', 'SP-7711-COPY', 100.00, 'Duplicate SpeedPay reference codes found.', 'Pending Review', 'sp-7711', 'SP-7711')
ON CONFLICT (id) DO NOTHING;

-- Seed AI Collection Priorities
INSERT INTO ai_collection_priorities (id, invoice_id, invoice_number, client_id, client_name, outstanding_balance, due_date, priority_level, explanation_basis, source_invoice_number, normalized_invoice_number) VALUES
(1, 'CP-001', 'INV-2026-021', 'CL-001', 'Zeta Freight Solutions', 92500.00, '2026-06-05', 'Urgent', '["Invoice is 45 days overdue", "Outstanding balance exceeds PHP 50,000", "No validated payment is recorded"]', 'inv-2026-021', 'INV-2026-021'),
(2, 'CP-002', 'INV-2026-088', 'CL-002', 'Alpha Logistics Inc', 45000.00, '2026-07-01', 'High', '["Overdue balance of PHP 45,000", "Aging category is 15-30 days overdue"]', 'Inv-2026-088', 'INV-2026-088'),
(3, 'CP-003', 'INV-2026-092', 'CL-003', 'Omega Forwarding', 3500.00, '2026-07-15', 'Low', '["Outstanding balance below PHP 5,000", "Less than 5 days overdue"]', 'INV_2026_092', 'INV-2026-092')
ON CONFLICT (id) DO NOTHING;

-- Seed AI Collection Recommendations
INSERT INTO ai_collection_recommendations (id, priority_id, recommended_action, explanation_basis, review_status) VALUES
(1, 1, 'Initiate demand letter and schedule follow-up call with manager.', '["Invoice has high outstanding balance of 92.5k", "Overdue is 45 days"]', 'Pending Review'),
(2, 2, 'Send standard email invoice reminder.', '["Overdue by 19 days", "High priority client"]', 'Pending Review')
ON CONFLICT (id) DO NOTHING;

-- Seed AI Activity Logs for Dashboard Recent Activity panel
INSERT INTO ai_activity_logs (id, status_dot, description, related_record, time_ago, user_role) VALUES
(1, 'warning', 'Possible duplicate invoice detected', 'INV-2026-015', '10 minutes ago', 'AI Processing Service'),
(2, 'success', 'Duplicate alert verified and accepted', 'WB-2026-001', '1 hour ago', 'Juan Dela Cruz'),
(3, 'info', 'Updated collection priorities', 'Zeta Freight Solutions', '4 hours ago', 'Maria Santos'),
(4, 'danger', 'Urgent priority collections alert generated', 'INV-2026-021', '1 day ago', 'System Sync Engine')
ON CONFLICT (id) DO NOTHING;

-- Seed AI Audit Events
INSERT INTO ai_audit_events (event_id, occurred_at, user_id, full_name, role_name, event_type, action_description, related_record_type, source_reference, normalized_reference, result, ip_address, details, correlation_id) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-07-20 15:30:00+08', 'USR-002', 'Juan Dela Cruz', 'HeadAccountant', 'LOGIN_SUCCESS', 'Successful system login', 'Session', NULL, NULL, 'Success', '127.0.0.1', '{"browser":"Chrome"}', 'CORR-L-011'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '2026-07-20 15:31:00+08', 'USR-002', 'Juan Dela Cruz', 'HeadAccountant', 'DUPLICATE_ALERT_REVIEWED', 'Reviewed duplicate invoice alert', 'Invoice', 'inv-2026-015', 'INV-2026-015', 'Success', '127.0.0.1', '{"decision":"Requires Manual Verification"}', 'CORR-2026-001'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '2026-07-20 15:32:00+08', 'USR-001', 'Maria Santos', 'FinancialManager', 'LOGIN_SUCCESS', 'Successful system login', 'Session', NULL, NULL, 'Success', '127.0.0.1', '{"browser":"Safari"}', 'CORR-L-012'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', '2026-07-20 15:33:00+08', 'USR-001', 'Maria Santos', 'FinancialManager', 'COLLECTION_PRIORITY_GENERATED', 'Generated AI collection priority queues', 'Collection', 'inv-2026-021', 'INV-2026-021', 'Success', '127.0.0.1', '{"triggered_by":"manual"}', 'CORR-2026-002'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', '2026-07-20 15:34:00+08', 'USR-003', 'Pedro Penduko', 'Accountant', 'LOGIN_SUCCESS', 'Successful system login', 'Session', NULL, NULL, 'Success', '127.0.0.1', '{"browser":"Firefox"}', 'CORR-L-013'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-07-20 15:35:00+08', 'USR-003', 'Pedro Penduko', 'Accountant', 'DUPLICATE_ALERT_REVIEWED', 'Reviewed duplicate waybill alert', 'Waybill', 'wb-2026-001', 'WB-2026-001', 'Success', '127.0.0.1', '{"decision":"Dismissed"}', 'CORR-2026-003'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', '2026-07-20 15:36:00+08', 'USR-999', 'Anonymous', 'Client', 'LOGIN_FAILED', 'Failed login attempt with invalid password', 'Session', NULL, NULL, 'Failed', '192.168.1.105', '{"reason":"invalid_credentials"}', 'CORR-L-014')
ON CONFLICT (event_id) DO NOTHING;

-- Reset primary key sequences after manual seeding to prevent unique constraint conflicts
SELECT setval('ai_duplicate_alerts_id_seq', (SELECT MAX(id) FROM ai_duplicate_alerts));
SELECT setval('ai_collection_priorities_id_seq', (SELECT MAX(id) FROM ai_collection_priorities));
SELECT setval('ai_collection_recommendations_id_seq', (SELECT MAX(id) FROM ai_collection_recommendations));
SELECT setval('ai_activity_logs_id_seq', (SELECT MAX(id) FROM ai_activity_logs));
