import { FastifyReply, FastifyRequest } from "fastify";

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const payload = request.user as { role?: string };
    if (payload.role !== "admin") return reply.code(403).send({ error: "Admin access required" });
  } catch {
    return reply.code(401).send({ error: "Authentication required" });
  }
}
