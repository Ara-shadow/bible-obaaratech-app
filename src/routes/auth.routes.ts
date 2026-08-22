import { FastifyInstance } from "fastify";
import { z } from "zod";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";

const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),

  language: z
    .enum(["ENGLISH", "YORUBA", "IGBO", "HAUSA", "PIDGIN", "FRENCH"])
    .optional(),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email(),

  password: z
    .string()
    .min(1)
    .max(200),
});

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  return `${salt}:${hash}`;
}

function verifyPassword(
  password: string,
  stored: string
): boolean {
  const [salt, expected] = stored.split(":");

  if (!salt || !expected) {
    return false;
  }

  const actual = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  const actualBuffer = Buffer.from(actual, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    actualBuffer,
    expectedBuffer
  );
}

function publicUser(user: {
  id: string;
  email: string;
  fullName: string | null;
  language: string;
  role: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    language: user.language,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function authRoutes(app: FastifyInstance) {
  /*
   * MEMBER REGISTRATION
   */
  app.post(
    "/api/auth/register",
    {
      config: {
        rateLimit: {
          max: 8,
          timeWindow: "15 minutes",
        },
      },
    },
    async (request, reply) => {
      const parsed = registerSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: "Invalid registration details",
          details: parsed.error.flatten(),
        });
      }

      const {
        fullName,
        email,
        password,
        language,
      } = parsed.data;

      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser) {
        return reply.code(409).send({
          error: "An account with this email already exists.",
        });
      }

      const user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          fullName,
          email,
          password: hashPassword(password),
          language: language ?? "ENGLISH",
          role: "MEMBER",
        },
      });

      const token = await reply.jwtSign(
        {
          sub: user.id,
          role: user.role,
          email: user.email,
        },
        {
          expiresIn: "30d",
        }
      );

      reply.setCookie(
        "bible_ai_member",
        token,
        {
          httpOnly: true,
          sameSite: "lax",
          secure:
            process.env.COOKIE_SECURE === "true",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        }
      );

      return {
        ok: true,
        user: publicUser(user),
      };
    }
  );

  /*
   * MEMBER LOGIN
   */
  app.post(
    "/api/auth/login",
    {
      config: {
        rateLimit: {
          max: 8,
          timeWindow: "15 minutes",
        },
      },
    },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: "Invalid login details",
        });
      }

      const {
        email,
        password,
      } = parsed.data;

      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (
        !user ||
        !user.password ||
        !verifyPassword(password, user.password)
      ) {
        return reply.code(401).send({
          error: "Invalid email or password.",
        });
      }

      const token = await reply.jwtSign(
        {
          sub: user.id,
          role: user.role,
          email: user.email,
        },
        {
          expiresIn: "30d",
        }
      );

      reply.setCookie(
        "bible_ai_member",
        token,
        {
          httpOnly: true,
          sameSite: "lax",
          secure:
            process.env.COOKIE_SECURE === "true",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        }
      );

      return {
        ok: true,
        user: publicUser(user),
      };
    }
  );

  /*
   * CURRENT MEMBER
   */
  app.get(
    "/api/auth/me",
    async (request, reply) => {
      try {
        const token =
          request.cookies.bible_ai_member;

        if (!token) {
          return reply.code(401).send({
            authenticated: false,
          });
        }

        const payload =
          await app.jwt.verify<{
            sub: string;
            role?: string;
            email?: string;
          }>(token);

        const user =
          await prisma.user.findUnique({
            where: {
              id: payload.sub,
            },
          });

        if (!user) {
          return reply.code(401).send({
            authenticated: false,
          });
        }

        return {
          authenticated: true,
          user: publicUser(user),
        };
      } catch {
        return reply.code(401).send({
          authenticated: false,
        });
      }
    }
  );

  /*
   * MEMBER LOGOUT
   */
  app.post(
    "/api/auth/logout",
    async (_request, reply) => {
      reply.clearCookie(
        "bible_ai_member",
        {
          path: "/",
        }
      );

      return {
        ok: true,
      };
    }
  );
}