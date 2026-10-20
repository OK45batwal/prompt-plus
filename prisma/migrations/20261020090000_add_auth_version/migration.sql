-- Revocation counter for issued JWTs. Additive: existing rows start at 0 and keep
-- their sessions until the next password change or "Sign out everywhere".
-- IF NOT EXISTS keeps this safe to apply by hand before Prisma records it.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_version" INTEGER NOT NULL DEFAULT 0;
