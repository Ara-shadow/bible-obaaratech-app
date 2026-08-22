import { prisma } from "../lib/prisma.js";
import { aiComplete } from "../lib/ai.js";
import { BIBLE_AI_SAFEGUARD_PROMPT } from "../lib/safeguard-prompt.js";

export interface SearchResult {
  reference: string;
  text: string;
  bookName: string;
  testament: "OT" | "NT";
  genre: string;
}

/**
 * Clean WEBU/USFM Strong's markup from Bible verse text.
 *
 * Examples:
 *
 * Jesus|strong="G2424" said|strong="G3004"
 * becomes:
 * Jesus said
 *
 * \+w Can|strong="G1410"\+w\*
 * becomes:
 * Can
 */function cleanBibleText(text: string): string {
  if (!text) {
    return "";
  }

  return (
    text
      // Remove Strong's number attributes.
      // Example:
      // Jesus|strong="G2424"
      .replace(/\|strong="[^"]*"/gi, "")

      // Remove USFM word-opening markers.
      // Example:
      // \+w
      .replace(/\\\+w\b/gi, "")

      // Remove USFM word-closing markers.
      // Example:
      // \+w\*
      .replace(/\\\+w\\\*/gi, "")

      // Remove remaining escaped asterisks.
      // Example:
      // Son\* -> Son
      // heal\* -> heal
      .replace(/\\\*/g, "")

      // Remove any remaining escaped backslashes.
      .replace(/\\+/g, "")

      // Remove unnecessary spaces before punctuation.
      .replace(/\s+([,.!?;:])/g, "$1")

      // Clean spaces immediately inside quotation marks.
      .replace(/([“"])\s+/g, "$1")
      .replace(/\s+([”"])/g, "$1")

      // Collapse multiple spaces.
      .replace(/\s+/g, " ")

      .trim()
  );
}

/**
 * Determine the testament from the WEBU book order.
 *
 * In the imported WEBU database:
 * Old Testament books come before Matthew,
 * while Matthew and the remaining New Testament
 * books have order numbers >= 70.
 */
function getTestament(bookOrder: number): "OT" | "NT" {
  return bookOrder < 70 ? "OT" : "NT";
}

/**
 * Basic Bible genre classification.
 *
 * This is used for search-result grouping because the
 * current BibleBook model does not contain a genre column.
 */
function getGenre(bookName: string): string {
  const genres: Record<string, string> = {
    Genesis: "Law",
    Exodus: "Law",
    Leviticus: "Law",
    Numbers: "Law",
    Deuteronomy: "Law",

    Joshua: "History",
    Judges: "History",
    Ruth: "History",
    "1 Samuel": "History",
    "2 Samuel": "History",
    "1 Kings": "History",
    "2 Kings": "History",
    "1 Chronicles": "History",
    "2 Chronicles": "History",
    Ezra: "History",
    Nehemiah: "History",
    Esther: "History",

    Job: "Wisdom",
    Psalms: "Poetry",
    Proverbs: "Wisdom",
    Ecclesiastes: "Wisdom",
    "Song of Solomon": "Poetry",

    Isaiah: "Major Prophets",
    Jeremiah: "Major Prophets",
    Lamentations: "Major Prophets",
    Ezekiel: "Major Prophets",
    Daniel: "Major Prophets",

    Hosea: "Minor Prophets",
    Joel: "Minor Prophets",
    Amos: "Minor Prophets",
    Obadiah: "Minor Prophets",
    Jonah: "Minor Prophets",
    Micah: "Minor Prophets",
    Nahum: "Minor Prophets",
    Habakkuk: "Minor Prophets",
    Zephaniah: "Minor Prophets",
    Haggai: "Minor Prophets",
    Zechariah: "Minor Prophets",
    Malachi: "Minor Prophets",

    Matthew: "Gospels",
    Mark: "Gospels",
    Luke: "Gospels",
    John: "Gospels",

    Acts: "History",

    Romans: "Pauline Epistles",
    "1 Corinthians": "Pauline Epistles",
    "2 Corinthians": "Pauline Epistles",
    Galatians: "Pauline Epistles",
    Ephesians: "Pauline Epistles",
    Philippians: "Pauline Epistles",
    Colossians: "Pauline Epistles",
    "1 Thessalonians": "Pauline Epistles",
    "2 Thessalonians": "Pauline Epistles",
    "1 Timothy": "Pauline Epistles",
    "2 Timothy": "Pauline Epistles",
    Titus: "Pauline Epistles",
    Philemon: "Pauline Epistles",

    Hebrews: "General Epistles",
    James: "General Epistles",
    "1 Peter": "General Epistles",
    "2 Peter": "General Epistles",
    "1 John": "General Epistles",
    "2 John": "General Epistles",
    "3 John": "General Epistles",
    Jude: "General Epistles",

    Revelation: "Apocalyptic",
  };

  return genres[bookName] ?? "Bible";
}

async function literalSearch(
  query: string
): Promise<SearchResult[]> {
  const q = query.trim();

  if (!q) {
    return [];
  }

  const rows = await prisma.$queryRaw<
    Array<{
      reference: string;
      text: string;
      bookName: string;
      bookOrder: number;
    }>
  >`
    SELECT
      CONCAT(
        b.name,
        ' ',
        c.number,
        ':',
        v.number
      ) AS reference,

      v.text AS text,

      b.name AS "bookName",

      b."order" AS "bookOrder"

    FROM "BibleVerse" v

    INNER JOIN "BibleChapter" c
      ON c.id = v."chapterId"

    INNER JOIN "BibleBook" b
      ON b.id = c."bookId"

    WHERE
      to_tsvector('simple', v.text)
        @@ plainto_tsquery('simple', ${q})

      OR lower(v.text)
        LIKE lower(${`%${q}%`})

      OR lower(
        CONCAT(
          b.name,
          ' ',
          c.number,
          ':',
          v.number
        )
      ) = lower(${q})

    ORDER BY
      b."order",
      c.number,
      v.number

    LIMIT 50
  `;

  return rows.map((row) => ({
    reference: row.reference,

    // Clean Strong's/USFM markup before sending
    // the result to the frontend.
    text: cleanBibleText(row.text),

    bookName: row.bookName,

    testament: getTestament(row.bookOrder),

    genre: getGenre(row.bookName),
  }));
}

async function expandTerms(
  query: string
): Promise<string[]> {
  try {
    const raw = await aiComplete(
      `${BIBLE_AI_SAFEGUARD_PROMPT}

Return only 5-8 comma-separated Bible-search terms.
Do not explain.`,
      query
    );

    return raw
      .split(",")
      .map((x: string) => x.trim())
      .filter(
        (x: string) =>
          x.length > 0 &&
          x.length < 80
      )
      .slice(0, 8);
  } catch (error) {
    console.error(
      "Error expanding Bible search terms:",
      error
    );

    return [];
  }
}

export async function searchPassages(
  query: string
) {
  let results = await literalSearch(query);

  let expandedTerms: string[] = [];

  /**
   * Only use AI expansion when the direct search
   * returns fewer than 3 results.
   */
  if (results.length < 3) {
    expandedTerms = await expandTerms(query);

    if (expandedTerms.length > 0) {
      const extra = await Promise.all(
        expandedTerms.map((term: string) =>
          literalSearch(term)
        )
      );

      const map = new Map<
        string,
        SearchResult
      >(
        results.map(
          (result: SearchResult) => [
            result.reference,
            result,
          ]
        )
      );

      for (const group of extra) {
        for (const row of group) {
          if (!map.has(row.reference)) {
            map.set(row.reference, row);
          }
        }
      }

      results = [...map.values()].slice(0, 50);
    }
  }

  const byTestament: Record<
    "OT" | "NT",
    SearchResult[]
  > = {
    OT: [],
    NT: [],
  };

  const byGenre: Record<
    string,
    SearchResult[]
  > = {};

  for (const result of results) {
    byTestament[result.testament].push(
      result
    );

    if (!byGenre[result.genre]) {
      byGenre[result.genre] = [];
    }

    byGenre[result.genre].push(result);
  }

  return {
    query,
    expandedTerms,
    results,
    byTestament,
    byGenre,
  };
}