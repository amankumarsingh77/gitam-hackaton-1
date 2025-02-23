-- Terminate all connections to force plan cache clear
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = current_database() AND pid <> pg_backend_pid();

-- Clear all caches
DISCARD ALL;

-- Update the column type
ALTER TABLE chapters
ALTER COLUMN description TYPE VARCHAR(500);

-- Update statistics
ANALYZE chapters;

-- Reset query plans
DEALLOCATE ALL; 