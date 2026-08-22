import { FastifyInstance } from "fastify";
import { z } from "zod";
import crypto from "node:crypto";

import { prisma } from "../../lib/prisma.js";

const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),

  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .max(200),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),

  language: z
    .enum([
      "ENGLISH",
      "YORUBA",
      "IGBO",
      "HAUSA",
      "PIDGIN",
      "FRENCH",
    ])
    .optional()
    .default("ENGLISH"),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .max(200),

  password: z
    .string()
    .min(1, "Password is required")
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
  storedPassword: string
): boolean {
  const parts = storedPassword.split(":");

  const salt = parts[0];
  const expectedHash = parts[1];

  if (!salt || !expectedHash) {
    return false;
  }

  try {
    const actualHash = crypto
      .scryptSync(password, salt, 64)
      .toString("hex");

    const actual = Buffer.from(
      actualHash,
      "hex"
    );

    const expected = Buffer.from(
      expectedHash,
      "hex"
    );

    if (actual.length !== expected.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      actual,
      expected
    );
  } catch {
    return false;
  }
}

function memberCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure:
      process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function memberAuthRoutes(
  app: FastifyInstance
) {
  /*
   * MEMBER REGISTRATION
   */
  app.post(
    "/api/member/register",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "15 minutes",
        },
      },
    },
    async (request, reply) => {
      const parsed =
        registerSchema.safeParse(
          request.body
        );

      if (!parsed.success) {
        return reply
          .code(400)
          .send({
            error:
              "Invalid registration details",
            details:
              parsed.error.flatten(),
          });
      }

      const {
        fullName,
        email,
        password,
        language,
      } = parsed.data;

      const normalizedEmail =
        email.toLowerCase();

      const existingUser =
        await prisma.user.findUnique({
          where: {
            email: normalizedEmail,
          },
        });

      if (existingUser) {
        return reply
          .code(409)
          .send({
            error:
              "An account with this email already exists.",
          });
      }

      const user =
        await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            email: normalizedEmail,
            fullName,
            password:
              hashPassword(password),
            language,
            role: "MEMBER",
          },

          select: {
            id: true,
            email: true,
            fullName: true,
            language: true,
            role: true,
            createdAt: true,
          },
        });

      const token =
        await app.jwt.sign(
          {
            type: "member",
            userId: user.id,
            email: user.email,
            role: user.role,
          },
          {
            expiresIn: "30d",
          }
        );

      reply.setCookie(
        "bible_ai_member",
        token,
        memberCookieOptions()
      );

      return reply
        .code(201)
        .send({
          ok: true,
          user,
        });
    }
  );

  /*
   * MEMBER LOGIN
   */
  app.post(
    "/api/member/login",
    {
      config: {
        rateLimit: {
          max: 8,
          timeWindow: "15 minutes",
        },
      },
    },
    async (request, reply) => {
      const parsed =
        loginSchema.safeParse(
          request.body
        );

      if (!parsed.success) {
        return reply
          .code(400)
          .send({
            error:
              "Invalid login details",
            details:
              parsed.error.flatten(),
          });
      }

      const {
        email,
        password,
      } = parsed.data;

      const normalizedEmail =
        email.toLowerCase();

      const user =
        await prisma.user.findUnique({
          where: {
            email: normalizedEmail,
          },
        });

      if (
        !user ||
        !user.password ||
        !verifyPassword(
          password,
          user.password
        )
      ) {
        return reply
          .code(401)
          .send({
            error:
              "Invalid email or password.",
          });
      }

      if (user.role === "ADMIN") {
        return reply
          .code(403)
          .send({
            error:
              "Please use the administrator login.",
          });
      }

      const token =
        await app.jwt.sign(
          {
            type: "member",
            userId: user.id,
            email: user.email,
            role: user.role,
          },
          {
            expiresIn: "30d",
          }
        );

      reply.setCookie(
        "bible_ai_member",
        token,
        memberCookieOptions()
      );

      return {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          language: user.language,
          role: user.role,
        },
      };
    }
  );

  /*
   * CURRENT MEMBER
   */
  app.get(
    "/api/member/me",
    async (request, reply) => {
      const token =
        request.cookies?.bible_ai_member;

      if (!token) {
        return reply
          .code(401)
          .send({
            authenticated: false,
          });
      }

      try {
        const decoded =
          app.jwt.verify<{
            type?: string;
            userId?: string;
          }>(token);

        if (
          decoded.type !== "member" ||
          !decoded.userId
        ) {
          return reply
            .code(401)
            .send({
              authenticated: false,
            });
        }

        const user =
          await prisma.user.findUnique({
            where: {
              id: decoded.userId,
            },

            select: {
              id: true,
              email: true,
              fullName: true,
              language: true,
              role: true,
              createdAt: true,
            },
          });

        if (!user) {
          reply.clearCookie(
            "bible_ai_member",
            {
              path: "/",
            }
          );

          return reply
            .code(401)
            .send({
              authenticated: false,
            });
        }

        return {
          authenticated: true,
          user,
        };
      } catch {
        reply.clearCookie(
          "bible_ai_member",
          {
            path: "/",
          }
        );

        return reply
          .code(401)
          .send({
            authenticated: false,
          });
      }
    }
  );

  /*
   * MEMBER LOGOUT
   */
  app.post(
    "/api/member/logout",
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
