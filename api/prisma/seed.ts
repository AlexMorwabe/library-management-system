import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const genreData = [
  { name: "Fantasy", slug: "fantasy" },
  { name: "Science Fiction", slug: "science-fiction" },
  { name: "Mystery", slug: "mystery" },
  { name: "Biography", slug: "biography" },
];

const sampleBooks = [
  { title: "The Hobbit", author: "J.R.R. Tolkien", genre: "Fantasy" },
  { title: "The Fellowship of the Ring", author: "J.R.R. Tolkien", genre: "Fantasy" },
  { title: "A Game of Thrones", author: "George R.R. Martin", genre: "Fantasy" },
  { title: "The Name of the Wind", author: "Patrick Rothfuss", genre: "Fantasy" },
  { title: "The Lion, the Witch and the Wardrobe", author: "C.S. Lewis", genre: "Fantasy" },

  { title: "Dune", author: "Frank Herbert", genre: "Science Fiction" },
  { title: "1984", author: "George Orwell", genre: "Science Fiction" },
  { title: "Fahrenheit 451", author: "Ray Bradbury", genre: "Science Fiction" },
  { title: "The Martian", author: "Andy Weir", genre: "Science Fiction" },
  { title: "Foundation", author: "Isaac Asimov", genre: "Science Fiction" },

  { title: "The Big Sleep", author: "Raymond Chandler", genre: "Mystery" },
  { title: "Murder on the Orient Express", author: "Agatha Christie", genre: "Mystery" },
  { title: "The Hound of the Baskervilles", author: "Arthur Conan Doyle", genre: "Mystery" },
  { title: "Gone Girl", author: "Gillian Flynn", genre: "Mystery" },
  { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", genre: "Mystery" },

  { title: "Educated", author: "Tara Westover", genre: "Biography" },
  { title: "Long Walk to Freedom", author: "Nelson Mandela", genre: "Biography" },
  { title: "The Diary of a Young Girl", author: "Anne Frank", genre: "Biography" },
  { title: "Steve Jobs", author: "Walter Isaacson", genre: "Biography" },
  { title: "I Am Malala", author: "Malala Yousafzai", genre: "Biography" },
];

async function main() {
  // Upsert makes the seed safe to run again without duplicating genres.
  const genres = await Promise.all(
    genreData.map((genre) =>
      prisma.genre.upsert({
        where: { slug: genre.slug },
        update: { name: genre.name },
        create: genre,
      }),
    ),
  );

  const genreByName = new Map(genres.map((genre) => [genre.name, genre]));

  // Stable ISBNs make book upserts repeatable.
  for (const [index, book] of sampleBooks.entries()) {
    const genre = genreByName.get(book.genre);
    if (!genre) {
      throw new Error(`Genre not found for book: ${book.title}`);
    }

    const isbn = `978000000${String(index + 1).padStart(4, "0")}`;

    await prisma.book.upsert({
      where: { isbn },
      update: {
        title: book.title,
        author: book.author,
        description: `${book.title} by ${book.author}.`,
        genreId: genre.id,
      },
      create: {
        title: book.title,
        author: book.author,
        isbn,
        description: `${book.title} by ${book.author}.`,
        totalCopies: 3,
        availableCopies: 3,
        genreId: genre.id,
      },
    });
  }

  const [genreCount, bookCount] = await Promise.all([
    prisma.genre.count(),
    prisma.book.count(),
  ]);

  console.log(`Seed complete. Genres in database: ${genreCount}. Books in database: ${bookCount}.`);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
