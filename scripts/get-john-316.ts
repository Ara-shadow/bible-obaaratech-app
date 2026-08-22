import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

const main = async () => {
  const verse = await prisma.bibleVerse.findFirst({
    where: {
      number: 16,
      BibleChapter: {
        number: 3,
        BibleBook: {
          name: "John",
        },
      },
    },
    select: {
      id: true,
      number: true,
      text: true,
    },
  });

  console.log(JSON.stringify(verse, null, 2));
};

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
