import 'dotenv/config';
import fs from 'node:fs';
import readline from 'node:readline';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client/index.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BOOKS = new Map([
  ["Gen","Genesis"],
  ["Exod","Exodus"],
  ["Lev","Leviticus"],
  ["Num","Numbers"],
  ["Deut","Deuteronomy"],
  ["Josh","Joshua"],
  ["Judg","Judges"],
  ["Ruth","Ruth"],
  ["1Sam","1 Samuel"],
  ["2Sam","2 Samuel"],
  ["1Kgs","1 Kings"],
  ["2Kgs","2 Kings"],
  ["1Chr","1 Chronicles"],
  ["2Chr","2 Chronicles"],
  ["Ezra","Ezra"],
  ["Neh","Nehemiah"],
  ["Esth","Esther"],
  ["Job","Job"],
  ["Ps","Psalms"],
  ["Prov","Proverbs"],
  ["Eccl","Ecclesiastes"],
  ["Song","Song of Solomon"],
  ["Isa","Isaiah"],
  ["Jer","Jeremiah"],
  ["Lam","Lamentations"],
  ["Ezek","Ezekiel"],
  ["Dan","Daniel"],
  ["Hos","Hosea"],
  ["Joel","Joel"],
  ["Amos","Amos"],
  ["Obad","Obadiah"],
  ["Jonah","Jonah"],
  ["Mic","Micah"],
  ["Nah","Nahum"],
  ["Hab","Habakkuk"],
  ["Zeph","Zephaniah"],
  ["Hag","Haggai"],
  ["Zech","Zechariah"],
  ["Mal","Malachi"],
  ["Matt","Matthew"],
  ["Mark","Mark"],
  ["Luke","Luke"],
  ["John","John"],
  ["Acts","Acts"],
  ["Rom","Romans"],
  ["1Cor","1 Corinthians"],
  ["2Cor","2 Corinthians"],
  ["Gal","Galatians"],
  ["Eph","Ephesians"],
  ["Phil","Philippians"],
  ["Col","Colossians"],
  ["1Thess","1 Thessalonians"],
  ["2Thess","2 Thessalonians"],
  ["1Tim","1 Timothy"],
  ["2Tim","2 Timothy"],
  ["Titus","Titus"],
  ["Phlm","Philemon"],
  ["Heb","Hebrews"],
  ["Jas","James"],
  ["1Pet","1 Peter"],
  ["2Pet","2 Peter"],
  ["1John","1 John"],
  ["2John","2 John"],
  ["3John","3 John"],
  ["Jude","Jude"],
  ["Rev","Revelation"]
]);

function parseVerse(value) {
  const m = value.match(/^(.+?)\.(\d+)\.(\d+)(?:-(.+?)\.(\d+)\.(\d+))?$/);
  if (!m) return null;
  const book = BOOKS.get(m[1]);
  if (!book) return null;
  return { book, chapter: Number(m[2]), verse: Number(m[3]) };
}

async function main() {
  const file = process.env.CROSSREF_FILE || 'data/cross-references/cross_references.txt';
  const replace = process.argv.includes('--replace');
  const passageRows = await prisma.passage.findMany({ select: { id: true, reference: true } });
  const passageMap = new Map(passageRows.map(p => [p.reference, p.id]));
  console.log(`Loaded ${passageMap.size} Bible passages.`);

  if (replace) {
    await prisma.crossReference.deleteMany({});
    console.log('Existing cross-references removed.');
  }

  const rl = readline.createInterface({ input: fs.createReadStream(file, {encoding:'utf8'}), crlfDelay: Infinity });
  let lineNo = 0, inserted = 0, skipped = 0;
  const batch = [];
  for await (const line of rl) {
    lineNo++;
    if (lineNo === 1 || !line.trim()) continue;
    const [fromRaw, toRaw] = line.split('\t');
    const from = parseVerse((fromRaw || '').trim());
    const to = parseVerse((toRaw || '').trim());
    if (!from || !to) { skipped++; continue; }
    const fromRef = `${from.book} ${from.chapter}:${from.verse}`;
    const toRef = `${to.book} ${to.chapter}:${to.verse}`;
    const passageId = passageMap.get(fromRef);
    const relatedPassageId = passageMap.get(toRef);
    if (!passageId || !relatedPassageId || passageId === relatedPassageId) { skipped++; continue; }
    batch.push({ passageId, relatedPassageId, source: 'OpenBible TSK-derived (CC BY)' });
    if (batch.length >= 1000) {
      await prisma.crossReference.createMany({ data: batch, skipDuplicates: true });
      inserted += batch.length; batch.length = 0;
      if (inserted % 10000 === 0) console.log(`Processed ${inserted} cross-reference rows...`);
    }
  }
  if (batch.length) { await prisma.crossReference.createMany({ data: batch, skipDuplicates: true }); inserted += batch.length; }
  console.log(`Cross-reference import complete. Processed ${inserted} rows; skipped ${skipped}.`);
  console.log('Source: OpenBible.info cross-reference dataset, primarily TSK-derived; retain CC BY attribution.');
}

main().catch(err => { console.error(err); process.exitCode = 1; }).finally(() => prisma.$disconnect());
