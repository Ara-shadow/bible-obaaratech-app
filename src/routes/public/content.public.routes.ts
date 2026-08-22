import { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";

export async function publicContentRoutes(app: FastifyInstance) {
  app.get("/api/content/vibes", async () => {
    return prisma.bibleVibe.findMany({
      where: {
        published: true,
      },
      orderBy: {
        publishDate: "desc",
      },
      take: 30,
    });
  });

  app.get("/api/content/stories", async () => {
    return prisma.story.findMany({
      where: {
        published: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
    });
  });
}