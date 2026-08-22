import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function cleanText(text: string): string {
  return text
    .replace(/\|strong="[^"]*"/g, "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  console.log("Loading WEBU verses...");

  const verses = await prisma.bibleVerse.findMany({
    select: {
      id: true,
      text: true,
    },
  });

  console.log(`Found ${verses.length} verses.`);

  let changed = 0;

  for (const verse of verses) {
    const cleaned = cleanText(verse.text);

    if (cleaned !== verse.text) {
      await prisma.bibleVerse.update({
        where: { id: verse.id },
        data: { text: cleaned },
      });

      changed++;
    }
  }

  console.log("");
  console.log("========================================");
  console.log("WEBU CLEANUP COMPLETE");
  console.log("========================================");
  console.log(`Total verses:   ${verses.length}`);
  console.log(`Verses cleaned: ${changed}`);
  console.log("========================================");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });