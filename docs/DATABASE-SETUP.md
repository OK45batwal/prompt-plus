# Database setup

The runtime in `src/lib/db/prisma.ts` uses PrismaNeonHttp. Use a Neon PostgreSQL connection for the current application. Supabase and a plain local PostgreSQL URL are not interchangeable with this runtime adapter; they need an appropriate adapter change or compatible proxy first. SQLite is not supported by the current Prisma schema.

1. Create/select a Neon development database and copy its PostgreSQL connection URL with SSL enabled.
2. Set `DATABASE_URL` in the Next.js environment (`.env.local`). Also expose it to Prisma CLI through the shell or ignored `.env`; `prisma.config.ts` loads `.env`, not `.env.local`.
3. Install dependencies and apply the checked-in migrations to that development database:

```sh
npm ci
npx prisma migrate deploy
npm run check-env
npm run dev
```

Use a separate development database. Review migrations and backups before applying them to production. Never commit connection credentials.

Configure AUTH_SECRET and ENCRYPTION_KEY as described in the root README. Configure SMTP or Resend for verification/reset emails. Production rate-limited routes additionally require both Upstash REST variables; see [reliability contracts](RELIABILITY.md).

The default automated suite uses mocks for application database calls. Its separate real Redis test does not require a PostgreSQL account. Public browser smoke tests cover signed-out pages and access protection; authenticated database journeys need a configured test database and test accounts.
