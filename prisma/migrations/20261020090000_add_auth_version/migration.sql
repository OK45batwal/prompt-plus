-- Revocation counter for issued JWTs. Additive: existing rows start at 0 and keep
-- their sessions until the next password change or "Sign out everywhere".
ALTER TABLE "users" ADD COLUMN "auth_version" INTEGER NOT NULL DEFAULT 0;
