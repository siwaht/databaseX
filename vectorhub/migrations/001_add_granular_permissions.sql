-- Migration: Add granular_permissions column to users table
-- Run this SQL against your PostgreSQL database to enable granular permissions

-- Add the granular_permissions column as JSONB
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS granular_permissions JSONB DEFAULT NULL;

-- Add a comment to describe the column
COMMENT ON COLUMN users.granular_permissions IS 'Granular permissions for user access control: allowedCollections, allowedTabs, allowedAgents';

-- Example of the JSON structure:
-- {
--   "allowedCollections": ["collection1", "collection2"],
--   "allowedTabs": ["/", "/collections", "/documents"],
--   "allowedAgents": ["agent_123", "agent_456"]
-- }
