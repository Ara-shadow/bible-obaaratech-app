import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/**
 * WEBU USFM book codes and names.
 *
 * The WEBU package contains the full ecumenical book set.
 * We only import actual Bible book files and ignore:
 * - front matter
 * - glossary
 * - HTML/CSS files
 * - copyright/source files
 */
const BOOKS: Record<string, string> = {
  GEN: "Genesis",
  EXO: "Exodus",
  LEV: "Leviticus",
  NUM: "Numbers",
  DEU: "Deuteronomy",
  JOS: "Joshua",
  JDG: "Judges",
  RUT: "Ruth",
  "1SA": "1 Samuel",
  "2SA": "2 Samuel",
  "1KI": "1 Kings",
  "2KI": "2 Kings",
  "1CH": "1 Chronicles",
  "2CH": "2 Chronicles",
  EZR: "Ezra",
  NEH: "Nehemiah",
  EST: "Esther",
  JOB: "Job",
  PSA: "Psalms",
  PRO: "Proverbs",
  ECC: "Ecclesiastes",
  SNG: "Song of Solomon",
  ISA: "Isaiah",
  JER: "Jeremiah",
  LAM: "Lamentations",
  EZK: "Ezekiel",
  DAN: "Daniel",
  HOS: "Hosea",
  JOL: "Joel",
  AMO: "Amos",
  OBA: "Obadiah",
  JON: "Jonah",
  MIC: "Micah",
  NAM: "Nahum",
  HAB: "Habakkuk",
  ZEP: "Zephaniah",
  HAG: "Haggai",
  ZEC: "Zechariah",
  MAL: "Malachi",

  TOB: "Tobit",
  JDT: "Judith",
  ESG: "Esther (Greek)",
  WIS: "Wisdom",
  SIR: "Sirach",
  BAR: "Baruch",
  "1MA": "1 Maccabees",
  "2MA": "2 Maccabees",
  "1ES": "1 Esdras",
  MAN: "Prayer of Manasseh",
  PS2: "Psalm 151",
  "3MA": "3 Maccabees",
  "2ES": "2 Esdras",
  "4MA": "4 Maccabees",

  MAT: "Matthew",
  MRK: "Mark",
  LUK: "Luke",
  JHN: "John",
  ACT: "Acts",
  ROM: "Romans",
  "1CO": "1 Corinthians",
  "2CO": "2 Corinthians",
  GAL: "Galatians",
  EPH: "Ephesians",
  PHP: "Philippians",
  COL: "Colossians",
  "1TH": "1 Thessalonians",
  "2TH": "2 Thessalonians",
  "1TI": "1 Timothy",
  "2TI": "2 Timothy",
  TIT: "Titus",
  PHM: "Philemon",
  HEB: "Hebrews",
  JAS: "James",
  "1PE": "1 Peter",
  "2PE": "2 Peter",
  "1JN": "1 John",
  "2JN": "2 John",
  "3JN": "3 John",
  JUD: "Jude",
  REV: "Revelation",

  DAG: "Daniel (Greek)",
};

/**
 * Extract the USFM book code from filenames such as:
 *
 * 02-GENengwebu.usfm
 * 03-EXOengwebu.usfm
 * 70-MATengwebu.usfm
 */
function getBookCode(filename: string): string | null {
  const match = filename.match(/^\d+-([A-Z0-9]+)engwebu\.usfm$/i);

  if (!match) {
    return null;
  }

  return match[1].toUpperCase();
}

/**
 * Clean USFM formatting from verse text.
 *
 * This does not modify the actual Bible wording intentionally.
 * It removes structural/formatting markers so the database
 * contains readable verse text.
 */
function cleanUsfmText(text: string): string {
  let result = text;

  // Remove footnotes.
  result = result.replace(/\\f\s+.*?\\f\*/gs, " ");

  // Remove cross references.
  result = result.replace(/\\x\s+.*?\\x\*/gs, " ");

  // Remove word-level additions/formatting wrappers.
  result = result.replace(/\\add\s+/g, "");
  result = result.replace(/\\add\*/g, "");

  result = result.replace(/\\wj\s+/g, "");
  result = result.replace(/\\wj\*/g, "");

  result = result.replace(/\\qt\s+/g, "");
  result = result.replace(/\\qt\*/g, "");

  result = result.replace(/\\nd\s+/g, "");
  result = result.replace(/\\nd\*/g, "");

  result = result.replace(/\\tl\s+/g, "");
  result = result.replace(/\\tl\*/g, "");

  result = result.replace(/\\sc\s+/g, "");
  result = result.replace(/\\sc\*/g, "");

  // Remove common paragraph/poetry markers.
  result = result.replace(
    /\\(?:p|m|q\d?|mi|pi\d?|li\d?|s\d?|r|d|sp|nb|b)\s*/g,
    " "
  );

  // Remove remaining simple USFM markers.
  result = result.replace(/\\[a-zA-Z0-9]+\*?/g, " ");

  // Remove USFM attributes / unusual formatting braces.
  result = result.replace(/\|[^}]*\}/g, "");
  result = result.replace(/[{}]/g, "");

  // Convert escaped special characters.
  result = result.replace(/\\~/g, " ");
  result = result.replace(/\\-/g, "-");
  result = result.replace(/\\_/g, "_");
  result = result.replace(/\\\*/g, "*");

  // Remove multiple spaces.
  result = result.replace(/\s+/g, " ");

  return result.trim();
}

/**
 * Parse one USFM file.
 *
 * Returns:
 * {
 *   chapter,
 *   verse,
 *   text
 * }
 */
function parseUsfm(content: string): Array<{
  chapter: number;
  verse: number;
  text: string;
}> {
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  const verses: Array<{
    chapter: number;
    verse: number;
    text: string;
  }> = [];

  let currentChapter: number | null = null;
  let currentVerse: number | null = null;
  let currentText = "";

  function saveCurrentVerse() {
    if (
      currentChapter === null ||
      currentVerse === null ||
      !currentText.trim()
    ) {
      return;
    }

    const text = cleanUsfmText(currentText);

    if (!text) {
      return;
    }

    verses.push({
      chapter: currentChapter,
      verse: currentVerse,
      text,
    });
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    /**
     * Chapter marker:
     * \c 1
     */
    const chapterMatch = line.match(/^\\c\s+(\d+)/);

    if (chapterMatch) {
      saveCurrentVerse();

      currentChapter = Number(chapterMatch[1]);
      currentVerse = null;
      currentText = "";

      continue;
    }

    /**
     * Verse marker:
     * \v 1 In the beginning...
     */
    const verseMatch = line.match(/^\\v\s+(\d+)(?:\s+(.*))?$/);

    if (verseMatch) {
      saveCurrentVerse();

      currentVerse = Number(verseMatch[1]);
      currentText = verseMatch[2] ?? "";

      continue;
    }

    /**
     * Some USFM text can continue on another line.
     * Only append it when we are currently inside a verse.
     */
    if (currentChapter !== null && currentVerse !== null) {
      currentText += ` ${line}`;
    }
  }

  // Save final verse.
  saveCurrentVerse();

  return verses;
}

async function main() {
  console.log("");
  console.log("==============================================");
  console.log("   OBAARATECH BIBLE AI - WEBU IMPORTER");
  console.log("==============================================");
  console.log("");

  const dataDirectory = path.resolve(process.cwd(), "data", "webu");

  console.log(`Bible source directory:`);
  console.log(dataDirectory);
  console.log("");

  if (!fs.existsSync(dataDirectory)) {
    throw new Error(
      `WEBU directory not found: ${dataDirectory}`
    );
  }

  const files = fs
    .readdirSync(dataDirectory)
    .filter((file) => file.toLowerCase().endsWith(".usfm"));

  console.log(`USFM files found: ${files.length}`);
  console.log("");

  /**
   * Create/update the WEBU translation.
   *
   * The actual Bible text remains World English Bible Updated.
   */
  const translation = await prisma.bibleTranslation.upsert({
    where: {
      code: "WEBU",
    },
    update: {
      name: "World English Bible Updated",
    },
    create: {
      id: "translation-webu",
      name: "World English Bible Updated",
      code: "WEBU",
    },
  });

  console.log(`Translation: ${translation.name}`);
  console.log(`Translation ID: ${translation.id}`);
  console.log("");

  let totalBooks = 0;
  let totalChapters = 0;
  let totalVerses = 0;
  let skippedFiles = 0;
  let failedFiles = 0;

  const importedBooks = new Set<string>();
  const importedChapters = new Set<string>();

  /**
   * Sort files according to the numeric prefix.
   *
   * Example:
   * 02-GEN
   * 03-EXO
   * ...
   * 70-MAT
   */
  files.sort((a, b) => {
    const aNumber = Number(a.match(/^(\d+)/)?.[1] ?? 999);
    const bNumber = Number(b.match(/^(\d+)/)?.[1] ?? 999);

    return aNumber - bNumber;
  });

  for (const filename of files) {
    const bookCode = getBookCode(filename);

    if (!bookCode) {
      console.log(`Skipping unknown file: ${filename}`);
      skippedFiles++;
      continue;
    }

    const bookName = BOOKS[bookCode];

    if (!bookName) {
      console.log(
        `Skipping unsupported WEBU book code: ${bookCode} (${filename})`
      );
      skippedFiles++;
      continue;
    }

    try {
      const filePath = path.join(dataDirectory, filename);
      const content = fs.readFileSync(filePath, "utf8");

      const verses = parseUsfm(content);

      if (verses.length === 0) {
        console.log(`No verses found: ${filename}`);
        skippedFiles++;
        continue;
      }

      /**
       * Stable book ID.
       */
      const bookId = `webu-${bookCode}`;

      const book = await prisma.bibleBook.upsert({
        where: {
          id: bookId,
        },
        update: {
          name: bookName,
          order: Number(filename.match(/^(\d+)/)?.[1] ?? 999),
          translationId: translation.id,
        },
        create: {
          id: bookId,
          name: bookName,
          order: Number(filename.match(/^(\d+)/)?.[1] ?? 999),
          translationId: translation.id,
        },
      });

      if (!importedBooks.has(book.id)) {
        importedBooks.add(book.id);
        totalBooks++;
      }

      /**
       * Group verses by chapter.
       */
      const chapters = new Map<
        number,
        Array<{
          verse: number;
          text: string;
        }>
      >();

      for (const item of verses) {
        if (!chapters.has(item.chapter)) {
          chapters.set(item.chapter, []);
        }

        chapters.get(item.chapter)!.push({
          verse: item.verse,
          text: item.text,
        });
      }

      for (const [chapterNumber, chapterVerses] of chapters) {
        const chapterId = `${book.id}-c${chapterNumber}`;

        await prisma.bibleChapter.upsert({
          where: {
            id: chapterId,
          },
          update: {
            number: chapterNumber,
            bookId: book.id,
          },
          create: {
            id: chapterId,
            number: chapterNumber,
            bookId: book.id,
          },
        });

        if (!importedChapters.has(chapterId)) {
          importedChapters.add(chapterId);
          totalChapters++;
        }

        for (const verse of chapterVerses) {
          const verseId = `${chapterId}-v${verse.verse}`;

          await prisma.bibleVerse.upsert({
            where: {
              id: verseId,
            },
            update: {
              number: verse.verse,
              text: verse.text,
              chapterId,
            },
            create: {
              id: verseId,
              number: verse.verse,
              text: verse.text,
              chapterId,
            },
          });

          totalVerses++;
        }
      }

      console.log(
        `Imported ${bookName.padEnd(25)} ${String(verses.length).padStart(
          6
        )} verses`
      );
    } catch (error) {
      failedFiles++;

      console.error("");
      console.error(`FAILED: ${filename}`);
      console.error(error);
      console.error("");
    }
  }

  console.log("");
  console.log("==============================================");
  console.log("           WEBU IMPORT COMPLETE");
  console.log("==============================================");
  console.log("");
  console.log(`Translation : ${translation.name}`);
  console.log(`Books       : ${totalBooks}`);
  console.log(`Chapters    : ${totalChapters}`);
  console.log(`Verses      : ${totalVerses}`);
  console.log(`Skipped     : ${skippedFiles}`);
  console.log(`Failed      : ${failedFiles}`);
  console.log("");
  console.log("The Bible database is now populated.");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("==============================================");
    console.error("             WEBU IMPORT FAILED");
    console.error("==============================================");
    console.error("");
    console.error(error);
    console.error("");

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });