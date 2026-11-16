# Library Management System — Data Layer

A relational data layer for a library book catalog, built with NestJS, Prisma ORM and hosted PostgreSQL on Supabase.

## Technology stack

- PostgreSQL hosted by Supabase
- Prisma ORM and Prisma Client
- NestJS
- TypeScript

## Project files

```text
library-management-system/
├── api/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   └── prisma/
│   │       ├── prisma.module.ts
│   │       └── prisma.service.ts
│   └── .env.example
└── README.md
```

## Data model

### Role enum and User

`Role` restricts user roles to `PATRON` and `LIBRARIAN`. A new user defaults to `PATRON`. Email is unique so that two accounts cannot share the same email address.

### Genre and Book

A `Genre` can be associated with many `Book` records. Each `Book` has one `genreId` foreign key and a Prisma `@relation` to `Genre`. ISBN is unique. Copy counts are stored on the book record so that the catalog can track total and available copies.

### Review

The optional `Review` model links one user to one book and stores a rating and optional comment. The compound unique constraint on `[bookId, userId]` prevents a user from reviewing the same book more than once. Ratings should be validated as integers from 1 to 5 in the application layer.

## Schema Decisions

The `Book` model references `Genre` through a `genreId` foreign key instead of embedding the genre name or genre object inside every book record. This is a normalized relational design.

There are several reasons for this decision:

1. **Avoids duplication:** genre names and descriptions are stored once in the `Genre` table rather than repeated in every book.
2. **Maintains consistency:** if a genre name changes, it is updated in one place and all related books continue to reference the same genre record.
3. **Enforces referential integrity:** PostgreSQL ensures that a book cannot reference a genre that does not exist.
4. **Supports queries and relationships:** Prisma can retrieve a book together with its genre, or retrieve all books belonging to a genre, using the declared relation.
5. **Makes the data easier to maintain:** genres can be managed independently of books.

The trade-off is that a query needing both book and genre information may require a relational join. This is appropriate for a library catalog because genres are shared entities with their own attributes.

## Prisma versus a document database

The main difference I noticed is that Prisma makes relationships explicit in the schema. In this design, `genreId` is a foreign key and `@relation` declares how `Book` and `Genre` are connected. In a document database, it would be possible to embed genre details inside each book document, which can make some reads simpler but may duplicate genre information and require more care when that information changes.

## Supabase setup

1. Create a Supabase project.
2. Open **Project Settings → Database → Connection string**.
3. Copy the connection strings for your project.
4. In the `api` directory, create a local `.env` file by copying `.env.example`.
5. Replace the placeholders with your own Supabase connection details. Do not commit `.env`.

Use the Supabase transaction pooler connection (commonly port `6543`, with `pgbouncer=true`) for `DATABASE_URL` when appropriate for your project. Use a direct database connection, or the Supabase session pooler if direct IPv6 connectivity is unavailable, for `DIRECT_URL` and migrations. Copy the exact connection strings shown in your Supabase dashboard; connection hostnames vary by project and region.

## Installation

Run these commands from the `api` directory:

```bash
npm install
npm install @nestjs/common @nestjs/core @prisma/client@6
npm install -D prisma@6 tsx typescript
```

If this is an existing NestJS API, retain its existing dependencies and package scripts rather than replacing its `package.json`.

This starter uses Prisma 6 so the `url` and `directUrl` datasource settings shown in `schema.prisma` work as written. If your existing project already uses another Prisma major version, align the schema and configuration with that version before installing.

Generate the Prisma Client:

```bash
npx prisma generate
```

## Run the migration

With the local `api/.env` configured:

```bash
npx prisma migrate dev --name init
```

This creates a migration in `api/prisma/migrations/` and applies it to the configured PostgreSQL database.

For deployment environments where migrations have already been committed, use:

```bash
npx prisma migrate deploy
```

Do not use `prisma migrate dev` as the production deployment command.

## Seed the database

From the `api` directory:

```bash
npx tsx prisma/seed.ts
```

The seed script is safe to run more than once: it uses `upsert` for genres and ISBNs. It processes five genres and twenty books.

To use `npx prisma db seed` instead, add the following Prisma seed configuration to the existing `api/package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Then run:

```bash
npx prisma db seed
```

Merge that configuration into the existing `package.json`; do not overwrite other project settings.

## Verify the database

Open Prisma Studio:

```bash
npx prisma studio
```

Check that the database contains at least:

- 5 rows in `Genre`
- 20 rows in `Book`
- The `User` table and `Role` enum
- The `Review` table and its foreign keys

You can also verify counts in the Supabase SQL Editor:

```sql
SELECT COUNT(*) AS genre_count FROM "Genre";
SELECT COUNT(*) AS book_count FROM "Book";
SELECT COUNT(*) AS user_count FROM "User";
SELECT COUNT(*) AS review_count FROM "Review";
```

## Connect Prisma to NestJS

Import `PrismaModule` into your root application module (or another module that needs the service). It is marked `@Global()`, so once imported, `PrismaService` can be injected into other modules.

Example:

```typescript
import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [PrismaModule],
})
export class AppModule {}
```

Inject the service into another provider:

```typescript
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.book.findMany({
      include: { genre: true },
      orderBy: { title: "asc" },
    });
  }
}
```

## Important security notes

- Keep `.env` out of Git. Add it to `.gitignore` if it is not already there.
- Commit `.env.example`, not your real `.env`.
- Never put a Supabase service-role key or database password in source code.
- Validate review ratings (1–5) and copy counts (non-negative) in your API DTOs/services.
- Back up important database data before applying schema changes to a database containing existing records.
