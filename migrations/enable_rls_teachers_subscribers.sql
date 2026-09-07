-- Locks the teachers and subscribers tables so the public API key can no
-- longer read or write them directly (passwords, emails). All access to
-- these tables now goes through server-side API routes using the service
-- role key, which bypasses RLS automatically.
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
