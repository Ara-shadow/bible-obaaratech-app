import { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../../lib/prisma.js";
import { requireAdmin } from "../../middleware/require-admin.js";
import { ContentStatus, ContentType } from "../../generated/prisma/enums.js";

const vibeSchema = z.object({
  title: z.string().trim().min(1).max(200),
  reflection: z.string().trim().min(1).max(10000),
  imageUrl: z.string().url().optional().or(z.literal("")),
  language: z.string().default("en"),
  published: z.boolean().optional(),
  scripture: z.string().trim().max(5000).optional(),
});

export async function adminVibesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdmin);

  /**
   * GET ALL BIBLE VIBES
   */
  app.get("/api/admin/vibes", async () => {
    return prisma.content.findMany({
      where: {
        type: ContentType.BIBLE_VIBE,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  });

  /**
   * CREATE BIBLE VIBE
   */
  app.post("/api/admin/vibes", async (req, reply) => {
    const parsed = vibeSchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid vibe",
        details: parsed.error.flatten(),
      });
    }

    const {
      title,
      reflection,
      imageUrl,
      language,
      published,
      scripture,
    } = parsed.data;

    const cleanLanguage =
      language.trim().toUpperCase() === "EN"
        ? "ENGLISH"
        : language.trim().toUpperCase();

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

    return prisma.content.create({
      data: {
        id: crypto.randomUUID(),
        title,
        slug,
        type: ContentType.BIBLE_VIBE,
        status:
          published === true
            ? ContentStatus.PUBLISHED
            : ContentStatus.DRAFT,
        summary: reflection.slice(0, 500),
        body: reflection,
        scripture: scripture || null,
        imageUrl: imageUrl || null,
        language: selectedLanguage,
        publishedAt:
          published === true ? new Date() : null,
      },
    });
  });

  /**
   * UPDATE BIBLE VIBE
   */
  app.put("/api/admin/vibes/:id", async (req, reply) => {
    const parsed = vibeSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid vibe",
        details: parsed.error.flatten(),
      });
    }

    const params = req.params as { id: string };

    const existing = await prisma.content.findFirst({
      where: {
        id: params.id,
        type: ContentType.BIBLE_VIBE,
      },
    });

    if (!existing) {
      return reply.code(404).send({
        error: "Bible Vibe not found",
      });
    }

    const {
      title,
      reflection,
      imageUrl,
      language,
      published,
      scripture,
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

    if (reflection !== undefined) {
      updateData.body = reflection;
      updateData.summary = reflection.slice(0, 500);
    }

    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl || null;
    }

    if (scripture !== undefined) {
      updateData.scripture = scripture || null;
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
   * PUBLISH BIBLE VIBE
   */
  app.patch("/api/admin/vibes/:id/publish", async (req, reply) => {
    const params = req.params as { id: string };

    const existing = await prisma.content.findFirst({
      where: {
        id: params.id,
        type: ContentType.BIBLE_VIBE,
      },
    });

    if (!existing) {
      return reply.code(404).send({
        error: "Bible Vibe not found",
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
   * UNPUBLISH BIBLE VIBE
   */
  app.patch("/api/admin/vibes/:id/unpublish", async (req, reply) => {
    const params = req.params as { id: string };

    const existing = await prisma.content.findFirst({
      where: {
        id: params.id,
        type: ContentType.BIBLE_VIBE,
      },
    });

    if (!existing) {
      return reply.code(404).send({
        error: "Bible Vibe not found",
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
   * DELETE BIBLE VIBE
   */
  app.delete("/api/admin/vibes/:id", async (req, reply) => {
    const params = req.params as { id: string };

    const existing = await prisma.content.findFirst({
      where: {
        id: params.id,
        type: ContentType.BIBLE_VIBE,
      },
    });

    if (!existing) {
      return reply.code(404).send({
        error: "Bible Vibe not found",
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