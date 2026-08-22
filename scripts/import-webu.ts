import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BOOKS = [
  ['GEN', 'Genesis', 'OT', 1],
  ['EXO', 'Exodus', 'OT', 2],
  ['LEV', 'Leviticus', 'OT', 3],
  ['NUM', 'Numbers', 'OT', 4],
  ['DEU', 'Deuteronomy', 'OT', 5],
  ['JOS', 'Joshua', 'OT', 6],
  ['JDG', 'Judges', 'OT', 7],
  ['RUT', 'Ruth', 'OT', 8],
  ['1SA', '1 Samuel', 'OT', 9],
  ['2SA', '2 Samuel', 'OT', 10],
  ['1KI', '1 Kings', 'OT', 11],
  ['2KI', '2 Kings', 'OT', 12],
  ['1CH', '1 Chronicles', 'OT', 13],
  ['2CH', '2 Chronicles', 'OT', 14],
  ['EZR', 'Ezra', 'OT', 15],
  ['NEH', 'Nehemiah', 'OT', 16],
  ['EST', 'Esther', 'OT', 17],

  ['JOB', 'Job', 'OT', 18],
  ['PSA', 'Psalms', 'OT', 19],
  ['PRO', 'Proverbs', 'OT', 20],
  ['ECC', 'Ecclesiastes', 'OT', 21],
  ['SNG', 'Song of Solomon', 'OT', 22],

  ['ISA', 'Isaiah', 'OT', 23],
  ['JER', 'Jeremiah', 'OT', 24],
  ['LAM', 'Lamentations', 'OT', 25],
  ['EZK', 'Ezekiel', 'OT', 26],
  ['DAN', 'Daniel', 'OT', 27],
  ['HOS', 'Hosea', 'OT', 28],
  ['JOL', 'Joel', 'OT', 29],
  ['AMO', 'Amos', 'OT', 30],
  ['OBA', 'Obadiah', 'OT', 31],
  ['JON', 'Jonah', 'OT', 32],
  ['MIC', 'Micah', 'OT', 33],
  ['NAM', 'Nahum', 'OT', 34],
  ['HAB', 'Habakkuk', 'OT', 35],
  ['ZEP', 'Zephaniah', 'OT', 36],
  ['HAG', 'Haggai', 'OT', 37],
  ['ZEC', 'Zechariah', 'OT', 38],
  ['MAL', 'Malachi', 'OT', 39],

  ['MAT', 'Matthew', 'NT', 40],
  ['MRK', 'Mark', 'NT', 41],
  ['LUK', 'Luke', 'NT', 42],
  ['JHN', 'John', 'NT', 43],
  ['ACT', 'Acts', 'NT', 44],

  ['ROM', 'Romans', 'NT', 45],
  ['1CO', '1 Corinthians', 'NT', 46],
  ['2CO', '2 Corinthians', 'NT', 47],
  ['GAL', 'Galatians', 'NT', 48],
  ['EPH', 'Ephesians', 'NT', 49],
  ['PHP', 'Philippians', 'NT', 50],
  ['COL', 'Colossians', 'NT', 51],
  ['1TH', '1 Thessalonians', 'NT', 52],
  ['2TH', '2 Thessalonians', 'NT', 53],
  ['1TI', '1 Timothy', 'NT', 54],
  ['2TI', '2 Timothy', 'NT', 55],
  ['TIT', 'Titus', 'NT', 56],
  ['PHM', 'Philemon', 'NT', 57],
  ['HEB', 'Hebrews', 'NT', 58],
  ['JAS', 'James', 'NT', 59],
  ['1PE', '1 Peter', 'NT', 60],
  ['2PE', '2 Peter', 'NT', 61],
  ['1JN', '1 John', 'NT', 62],
  ['2JN', '2 John', 'NT', 63],
  ['3JN', '3 John', 'NT', 64],
  ['JUD', 'Jude', 'NT', 65],
  ['REV', 'Revelation', 'NT', 66],
] as const;

const bookMap = new Map(
  BOOKS.map(([code, name, testament, order]) => [
    code,
    {
      name,
      testament,
      order,
    },
  ]),
);

function cleanUsfm(text: string): string {
  return text
    // Footnotes
    .replace(/\\f\s[\s\S]*?\\f\*/g, ' ')

    // Cross references
    .replace(/\\x\s[\s\S]*?\\x\*/g, ' ')

    // Character formatting
    .replace(/\\w\s+([\s\S]*?)\\w\*/g, '$1')
    .replace(/\\add\s+([\s\S]*?)\\add\*/g, '$1')
    .replace(/\\qt\s+([\s\S]*?)\\qt\*/g, '$1')
    .replace(/\\nd\s+([\s\S]*?)\\nd\*/g, '$1')
    .replace(/\\wj\s+([\s\S]*?)\\wj\*/g, '$1')

    // Remove remaining USFM markers
    .replace(/\\[+]?\w+\*?/g, ' ')

    // Remove braces
    .replace(/[{}]/g, ' ')

    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

type ParsedVerse = {
  code: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
  text: string;
};

function parseFile(content: string, code: string): ParsedVerse[] {
  const meta = bookMap.get(code);

  if (!meta) {
    return [];
  }

  let chapter: number | null = null;
  const rows: ParsedVerse[] = [];

  for (const raw of content.split(/\r?\n/)) {
    const chapterMatch = raw.match(/^\\c\s+(\d+)/);

    if (chapterMatch) {
      chapter = Number(chapterMatch[1]);
      continue;
    }

    const verseMatch = raw.match(
      /^\\v\s+(\d+)(?:-(\d+))?\s+(.+)$/,
    );

    if (!verseMatch || chapter === null) {
      continue;
    }

    const verseStart = Number(verseMatch[1]);
    const verseEnd = verseMatch[2]
      ? Number(verseMatch[2])
      : null;

    const text = cleanUsfm(verseMatch[3]);

    if (!text) {
      continue;
    }

    rows.push({
      code,
      book: meta.name,
      chapter,
      verseStart,
      verseEnd,
      text,
    });
  }

  return rows;
}

async function main() {
  const dir = path.resolve('data/webu');

  const files = await fs.readdir(dir);

  const all: ParsedVerse[] = [];

  for (const [code] of BOOKS) {
    const file = files.find((f) =>
      f.endsWith(`${code}engwebu.usfm`),
    );

    if (!file) {
      throw new Error(`Missing USFM file for ${code}`);
    }

    const content = await fs.readFile(
      path.join(dir, file),
      'utf8',
    );

    all.push(...parseFile(content, code));
  }

  if (all.length < 30000) {
    throw new Error(
      `Corpus looks incomplete: only ${all.length} verses parsed`,
    );
  }

  const counts = new Map<string, number>();

  for (const row of all) {
    counts.set(
      row.book,
      (counts.get(row.book) ?? 0) + 1,
    );
  }

  console.log(
    `Parsed ${all.length} verse records across ${counts.size} books.`,
  );

  const replace = process.argv.includes('--replace');

  /*
   * WEBU translation
   *
   * We use stable IDs so running this importer repeatedly
   * does not create duplicate books, chapters or verses.
   */
  const translationId = 'translation-webu';

  if (replace) {
    console.log('Replacing existing WEBU corpus...');

    await prisma.bibleTranslation.deleteMany({
      where: {
        code: 'WEBU',
      },
    });
  }

  const translation = await prisma.bibleTranslation.upsert({
    where: {
      code: 'WEBU',
    },
    update: {
      name: 'World English Bible Updated',
    },
    create: {
      id: translationId,
      name: 'World English Bible Updated',
      code: 'WEBU',
    },
  });

  console.log(
    `Translation ready: ${translation.name} (${translation.code})`,
  );

  /*
   * Create/update all 66 books.
   */
  const books = new Map<
    string,
    {
      id: string;
      name: string;
      order: number;
    }
  >();

  for (const [code, name, testament, order] of BOOKS) {
    const bookId = `webu-book-${code.toLowerCase()}`;

    const book = await prisma.bibleBook.upsert({
      where: {
        id: bookId,
      },
      update: {
        name,
        order,
        translationId: translation.id,
      },
      create: {
        id: bookId,
        name,
        order,
        translationId: translation.id,
      },
    });

    books.set(code, {
      id: book.id,
      name: book.name,
      order: book.order,
    });

    console.log(
      `${String(order).padStart(2, '0')}/66 ${name}`,
    );
  }

  /*
   * Create/update chapters and verses.
   *
   * We process one book at a time so that:
   * - memory stays low
   * - chapters are guaranteed to exist
   * - verse IDs remain deterministic
   */
  let imported = 0;

  for (const [code] of BOOKS) {
    const book = books.get(code);

    if (!book) {
      throw new Error(`Book not found in map: ${code}`);
    }

    const rows = all.filter((row) => row.code === code);

    const chapterNumbers = [
      ...new Set(rows.map((row) => row.chapter)),
    ].sort((a, b) => a - b);

    const chapterMap = new Map<number, string>();

    for (const chapterNumber of chapterNumbers) {
      const chapterId =
        `webu-chapter-${code.toLowerCase()}-${chapterNumber}`;

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

      chapterMap.set(chapterNumber, chapterId);
    }

    /*
     * Upsert verses in batches.
     *
     * createMany is intentionally not used here because
     * BibleVerse has no @@unique constraint on chapterId + number.
     * Stable IDs allow safe repeated imports.
     */
    for (const row of rows) {
      const chapterId = chapterMap.get(row.chapter);

      if (!chapterId) {
        throw new Error(
          `Chapter ${row.chapter} not found for ${row.book}`,
        );
      }

      const verseSuffix = row.verseEnd
        ? `${row.verseStart}-${row.verseEnd}`
        : `${row.verseStart}`;

      const verseId =
        `webu-verse-${code.toLowerCase()}-${row.chapter}-${verseSuffix}`;

      await prisma.bibleVerse.upsert({
        where: {
          id: verseId,
        },
        update: {
          number: row.verseStart,
          text: row.text,
          chapterId,
        },
        create: {
          id: verseId,
          number: row.verseStart,
          text: row.text,
          chapterId,
        },
      });

      imported++;

      if (imported % 1000 === 0) {
        console.log(
          `Imported ${imported}/${all.length}`,
        );
      }
    }
  }

  console.log('');
  console.log('========================================');
  console.log('WEBU import complete.');
  console.log('========================================');
  console.log(`Translation: WEBU`);
  console.log(`Books:       66`);
  console.log(`Verses:      ${imported}`);
  console.log(
    'Source:      World English Bible Updated (WEBU), public domain.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });