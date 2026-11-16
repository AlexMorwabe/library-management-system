# Library Management System — Data Layer

This project implements the data layer for a library book catalog using **Prisma ORM**, **NestJS**, **TypeScript**, and **Supabase PostgreSQL**.

## Project structure

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

## 1. Prisma schema

The schema defines:

- `Role` enum with `PATRON` and `LIBRARIAN`.
- `User` with an auto-incrementing integer ID, unique email, password and role (default `PATRON`).
- `Genre` with unique name and slug.
- `Book` with title, author, unique ISBN, description, optional cover image, copy counts, `genreId` and a Prisma relation to `Genre`.
- Optional `Review` model related to both `Book` and `User`.

Each book belongs to one genre. A genre can have many books. A review belongs to one user and one book. The compound unique key on `[bookId, userId]` prevents a user from reviewing the same book more than once.

## Schema Decisions

`Book` references `Genre` through a `genreId` foreign key rather than embedding the genre name directly in every book record. Many books can share one genre, and genres are managed independently. If a genre is renamed, the change is made once in the `Genre` table instead of updating every book. The foreign key also ensures that each book refers to an existing genre.

`User` stores a `role` field using the `Role` enum. This restricts role values to `PATRON` or `LIBRARIAN` at the database-schema level and provides the same enum values to Prisma Client and TypeScript.

## 2. Supabase database configuration

1. Create or open your Supabase project.
2. In Supabase, go to **Project Settings → Database → Connection string**.
3. Copy the PostgreSQL connection string. Use the connection mode recommended for your environment.
4. From the `api` directory, copy `.env.example` to `.env`.
5. Replace the placeholder in `DATABASE_URL` with your actual Supabase connection string.

Do not commit `.env`, passwords, or other database credentials. Commit `.env.example` only.

## 3. Install dependencies

Run these commands from the `api` directory. If the repository already has a `package.json`, retain its existing dependencies and add only missing packages.

```bash
npm install @nestjs/common @nestjs/core @prisma/client
npm install -D prisma ts-node typescript @types/node
```

Generate Prisma Client:

```bash
npx prisma generate
```

## 4. Run the migration

With `api/.env` configured, run:

```bash
npx prisma migrate dev --name init
```

This creates a migration in `api/prisma/migrations/` and applies the schema to the PostgreSQL database configured in Supabase.

Commit the generated migration folder to Git. For an already-created migration in a deployment environment, use:

```bash
npx prisma migrate deploy
```

## 5. Run and verify the seed

From the `api` directory, run:

```bash
npx ts-node prisma/seed.ts
```

The seed inserts four genres (Fantasy, Science Fiction, Mystery and Biography) and twenty books distributed evenly across those genres. It uses `upsert` and stable ISBN values, so rerunning it does not create duplicate seeded records.

Open Prisma Studio to inspect the data:

```bash
npx prisma studio
```

You should see at least four genre records and fifteen book records (the seed provides twenty). You can also verify using the Supabase SQL Editor:

```sql
SELECT COUNT(*) FROM "Genre";
SELECT COUNT(*) FROM "Book";
```

## 6. Use PrismaService in NestJS

Import `PrismaModule` into the application module:

```typescript
import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [PrismaModule],
})
export class AppModule {}
```

Inject `PrismaService` into a service that needs database access:

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

## 7. Prisma versus a document database

One difference is that Prisma makes relational links explicit in the schema. Here, `Book.genreId` is a foreign key and `@relation` declares the connection to `Genre`. In a document database, genre details could instead be embedded in each book document. Embedding can make some reads convenient, but it may duplicate genre data and make updates harder to keep consistent.

## Security and validation notes

- Keep `.env` private and exclude it from Git.
- Store password hashes, never plain-text passwords, when implementing authentication.
- Validate review ratings (for example, 1–5) and copy counts in the API layer.
- Do not expose database credentials or Supabase service-role keys in client-side code.
