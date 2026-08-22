import "dotenv/config";

import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";

import path from "node:path";
import crypto from "node:crypto";

import { z } from "zod";

import { prisma } from "./lib/prisma.js";

import { chatRoutes } from "./routes/chat.routes.js";
import { searchRoutes } from "./routes/search.routes.js";
import { sermonPrepRoutes } from "./routes/sermon-prep.routes.js";
import { crossReferenceRoutes } from "./routes/cross-reference.routes.js";
import { publicContentRoutes } from "./routes/public/content.public.routes.js";
import { adminVibesRoutes } from "./routes/admin/vibes.admin.routes.js";
import { adminStoriesRoutes } from "./routes/admin/stories.admin.routes.js";
import { memberAuthRoutes } from "./routes/member/auth.member.routes.js";

/*
|--------------------------------------------------------------------------
| Environment
|--------------------------------------------------------------------------
*/

const env = z
  .object({
    PORT: z.coerce
      .number()
      .int()
      .min(1)
      .max(65535)
      .default(4000),

    FRONTEND_ORIGIN: z
      .string()
      .url(),

    JWT_SECRET: z
      .string()
      .min(32),

    ADMIN_USERNAME: z
      .string()
      .min(3),

    ADMIN_PASSWORD_HASH: z
      .string()
      .regex(/^[a-f0-9]{32}:[a-f0-9]{128}$/i),

    COOKIE_SECURE: z
      .enum(["true", "false"])
      .default("true"),
  })
  .parse(process.env);

/*
|--------------------------------------------------------------------------
| Password verification
|--------------------------------------------------------------------------
*/

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

  const a = Buffer.from(actual, "hex");
  const b = Buffer.from(expected, "hex");

  return (
    a.length === b.length &&
    crypto.timingSafeEqual(a, b)
  );
}

/*
|--------------------------------------------------------------------------
| Fastify application
|--------------------------------------------------------------------------
*/

const app = Fastify({
  logger: true,
  trustProxy: true,
});

/*
|--------------------------------------------------------------------------
| Frontend path
|--------------------------------------------------------------------------
|
| process.cwd() must be the project root.
|
| Local:
|   bible-obaaratech-app/
|
| cPanel:
|   /home/christch/bible.obaaratech.com.ng/
|
*/

const projectRoot = process.cwd();

const frontendDist = path.resolve(
  projectRoot,
  "frontend",
  "dist"
);

app.log.info(
  `Project root: ${projectRoot}`
);

app.log.info(
  `Frontend dist: ${frontendDist}`
);

/*
|--------------------------------------------------------------------------
| Application bootstrap
|--------------------------------------------------------------------------
|
| IMPORTANT:
| We intentionally put all awaited Fastify registration/startup
| inside this function.
|
| This prevents top-level await from appearing in the production
| module graph and makes the application compatible with cPanel
| LiteSpeed Passenger.
|
|--------------------------------------------------------------------------
*/

async function bootstrap(): Promise<void> {
  /*
  |--------------------------------------------------------------------------
  | Static frontend
  |--------------------------------------------------------------------------
  */

  await app.register(
    fastifyStatic,
    {
      root: frontendDist,
      prefix: "/",
      wildcard: true,
      decorateReply: true,
    }
  );

  /*
  |--------------------------------------------------------------------------
  | CORS
  |--------------------------------------------------------------------------
  */

  await app.register(
    cors,
    {
      origin: env.FRONTEND_ORIGIN,
      credentials: true,
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Cookies
  |--------------------------------------------------------------------------
  */

  await app.register(cookie);

  /*
  |--------------------------------------------------------------------------
  | JWT
  |--------------------------------------------------------------------------
  */

  await app.register(
    jwt,
    {
      secret: env.JWT_SECRET,

      cookie: {
        cookieName: "bible_ai_admin",
        signed: false,
      },
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Rate limiting
  |--------------------------------------------------------------------------
  */

  await app.register(
    rateLimit,
    {
      max: 60,
      timeWindow: "1 minute",
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Health check
  |--------------------------------------------------------------------------
  */

  app.get(
    "/health",
    async () => {
      return {
        ok: true,
        service: "bible-ai",
      };
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Admin login
  |--------------------------------------------------------------------------
  */

  app.post(
    "/api/admin/login",
    {
      config: {
        rateLimit: {
          max: 8,
          timeWindow: "15 minutes",
        },
      },
    },
    async (
      request,
      reply
    ) => {
      const parsed = z
        .object({
          username: z
            .string()
            .trim()
            .min(1)
            .max(100),

          password: z
            .string()
            .min(1)
            .max(200),
        })
        .safeParse(request.body);

      if (
        !parsed.success ||
        parsed.data.username !==
          env.ADMIN_USERNAME ||
        !verifyPassword(
          parsed.data.password,
          env.ADMIN_PASSWORD_HASH
        )
      ) {
        return reply
          .code(401)
          .send({
            error: "Invalid credentials",
          });
      }

      const token =
        await reply.jwtSign(
          {
            role: "admin",
            username:
              env.ADMIN_USERNAME,
          },
          {
            expiresIn: "8h",
          }
        );

      reply.setCookie(
        "bible_ai_admin",
        token,
        {
          httpOnly: true,

          sameSite: "lax",

          secure:
            env.COOKIE_SECURE ===
            "true",

          path: "/",

          maxAge:
            60 * 60 * 8,
        }
      );

      return {
        ok: true,
      };
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Current admin session
  |--------------------------------------------------------------------------
  */

  app.get(
    "/api/admin/me",
    async (
      request,
      reply
    ) => {
      try {
        await request.jwtVerify();

        const user =
          request.user as {
            username?: string;
          };

        return {
          authenticated: true,

          username:
            user.username ??
            env.ADMIN_USERNAME,
        };
      } catch {
        return reply
          .code(401)
          .send({
            authenticated:
              false,
          });
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Admin logout
  |--------------------------------------------------------------------------
  */

  app.post(
    "/api/admin/logout",
    async (
      _request,
      reply
    ) => {
      reply.clearCookie(
        "bible_ai_admin",
        {
          path: "/",
        }
      );

      return {
        ok: true,
      };
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Application routes
  |--------------------------------------------------------------------------
  */

  await app.register(
    chatRoutes
  );

  await app.register(
    searchRoutes
  );

  await app.register(
    sermonPrepRoutes
  );

  await app.register(
    crossReferenceRoutes
  );

  await app.register(
    publicContentRoutes
  );

  await app.register(
    adminVibesRoutes
  );

  await app.register(
    adminStoriesRoutes
  );

  await app.register(
    memberAuthRoutes
  );

  /*
  |--------------------------------------------------------------------------
  | Frontend fallback
  |--------------------------------------------------------------------------
  |
  | Allows React routes such as:
  |
  | /
  | /login
  | /register
  | /member
  | /admin
  | /admin/login
  |
  */

  app.setNotFoundHandler(
    async (
      request,
      reply
    ) => {
      const acceptsHtml =
        String(
          request.headers.accept ??
            ""
        ).includes("text/html");

      if (
        acceptsHtml &&
        !request.url.startsWith(
          "/api/"
        )
      ) {
        return reply.sendFile(
          "index.html"
        );
      }

      return reply
        .code(404)
        .send({
          error: "Not found",
        });
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Prisma cleanup
  |--------------------------------------------------------------------------
  */

  app.addHook(
    "onClose",
    async () => {
      await prisma.$disconnect();
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Start server
  |--------------------------------------------------------------------------
  */

  await app.listen({
    port: env.PORT,
    host: "0.0.0.0",
  });

  app.log.info(
    `Bible AI server running on port ${env.PORT}`
  );
}

/*
|--------------------------------------------------------------------------
| Start application
|--------------------------------------------------------------------------
*/

bootstrap().catch(
  async (error) => {
    app.log.error(error);

    await prisma.$disconnect();

    process.exit(1);
  }
);