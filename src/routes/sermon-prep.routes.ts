import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prepareSermon } from "../services/sermon-prep.service.js";
import { BIBLE_AI_SAFEGUARD_PROMPT } from "../lib/safeguard-prompt.js";

const sermonPrepSchema = z.object({
  topic: z.string().trim().min(2).max(200),
  language: z.string().trim().default("en"),
});

export async function sermonPrepRoutes(app: FastifyInstance) {
  app.post("/api/sermon-prep", async (request, reply) => {
    const parsed = sermonPrepSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid sermon preparation request",
        details: parsed.error.flatten(),
      });
    }

    try {
      const result = await prepareSermon(
        parsed.data.topic,
        parsed.data.language,
      );

      return reply.send({
        ...result,
        safeguard: BIBLE_AI_SAFEGUARD_PROMPT,
      });
    } catch (error) {
      request.log.error(error);

      return reply.code(500).send({
        error: "Unable to prepare sermon at this time",
      });
    }
  });
}