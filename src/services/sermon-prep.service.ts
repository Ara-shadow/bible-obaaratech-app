import { prisma } from "../lib/prisma.js";
import { aiComplete } from "../lib/ai.js";
import { BIBLE_AI_SAFEGUARD_PROMPT } from "../lib/safeguard-prompt.js";

export async function prepareSermon(
  topic: string,
  language = "en"
) {
  const primary = await prisma.bibleVerse.findMany({
    where: {
      text: {
        contains: topic,
        mode: "insensitive",
      },
    },
    take: 8,
    orderBy: [
      {
        BibleChapter: {
          number: "asc",
        },
      },
      {
        number: "asc",
      },
    ],
    include: {
      BibleChapter: {
        include: {
          BibleBook: true,
        },
      },
    },
  });

  const primaryReferences = primary.map(
    (verse) =>
      `${verse.BibleChapter.BibleBook.name} ${verse.BibleChapter.number}:${verse.number}`
  );

  const primaryVerseIds = primary.map((verse) => verse.id);

  const related = primaryVerseIds.length
    ? await prisma.crossReference.findMany({
        where: {
          sourceVerseId: {
            in: primaryVerseIds,
          },
        },
        include: {
          targetVerse: {
            select: {
              id: true,
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
          },
        },
        take: 30,
      })
    : [];

  const primaryText = primary
    .map(
      (verse) =>
        `${verse.BibleChapter.BibleBook.name} ${verse.BibleChapter.number}:${verse.number}: ${verse.text}`
    )
    .join("\n");

  const crossReferenceText = related
    .map(
      (row) =>
        `${row.targetVerse.BibleChapter.BibleBook.name} ${row.targetVerse.BibleChapter.number}:${row.targetVerse.number}`
    )
    .join(", ");

  const synthesis = await aiComplete(
    `${BIBLE_AI_SAFEGUARD_PROMPT}
Create a concise sermon-preparation aid.
Separate Scripture observations from AI-assisted commentary.
Do not invent citations.`,
    `Topic: ${topic}

Primary passages:
${primaryText}

Cross references:
${crossReferenceText}`,
    language
  );

  return {
    topic,

    primaryPassages: primary.map((verse) => ({
      reference: `${verse.BibleChapter.BibleBook.name} ${verse.BibleChapter.number}:${verse.number}`,
      text: verse.text,
    })),

    crossReferences: related.map((row) => ({
      reference: `${row.targetVerse.BibleChapter.BibleBook.name} ${row.targetVerse.BibleChapter.number}:${row.targetVerse.number}`,
      text: row.targetVerse.text,
      source: row.source,
    })),

    synthesis,

    matchedReferences: primaryReferences,
  };
}