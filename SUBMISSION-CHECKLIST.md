# Submission checklist

- [ ] Copy the supplied files into the matching locations in `library-management-system`.
- [ ] Configure `api/.env` with Supabase `DATABASE_URL` and `DIRECT_URL`.
- [ ] Install dependencies and run `npx prisma generate`.
- [ ] Run `npx prisma migrate dev --name init`.
- [ ] Run `npx tsx prisma/seed.ts`.
- [ ] Verify five genres and twenty books in Supabase or Prisma Studio.
- [ ] Commit the generated migration folder, source files, README and `.env.example`.
- [ ] Confirm that `.env` and all real credentials are excluded from Git.
