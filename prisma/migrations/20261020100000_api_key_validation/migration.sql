-- One credential per provider per user. Keep the most recently updated row.
DELETE FROM "api_keys" AS a
USING "api_keys" AS b
WHERE a."user_id" = b."user_id"
  AND a."provider" = b."provider"
  AND (a."updated_at" < b."updated_at" OR (a."updated_at" = b."updated_at" AND a."id" < b."id"));

ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "key_hint" TEXT;
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "last_validated_at" TIMESTAMP(3);
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "last_validation_status" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_user_id_provider_key" ON "api_keys"("user_id", "provider");
