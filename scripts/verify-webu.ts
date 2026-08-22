import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const translation = await prisma.bibleTranslation.findUnique({
    where: { code: "WEBU" },
    select: {
      id: true,
      name: true,
      code: true,
    },
  });

  const books = await prisma.bibleBook.count();
  const chapters = await prisma.bibleChapter.count();
  const verses = await prisma.bibleVerse.count();

  const strongMarkup = await prisma.bibleVerse.count({
    where: {
      text: {
        contains: '|strong="',
      },
    },
  });

  const samples = await prisma.bibleVerse.findMany({
    where: {
      OR: [
        {
          number: 1,
          BibleChapter: {
            number: 1,
            BibleBook: {
              name: "Genesis",
            },
          },
        },
        {
          number: 16,
          BibleChapter: {
            number: 3,
            BibleBook: {
              name: "John",
            },
          },
        },
        {
          number: 21,
          BibleChapter: {
            number: 22,
            BibleBook: {
              name: "Revelation",
            },
          },
        },
      ],
    },
    select: {
      number: true,
      text: true,
      BibleChapter: {
        select: {
          number: true,
          BibleBook: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  console.log("");
  console.log("========================================");
  console.log("WEBU DATABASE VERIFICATION");
  console.log("========================================");
  console.log(`Translation: ${translation?.name}`);
  console.log(`Code:        ${translation?.code}`);
  console.log(`Books:       ${books}`);
  console.log(`Chapters:    ${chapters}`);
  console.log(`Verses:      ${verses}`);
  console.log(`Strong markup remaining: ${strongMarkup}`);
  console.log("");

  console.log("Sample verses:");

  for (const verse of samples) {
    console.log(
      `${verse.BibleChapter.BibleBook.name} ` +
      `${verse.BibleChapter.number}:${verse.number}`
    );
    console.log(verse.text);
    console.log("");
  }

  console.log("========================================");

  if (
    translation?.code === "WEBU" &&
    books === 66 &&
    chapters === 1189 &&
    verses === 31098 &&
    strongMarkup === 0
  ) {
    console.log("VERIFICATION PASSED");
  } else {
    console.log("VERIFICATION FAILED");
  }

  console.log("========================================");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });