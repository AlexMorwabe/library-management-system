# Submission checklist

- [ ] Add the supplied files to the matching locations in `library-management-system`.
- [ ] Copy `api/.env.example` to `api/.env` and add the Supabase PostgreSQL connection string.
- [ ] Install the Prisma, NestJS and TypeScript dependencies listed in the README.
- [ ] Run `npx prisma generate` from `api/`.
- [ ] Run `npx prisma migrate dev --name init` from `api/`.
- [ ] Run `npx ts-node prisma/seed.ts` from `api/`.
- [ ] Confirm that at least four genres and fifteen books appear in Prisma Studio or Supabase.
- [ ] Commit the generated `api/prisma/migrations/` folder.
- [ ] Commit `.env.example`, but never commit `.env` or real credentials.
