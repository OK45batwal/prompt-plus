-- AlterTable
ALTER TABLE "users" ADD COLUMN "reset_token" TEXT;
ALTER TABLE "users" ADD COLUMN "reset_token_expiry" TIMESTAMPTZ;
CREATE UNIQUE INDEX "users_reset_token_key" ON "users"("reset_token");
