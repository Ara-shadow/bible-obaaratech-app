import { FastifyInstance } from "fastify";
import { z } from "zod";
import { searchPassages } from "../services/bible-search.service.js";

export async function searchRoutes(app: FastifyInstance) {
  app.get("/api/search", async (request, reply) => {
    const parsed = z
      .object({
        q: z.string().trim().min(1).max(200),
      })
      .safeParse(request.query);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Query parameter q is required",
      });
    }

    return searchPassages(parsed.data.q);
  });
}