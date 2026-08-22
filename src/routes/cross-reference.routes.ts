import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export async function crossReferenceRoutes(app: FastifyInstance) {
  app.get("/api/cross-references", async (request, reply) => {
    const parsed = z
      .object({
        reference: z.string().trim().min(1).max(120),
        limit: z.coerce.number().int().min(1).max(50).default(20),
      })
      .safeParse(request.query);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid reference",
      });
    }

    const verse = await prisma.bibleVerse.findUnique({
      where: {
        id: parsed.data.reference,
      },
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
    });

    if (!verse) {
      return reply.code(404).send({
        error: "Verse not found",
      });
    }

    const reference =
      `${verse.BibleChapter.BibleBook.name} ` +
      `${verse.BibleChapter.number}:${verse.number}`;

    const rows = await prisma.crossReference.findMany({
      where: {
        sourceVerseId: verse.id,
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
      orderBy: {
        targetVerseId: "asc",
      },
      take: parsed.data.limit,
    });

    return {
      reference,
      text: verse.text,
      source:
        "OpenBible.info cross-reference dataset, primarily TSK-derived",
      crossReferences: rows.map((row) => {
        const target = row.targetVerse;

        return {
          reference:
            `${target.BibleChapter.BibleBook.name} ` +
            `${target.BibleChapter.number}:${target.number}`,
          text: target.text,
          source: row.source,
        };
      }),
    };
  });
}