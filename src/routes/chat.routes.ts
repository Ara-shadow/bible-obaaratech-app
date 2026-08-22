import { FastifyInstance } from "fastify";
import { z } from "zod";
import { handleChat } from "../services/bible-chat.service.js";

const schema = z.object({
  message: z.string().trim().min(1).max(5000),
  language: z.string().default("en"),
});

export async function chatRoutes(app: FastifyInstance) {
  app.post("/api/chat", async (request, reply) => {
    const parsed = schema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid chat request",
        details: parsed.error.flatten(),
      });
    }

    return handleChat(parsed.data.message, parsed.data.language);
  });
}