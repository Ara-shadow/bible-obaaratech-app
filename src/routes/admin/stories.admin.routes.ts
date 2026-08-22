import { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../../lib/prisma.js";
import { requireAdmin } from "../../middleware/require-admin.js";
import { ContentStatus, ContentType } from "../../generated/prisma/enums.js";

const storySchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(30000),
  ageRange: z.string().max(80).optional(),
  moralLesson: z.string().max(5000).optional(),
  prayer: z.string().max(5000).optional(),
  activity: z.string().max(5000).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  language: z.string().default("en"),
  published: z.boolean().optional(),
  questions: z.any().optional(),
});

function buildStoryBody(data: {
  body?: string;
  ageRange?: string;
  moralLesson?: string;
  prayer?: string;
  activity?: string;
  questions?: unknown;
}) {
  const sections: string[] = [];

  if (data.ageRange) {
    sections.push(`Age Range:\n${data.ageRange}`);
  }

  if (data.body) {
    sections.push(`Story:\n${data.body}`);
  }

  if (data.moralLesson) {
    sections.push(`Moral Lesson:\n${data.moralLesson}`);
  }

  if (data.prayer) {
    sections.push(`Prayer:\n${data.prayer}`);
  }

  if (data.activity) {
    sections.push(`Activity:\n${data.activity}`);
  }

  if (data.questions !== undefined) {
    sections.push(
      `Questions:\n${JSON.stringify(data.questions, null, 2)}`
    );
  }

  return sections.join("\n\n");
}

function extractStoryData(body: string) {
  return {
    body,
  };
}

export async function adminStoriesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdmin);

  /**
   * GET ALL STORIES
   */
  app.get("/api/admin/stories", async () => {
    return prisma.content.findMany({
      where: {
        type: ContentType.SUNDAY_SCHOOL,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  });

  /**
   * CREATE STORY
   */
  app.post("/api/admin/stories", async (req, reply) => {
    const parsed = storySchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid story",
        details: parsed.error.flatten(),
      });
    }

    const {
      title,
      body,
      ageRange,
      moralLesson,
      prayer,
      activity,
      imageUrl,
      language,
      published,
      questions,
    } = parsed.data;

    const cleanLanguage = language.trim().toUpperCase();

    const validLanguages = [
      "ENGLISH",
      "YORUBA",
      "IGBO",
      "HAUSA",
      "PIDGIN",
      "FRENCH",
    ] as const;

    const selectedLanguage = validLanguages.includes(
      cleanLanguage as (typeof validLanguages)[number]
    )
      ? (cleanLanguage as (typeof validLanguages)[number])
      : "ENGLISH";

    const slugBase = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const slug = `${slugBase}-${Date.now()}`;

    const fullBody = buildStoryBody({
      body,
      ageRange,
      moralLesson,
      prayer,
      activity,
      questions,
    });

    return prisma.content.create({
      data: {
        id: crypto.randomUUID(),
        title,
        slug,
        type: ContentType.SUNDAY_SCHOOL,
        status:
          published === true
            ? ContentStatus.PUBLISHED
            : ContentStatus.DRAFT,
        summary: moralLesson || body.slice(0, 500),
        body: fullBody,
        imageUrl: imageUrl || null,
        language: selectedLanguage,
        publishedAt:
          published === true ? new Date() : null,
      },
    });
  });

  /**
   * UPDATE STORY
   */
  app.put("/api/admin/stories/:id", async (req, reply) => {
    const parsed = storySchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid story",
        details: parsed.error.flatten(),
      });
    }

    const params = req.params as { id: string };

    const existing = await prisma.content.findFirst({
      where: {
        id: params.id,
        type: ContentType.SUNDAY_SCHOOL,
      },
    });

    if (!existing) {
      return reply.code(404).send({
        error: "Story not found",
      });
    }

    const {
      title,
      body,
      ageRange,
      moralLesson,
      prayer,
      activity,
      imageUrl,
      language,
      published,
      questions,
    } = parsed.data;

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      updateData.title = title;

      updateData.slug =
        `${title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")}-${Date.now()}`;
    }

    const bodyChanged =
      body !== undefined ||
      ageRange !== undefined ||
      moralLesson !== undefined ||
      prayer !== undefined ||
      activity !== undefined ||
      questions !== undefined;

    if (bodyChanged) {
      updateData.body = buildStoryBody({
        body,
        ageRange,
        moralLesson,
        prayer,
        activity,
        questions,
      });

      updateData.summary =
        moralLesson ||
        body?.slice(0, 500) ||
        existing.summary ||
        "";
    }

    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl || null;
    }

    if (language !== undefined) {
      const cleanLanguage = language.trim().toUpperCase();

      const validLanguages = [
        "ENGLISH",
        "YORUBA",
        "IGBO",
        "HAUSA",
        "PIDGIN",
        "FRENCH",
      ] as const;

      if (
        validLanguages.includes(
          cleanLanguage as (typeof validLanguages)[number]
        )
      ) {
        updateData.language = cleanLanguage;
      }
    }

    if (published !== undefined) {
      updateData.status = published
        ? ContentStatus.PUBLISHED
        : ContentStatus.DRAFT;

      updateData.publishedAt = published
        ? existing.publishedAt ?? new Date()
        : null;
    }

    return prisma.content.update({
      where: {
        id: params.id,
      },
      data: updateData,
    });
  });

  /**
   * PUBLISH STORY
   */
  app.patch("/api/admin/stories/:id/publish", async (req, reply) => {
    const params = req.params as { id: string };

    const existing = await prisma.content.findFirst({
      where: {
        id: params.id,
        type: ContentType.SUNDAY_SCHOOL,
      },
    });

    if (!existing) {
      return reply.code(404).send({
        error: "Story not found",
      });
    }

    return prisma.content.update({
      where: {
        id: params.id,
      },
      data: {
        status: ContentStatus.PUBLISHED,
        publishedAt: existing.publishedAt ?? new Date(),
      },
    });
  });

  /**
   * UNPUBLISH STORY
   */
  app.patch("/api/admin/stories/:id/unpublish", async (req, reply) => {
    const params = req.params as { id: string };

    const existing = await prisma.content.findFirst({
      where: {
        id: params.id,
        type: ContentType.SUNDAY_SCHOOL,
      },
    });

    if (!existing) {
      return reply.code(404).send({
        error: "Story not found",
      });
    }

    return prisma.content.update({
      where: {
        id: params.id,
      },
      data: {
        status: ContentStatus.DRAFT,
        publishedAt: null,
      },
    });
  });

  /**
   * DELETE STORY
   */
  app.delete("/api/admin/stories/:id", async (req, reply) => {
    const params = req.params as { id: string };

    const existing = await prisma.content.findFirst({
      where: {
        id: params.id,
        type: ContentType.SUNDAY_SCHOOL,
      },
    });

    if (!existing) {
      return reply.code(404).send({
        error: "Story not found",
      });
    }

    await prisma.content.delete({
      where: {
        id: params.id,
      },
    });

    return reply.code(204).send();
  });
}