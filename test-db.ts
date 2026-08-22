import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function test() {
  console.log("Checking Bible database...");
  console.log("");

  console.log("Translations:", await prisma.bibleTranslation.count());
  console.log("Books:", await prisma.bibleBook.count());
  console.log("Chapters:", await prisma.bibleChapter.count());
  console.log("Verses:", await prisma.bibleVerse.count());

  const verse = await prisma.bibleVerse.findFirst({
    include: {
      BibleChapter: {
        include: {
          BibleBook: true
        }
      }
    }
  });

  console.log("");
  console.log("Sample verse:");
  console.log(verse);

  await prisma.$disconnect();
}

test().catch(async (error) => {
  console.error("DATABASE TEST FAILED");
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
