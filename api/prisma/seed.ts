import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const genres = [
  {
    name: "Fiction",
    description: "Imaginary stories, novels and literary works.",
    books: [
      ["The Silent Patient", "Alex Michaelides", "9781250301697", 2019],
      ["Things Fall Apart", "Chinua Achebe", "9780385474542", 1958],
      ["The Great Gatsby", "F. Scott Fitzgerald", "9780743273565", 1925],
      ["To Kill a Mockingbird", "Harper Lee", "9780061120084", 1960],
    ],
  },
  {
    name: "Science",
    description: "Scientific ideas, discoveries and explanations.",
    books: [
      ["A Brief History of Time", "Stephen Hawking", "9780553380163", 1988],
      ["The Selfish Gene", "Richard Dawkins", "9780198788607", 1976],
      ["Cosmos", "Carl Sagan", "9780345539434", 1980],
      ["The Gene", "Siddhartha Mukherjee", "9781476733500", 2016],
    ],
  },
  {
    name: "Technology",
    description: "Computing, engineering and modern technology.",
    books: [
      ["Clean Code", "Robert C. Martin", "9780132350884", 2008],
      ["The Pragmatic Programmer", "David Thomas and Andrew Hunt", "9780135957059", 2019],
      ["Code", "Charles Petzold", "9780735611313", 1999],
      ["The Innovators", "Walter Isaacson", "9781476708690", 2014],
    ],
  },
  {
    name: "History",
    description: "Historical events, people and civilizations.",
    books: [
      ["Sapiens", "Yuval Noah Harari", "9780062316097", 2015],
      ["Guns, Germs, and Steel", "Jared Diamond", "9780393354324", 1997],
      ["The Silk Roads", "Peter Frankopan", "9781101912379", 2015],
      ["A People's History of the United States", "Howard Zinn", "9780062397348", 1980],
    ],
  },
  {
    name: "Business",
    description: "Entrepreneurship, leadership and management.",
    books: [
      ["The Lean Startup", "Eric Ries", "9780307887894", 2011],
      ["Good to Great", "Jim Collins", "9780066620992", 2001],
      ["Start with Why", "Simon Sinek", "9781591846444", 2009],
      ["The Personal MBA", "Josh Kaufman", "9781591845577", 2010],
    ],
  },
] as const;

async function main() {
  let insertedBooks = 0;

  for (const genreData of genres) {
    const genre = await prisma.genre.upsert({
      where: { name: genreData.name },
      update: { description: genreData.description },
      create: {
        name: genreData.name,
        description: genreData.description,
      },
    });

    for (const [title, author, isbn, publishedYear] of genreData.books) {
      await prisma.book.upsert({
        where: { isbn },
        update: {
          title,
          author,
          publishedYear,
          genreId: genre.id,
        },
        create: {
          title,
          author,
          isbn,
          publishedYear,
          description: `${title} by ${author}.`,
          totalCopies: 5,
          availableCopies: 5,
          genreId: genre.id,
        },
      });
      insertedBooks += 1;
    }
  }

  console.log(`Seed complete: ${genres.length} genres and ${insertedBooks} books processed.`);
}

main()
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
