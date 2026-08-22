import { aiComplete } from "../lib/ai.js";
import { BIBLE_AI_SAFEGUARD_PROMPT } from "../lib/safeguard-prompt.js";
import {
  checkForCrisis,
  crisisPayload,
} from "./crisis-check.service.js";
import { prisma } from "../lib/prisma.js";

const BIBLE_BOOK_PATTERN =
  "(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)";

export async function handleChat(message: string, language = "en") {
  const crisis = checkForCrisis(message, language);

  if (crisis.triggered) {
    return crisisPayload(language);
  }

  const refs = [
    ...message.matchAll(
      new RegExp(
        `\\b${BIBLE_BOOK_PATTERN}\\s+\\d+:\\d+(?:-\\d+)?`,
        "gi"
      )
    ),
  ].map((match) => match[0]);

  let context = "";

  if (refs.length) {
    const passages = await prisma.bibleVerse.findMany({
      where: {
        OR: refs.map((reference) => {
          const match = reference.match(/^(.+?)\s+(\d+):(\d+)/);

          if (!match) {
            return {
              id: "__NO_MATCH__",
            };
          }

          const [, bookName, chapterNumber, verseNumber] = match;

          return {
            AND: [
              {
                number: Number(verseNumber),
              },
              {
                BibleChapter: {
                  number: Number(chapterNumber),
                  BibleBook: {
                    name: {
                      equals: bookName,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          };
        }),
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

    context = passages
      .map(
        (passage) =>
          `${passage.BibleChapter.BibleBook.name} ${passage.BibleChapter.number}:${passage.number}: ${passage.text}`
      )
      .join("\n");
  }

  const answer = await aiComplete(
    `${BIBLE_AI_SAFEGUARD_PROMPT}
Use the supplied Scripture context when available.
Do not invent quotations.

${
  context
    ? `SCRIPTURE CONTEXT:
${context}`
    : ""
}`,
    message,
    language
  );

  return {
    type: "BIBLE_AI",
    language,
    content: answer,
    references: refs,
  };
}